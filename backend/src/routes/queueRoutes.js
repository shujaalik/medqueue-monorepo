const express = require('express');
const router = express.Router();
const { addPatient, nextPatient, setAbsent, clearQueue, finishSession, setBreak, getClinicsPublic } = require('../controllers/queueController');
const { protect } = require('../middleware/authMiddleware');

router.get('/clinics', getClinicsPublic);
router.post('/register', addPatient);
router.post('/next', protect, nextPatient);
router.post('/absent', protect, setAbsent);
router.post('/reset', protect, clearQueue);
router.post('/finish', protect, finishSession);
router.post('/break', protect, setBreak);

module.exports = router;
