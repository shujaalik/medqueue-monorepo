const express = require('express');
const router = express.Router();
const { getExpandedNotes } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/expand-notes', protect, getExpandedNotes);

module.exports = router;
