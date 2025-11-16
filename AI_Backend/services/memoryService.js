const Conversation = require('../models/Conversation');
const UserMemory = require('../models/UserMemory');

class MemoryService {
  async getUserMemory(userId) {
    try {
      let memory = await UserMemory.findOne({ userId });

      if (!memory) {
        memory = await UserMemory.create({
          userId,
          rememberedDetails: {},
          preferences: { language: 'en' },
          interactionHistory: {
            totalConversations: 0,
            completedTasks: []
          }
        });
      }

      return memory;
    } catch (error) {
      console.error('[MEMORY SERVICE ERROR]', error);
      throw error;
    }
  }

  async updateUserMemory(userId, updates) {
    try {
      const memory = await this.getUserMemory(userId);
      memory.rememberedDetails = { ...memory.rememberedDetails, ...updates };
      memory.updatedAt = new Date();
      await memory.save();
      
      console.log('[MEMORY UPDATED]', Object.keys(updates));
      return memory;
    } catch (error) {
      console.error('[UPDATE MEMORY ERROR]', error);
      throw error;
    }
  }

  async getConversationHistory(sessionId) {
    try {
      const conversation = await Conversation.findOne({ sessionId });
      return conversation ? conversation.messages : [];
    } catch (error) {
      console.error('[GET HISTORY ERROR]', error);
      return [];
    }
  }

  async saveConversation(userId, sessionId, message) {
    try {
      let conversation = await Conversation.findOne({ sessionId });

      if (!conversation) {
        conversation = new Conversation({
          userId,
          sessionId,
          messages: []
        });
      }

      conversation.messages.push(message);
      conversation.metadata.messageCount = conversation.messages.length;
      conversation.metadata.lastActivity = new Date();

      await conversation.save();
      console.log('[CONVERSATION SAVED]', sessionId);
      return conversation;
    } catch (error) {
      console.error('[SAVE CONVERSATION ERROR]', error);
      throw error;
    }
  }

  async getUserConversations(userId) {
    try {
      return await Conversation.find({ userId }).sort({ 'metadata.lastActivity': -1 });
    } catch (error) {
      console.error('[GET USER CONVERSATIONS ERROR]', error);
      return [];
    }
  }

  async clearConversation(userId, sessionId) {
    try {
      if (sessionId) {
        await Conversation.deleteOne({ sessionId });
        console.log('[CONVERSATION CLEARED]', sessionId);
      } else {
        await Conversation.deleteMany({ userId });
        console.log('[ALL CONVERSATIONS CLEARED]', userId);
      }
    } catch (error) {
      console.error('[CLEAR CONVERSATION ERROR]', error);
      throw error;
    }
  }
}

module.exports = new MemoryService();