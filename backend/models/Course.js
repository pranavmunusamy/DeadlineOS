const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  code: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
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
  credits: {
    type: Number,
    default: 3,
    min: 1,
    max: 10,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

courseSchema.index({ userId: 1, status: 1 });
courseSchema.index({ userId: 1, code: 1 });

module.exports = mongoose.model('Course', courseSchema);
