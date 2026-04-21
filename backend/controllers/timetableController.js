const TimetableEntry = require('../models/TimetableEntry');
const Course = require('../models/Course');

// GET /api/timetable — fetch user's timetable
const getTimetable = async (req, res) => {
  try {
    const entries = await TimetableEntry.find({ userId: req.user._id })
      .populate('courseId', 'name code color')
      .sort({ day: 1, startTime: 1 })
      .lean();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
};

// POST /api/timetable — add entry
const addEntry = async (req, res) => {
  try {
    const { courseName, courseId, day, startTime, endTime, location, professor, color } = req.body;

    if (!courseName || !day || !startTime || !endTime) {
      return res.status(400).json({ error: 'Course name, day, start time, and end time are required' });
    }

    // Validate no time overlap for same user on same day
    const overlap = await TimetableEntry.findOne({
      userId: req.user._id,
      day,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });
    if (overlap) {
      return res.status(409).json({ error: `Time conflict with ${overlap.courseName} (${overlap.startTime}–${overlap.endTime})` });
    }

    // If courseId provided, verify it belongs to user and pull color
    let entryColor = color || '#5b8af5';
    if (courseId) {
      const course = await Course.findOne({ _id: courseId, userId: req.user._id });
      if (course) entryColor = course.color;
    }

    const entry = await TimetableEntry.create({
      userId: req.user._id,
      courseId: courseId || null,
      courseName,
      day,
      startTime,
      endTime,
      location: location || '',
      professor: professor || '',
      color: entryColor,
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Add timetable entry error:', error);
    res.status(500).json({ error: 'Failed to add entry' });
  }
};

// PUT /api/timetable/:id — edit entry
const updateEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseName, courseId, day, startTime, endTime, location, professor, color } = req.body;

    // Overlap check (exclude self)
    if (day && startTime && endTime) {
      const overlap = await TimetableEntry.findOne({
        userId: req.user._id,
        _id: { $ne: id },
        day,
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      });
      if (overlap) {
        return res.status(409).json({ error: `Time conflict with ${overlap.courseName}` });
      }
    }

    const update = {};
    if (courseName !== undefined) update.courseName = courseName;
    if (courseId !== undefined) update.courseId = courseId || null;
    if (day !== undefined) update.day = day;
    if (startTime !== undefined) update.startTime = startTime;
    if (endTime !== undefined) update.endTime = endTime;
    if (location !== undefined) update.location = location;
    if (professor !== undefined) update.professor = professor;
    if (color !== undefined) update.color = color;

    const entry = await TimetableEntry.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      update,
      { new: true }
    );

    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
};

// DELETE /api/timetable/:id
const deleteEntry = async (req, res) => {
  try {
    const entry = await TimetableEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
};

module.exports = { getTimetable, addEntry, updateEntry, deleteEntry };
