const express = require('express');
const router = express.Router();
const { addUser, toggleUserStatus, updateClinic, getStaff, addClinic, getClinics } = require('../controllers/adminController');
const { protect, adminOnly, superAdminOnly } = require('../middleware/authMiddleware');

router.post('/users', protect, adminOnly, addUser);
router.get('/users/:clinicId', protect, adminOnly, getStaff);
router.get('/users', protect, adminOnly, getStaff); // All staff
router.put('/users/:id/toggle', protect, adminOnly, toggleUserStatus);

router.get('/clinics', protect, adminOnly, getClinics);
router.post('/clinics', protect, superAdminOnly, addClinic);
router.put('/clinic/:id', protect, superAdminOnly, updateClinic);

module.exports = router;
