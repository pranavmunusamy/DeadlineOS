const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 50,
  },
  building: {
    type: String,
    required: true,
    trim: true,
  },
  floor: {
    type: Number,
    default: 1,
  },
  features: [{
    type: String,
    enum: ['whiteboard', 'projector', 'monitor', 'power_outlets', 'video_conf', 'quiet_zone'],
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

roomSchema.index({ building: 1, name: 1 });
roomSchema.index({ isActive: 1 });

module.exports = mongoose.model('Room', roomSchema);
