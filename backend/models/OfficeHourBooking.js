const mongoose = require('mongoose');

const officeHourBookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OfficeHourSlot',
    required: true,
  },
  // Specific date of the booking (e.g., "2026-04-27" for a Monday slot)
  bookingDate: {
    type: Date,
    required: true,
  },
  message: {
    type: String,
    default: '',
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled'],
    default: 'confirmed',
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
  emailSentAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

officeHourBookingSchema.index({ userId: 1, status: 1 });
officeHourBookingSchema.index({ slotId: 1, bookingDate: 1 });

module.exports = mongoose.model('OfficeHourBooking', officeHourBookingSchema);
