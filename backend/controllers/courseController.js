const Course = require('../models/Course');
const Task = require('../models/Task');
const TimetableEntry = require('../models/TimetableEntry');

// GET /api/courses — list user's courses with real progress
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.user._id })
      .sort({ status: 1, name: 1 })
      .lean();

    // Compute real progress for each course from linked tasks
    const enriched = await Promise.all(
      courses.map(async (course) => {
        const tasks = await Task.find({
          userId: req.user._id,
          courseId: course._id,
        }).lean();

        const total = tasks.length;
        const completed = tasks.filter((t) => t.status === 'completed').length;
        const pending = tasks.filter((t) => t.status === 'pending').length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Count overdue
        const now = new Date();
        const overdue = tasks.filter((t) => t.status === 'pending' && new Date(t.deadline) < now).length;

        // Get timetable slots for this course
        const slots = await TimetableEntry.find({
          userId: req.user._id,
          courseId: course._id,
        }).select('day startTime endTime').lean();

        // Next upcoming deadline
        const nextDeadline = tasks
          .filter((t) => t.status === 'pending' && new Date(t.deadline) > now)
          .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];

        return {
          ...course,
          stats: { total, completed, pending, overdue, progress },
          schedule: slots,
          nextDeadline: nextDeadline ? { title: nextDeadline.title, deadline: nextDeadline.deadline } : null,
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

// POST /api/courses — create course
const createCourse = async (req, res) => {
  try {
    const { name, code, professor, color, credits } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Course name and code are required' });
    }

    // Check duplicate code for this user
    const existing = await Course.findOne({ userId: req.user._id, code: code.toUpperCase(), status: 'active' });
    if (existing) {
      return res.status(409).json({ error: `Course ${code} already exists` });
    }

    const course = await Course.create({
      userId: req.user._id,
      name,
      code: code.toUpperCase(),
      professor: professor || '',
      color: color || '#5b8af5',
      credits: credits || 3,
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create course' });
  }
};

// PUT /api/courses/:id
const updateCourse = async (req, res) => {
  try {
    const { name, code, professor, color, credits, status } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (code !== undefined) update.code = code.toUpperCase();
    if (professor !== undefined) update.professor = professor;
    if (color !== undefined) update.color = color;
    if (credits !== undefined) update.credits = credits;
    if (status !== undefined) update.status = status;

    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      update,
      { new: true }
    );
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update course' });
  }
};

// DELETE /api/courses/:id — also unlinks tasks and timetable entries
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Unlink tasks (don't delete them, just remove courseId)
    await Task.updateMany(
      { userId: req.user._id, courseId: course._id },
      { courseId: null }
    );

    // Unlink timetable entries
    await TimetableEntry.updateMany(
      { userId: req.user._id, courseId: course._id },
      { courseId: null }
    );

    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

// POST /api/courses/:id/link-task/:taskId — link a task to a course
const linkTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const course = await Course.findOne({ _id: id, userId: req.user._id });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId: req.user._id },
      { courseId: id },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to link task' });
  }
};

module.exports = { getCourses, createCourse, updateCourse, deleteCourse, linkTask };
