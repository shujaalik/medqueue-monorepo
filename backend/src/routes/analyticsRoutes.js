const express = require('express');
const router = express.Router();
const { getDashboardStats, getClinicInfo, getClinicAIAnalysis } = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/:clinicId', protect, adminOnly, getDashboardStats);
router.get('/ai-summary/:clinicId', protect, adminOnly, getClinicAIAnalysis);
router.get('/clinic/:clinicId', getClinicInfo); // Public route for patient status

module.exports = router;
