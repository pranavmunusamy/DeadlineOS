const { fetchEmails } = require('../services/gmailService');
const { extractDeadlinesFromEmails } = require('../services/deadlineExtractor');
const { calculatePriority } = require('../services/priorityEngine');
const Task = require('../models/Task');

const syncEmails = async (req, res) => {
  try {
    const user = req.user;

    if (!user.googleTokens?.access_token) {
      return res.status(400).json({ error: 'Gmail not connected. Please re-authenticate.' });
    }

    const maxResults = Math.min(parseInt(req.query.count) || 100, 200);
    const daysBack = Math.min(parseInt(req.query.days) || 30, 90);

    // Fetch emails with improved query filters and lookback window
    const emails = await fetchEmails(user.googleTokens, maxResults, { daysBack });

    if (emails.length === 0) {
      return res.json({ message: 'No emails found matching deadline patterns', tasksCreated: 0 });
    }

    // Extract deadlines (v2: includes relative dates, time, confidence scoring)
    const extracted = extractDeadlinesFromEmails(emails);

    // Filter out duplicates by messageId
    const existingMessageIds = await Task.find({
      userId: user._id,
      'sourceEmail.messageId': { $in: extracted.map((t) => t.sourceEmail.messageId) },
    }).distinct('sourceEmail.messageId');

    const existingSet = new Set(existingMessageIds);
    const newTasks = extracted.filter(
      (t) => !existingSet.has(t.sourceEmail.messageId)
    );

    // Also filter out tasks whose deadlines already passed
    const now = new Date();
    const relevantTasks = newTasks.filter((t) => t.deadline >= now);

    // Create tasks with priority
    const tasksToInsert = relevantTasks.map((task) => {
      const { priority, priorityScore } = calculatePriority(task.deadline);
      return {
        userId: user._id,
        title: task.title,
        deadline: task.deadline,
        status: 'pending',
        priority,
        priorityScore,
        source: 'email',
        sourceEmail: task.sourceEmail,
      };
    });

    let created = [];
    if (tasksToInsert.length > 0) {
      created = await Task.insertMany(tasksToInsert);
    }

    // Update last sync time
    user.lastEmailSync = new Date();
    await user.save();

    res.json({
      message: `Synced ${emails.length} emails, extracted ${created.length} new deadline${created.length !== 1 ? 's' : ''}`,
      emailsFetched: emails.length,
      candidatesFound: extracted.length,
      duplicatesSkipped: extracted.length - newTasks.length,
      pastDeadlinesSkipped: newTasks.length - relevantTasks.length,
      tasksCreated: created.length,
      tasks: created,
    });
  } catch (error) {
    console.error('Email sync error:', error);

    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return res.status(401).json({
        error: 'Gmail token expired. Please re-authenticate.',
      });
    }

    res.status(500).json({ error: 'Failed to sync emails' });
  }
};

module.exports = { syncEmails };
