const express = require('express');
const router = express.Router();
const { addUser, toggleUserStatus, updateClinic, getStaff, addClinic, getClinics } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/users', protect, adminOnly, addUser);
router.get('/users/:clinicId', protect, adminOnly, getStaff);
router.get('/users', protect, adminOnly, getStaff); // All staff
router.put('/users/:id/toggle', protect, adminOnly, toggleUserStatus);

router.get('/clinics', protect, adminOnly, getClinics);
router.post('/clinics', protect, adminOnly, addClinic);
router.put('/clinic/:id', protect, adminOnly, updateClinic);

module.exports = router;
