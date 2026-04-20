const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Critical index for overlap detection and availability queries
bookingSchema.index({ roomId: 1, startTime: 1, endTime: 1, status: 1 });
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ startTime: 1, endTime: 1 });

// Validate duration: min 30 mins, max 2 hours
bookingSchema.pre('validate', function (next) {
  if (this.startTime && this.endTime) {
    const durationMs = this.endTime - this.startTime;
    const durationMins = durationMs / 60000;
    if (durationMins < 30) {
      return next(new Error('Minimum booking duration is 30 minutes'));
    }
    if (durationMins > 120) {
      return next(new Error('Maximum booking duration is 2 hours'));
    }
    if (this.endTime <= this.startTime) {
      return next(new Error('End time must be after start time'));
    }
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
