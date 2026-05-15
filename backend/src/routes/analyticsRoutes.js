const express = require('express');
const router = express.Router();
const { getDashboardStats, getClinicInfo } = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/:clinicId', protect, adminOnly, getDashboardStats);
router.get('/clinic/:clinicId', getClinicInfo); // Public route for patient status

module.exports = router;
