const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  deadline: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'LOW',
  },
  priorityScore: {
    type: Number,
    default: 0,
  },
  source: {
    type: String,
    enum: ['email', 'manual'],
    required: true,
  },
  sourceEmail: {
    subject: { type: String, default: '' },
    from: { type: String, default: '' },
    messageId: { type: String, default: '' },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, deadline: 1 });
taskSchema.index({ userId: 1, 'sourceEmail.messageId': 1 });

module.exports = mongoose.model('Task', taskSchema);
