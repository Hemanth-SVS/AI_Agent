const express = require('express');
const { getPollingStation } = require('../controllers/pollingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getPollingStation);

module.exports = router;