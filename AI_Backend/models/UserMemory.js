const mongoose = require('mongoose');

const userMemorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: String,
  rememberedDetails: {
    fullName: String,
    fatherName: String,
    dob: String,
    gender: String,
    mobile: String,
    aadhaar: String,
    voterId: String,
    address: String,
    state: String,
    district: String,
    authToken: String,
    lastApplicationId: String,
    registrationStatus: String,
    // Agent-specific memory
    email: String,
    password: String
  },
  preferences: {
    language: {
      type: String,
      default: 'en'
    }
  },
  interactionHistory: {
    totalConversations: {
      type: Number,
      default: 0
    },
    lastInteraction: Date,
    completedTasks: [String]
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

userMemorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

userMemorySchema.index({ 'createdAt': -1 });
userMemorySchema.index({ 'updatedAt': -1 });

module.exports = mongoose.model('UserMemory', userMemorySchema);