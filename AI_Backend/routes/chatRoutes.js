const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/message', chatController.chat);
router.get('/history/:userId', chatController.getConversationHistory);
router.post('/clear', chatController.clearHistory);

module.exports = router;