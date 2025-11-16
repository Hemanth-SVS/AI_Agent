const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  functionCalled: String,
  functionResult: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: [messageSchema],
  metadata: {
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true
    },
    messageCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

conversationSchema.pre('save', function(next) {
  if (this.messages.length > 0) {
    const firstUserMsg = this.messages.find(m => m.role === 'user');
    if (firstUserMsg) {
      this.title = firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
    }
  }
  this.updatedAt = Date.now();
  this.metadata.messageCount = this.messages.length;
  this.metadata.lastActivity = Date.now();
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);