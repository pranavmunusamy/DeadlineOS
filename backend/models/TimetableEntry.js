const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
  },
  courseName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  day: {
    type: String,
    required: true,
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  startTime: {
    type: String,
    required: true, // "09:00" format
  },
  endTime: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: '',
    trim: true,
    maxlength: 100,
  },
  professor: {
    type: String,
    default: '',
    trim: true,
    maxlength: 100,
  },
  color: {
    type: String,
    default: '#5b8af5',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

timetableEntrySchema.index({ userId: 1, day: 1 });
timetableEntrySchema.index({ userId: 1, courseId: 1 });

module.exports = mongoose.model('TimetableEntry', timetableEntrySchema);
