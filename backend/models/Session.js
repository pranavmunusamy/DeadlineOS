const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  hostUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    default: '',
    maxlength: 1000,
  },
  type: {
    type: String,
    enum: ['OPEN', 'PRIVATE'],
    default: 'OPEN',
  },
  courseTag: {
    type: String,
    trim: true,
    default: '',
  },
  topicTags: [{
    type: String,
    trim: true,
  }],
  maxParticipants: {
    type: Number,
    required: true,
    min: 2,
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

sessionSchema.index({ status: 1, type: 1 });
sessionSchema.index({ bookingId: 1 });
sessionSchema.index({ courseTag: 1 });
sessionSchema.index({ hostUserId: 1 });

module.exports = mongoose.model('Session', sessionSchema);
