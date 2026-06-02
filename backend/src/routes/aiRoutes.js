const express = require('express');
const router = express.Router();
const { getExpandedNotes, consultAIScribe } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/expand-notes', protect, getExpandedNotes);
router.post('/discuss', protect, consultAIScribe);

module.exports = router;
