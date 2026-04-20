const mongoose = require('mongoose');

const sessionParticipantSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['joined', 'left'],
    default: 'joined',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate joins
sessionParticipantSchema.index({ sessionId: 1, userId: 1 }, { unique: true });
sessionParticipantSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('SessionParticipant', sessionParticipantSchema);
