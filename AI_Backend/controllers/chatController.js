const geminiService = require('../services/geminiService');
const memoryService = require('../services/memoryService');

exports.chat = async (req, res) => {
  try {
    const { message, sessionId, userId } = req.body;

    if (!message || !sessionId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing: message, sessionId, userId',
        timestamp: new Date().toISOString()
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
        timestamp: new Date().toISOString()
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long (max 5000 characters)',
        timestamp: new Date().toISOString()
      });
    }

    const chatResponse = await geminiService.chat(userId, sessionId, message.trim());
    const userMemory = await memoryService.getUserMemory(userId);

    res.status(200).json({
      success: true,
      message: chatResponse.message,
      userId,
      sessionId,
      userMemory: userMemory.rememberedDetails,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CONTROLLER ERROR]', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};

exports.getConversationHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    const conversations = await memoryService.getUserConversations(userId);

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[HISTORY ERROR]', error);
    res.status(500).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

exports.clearHistory = async (req, res) => {
  try {
    const { userId, sessionId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    await memoryService.clearConversation(userId, sessionId);

    res.status(200).json({
      success: true,
      message: 'History cleared',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};