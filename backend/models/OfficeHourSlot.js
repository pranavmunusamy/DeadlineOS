const mongoose = require('mongoose');

const officeHourSlotSchema = new mongoose.Schema({
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
  professorName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  professorEmail: {
    type: String,
    default: '',
    trim: true,
    maxlength: 200,
  },
  courseName: {
    type: String,
    default: '',
    trim: true,
  },
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  startTime: {
    type: String,
    required: true, // "14:00"
  },
  endTime: {
    type: String,
    required: true, // "16:00"
  },
  location: {
    type: String,
    default: '',
    trim: true,
  },
  capacity: {
    type: Number,
    default: 1,
    min: 1,
    max: 20,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

officeHourSlotSchema.index({ userId: 1 });

module.exports = mongoose.model('OfficeHourSlot', officeHourSlotSchema);
