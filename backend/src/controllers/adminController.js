const admin = require('firebase-admin');
const User = require('../models/User');
const Clinic = require('../models/Clinic');

const addUser = async (req, res) => {
  try {
    const { name, email, password, role, clinicId } = req.body;
    
    // Security check: ClinicAdmin is restricted to Doctor/Receptionist roles bound to their own clinic
    let targetClinicId = clinicId;
    if (req.user && req.user.role === 'ClinicAdmin') {
      targetClinicId = req.user.clinicId.toString();
      if (role !== 'Doctor' && role !== 'Receptionist') {
        return res.status(403).json({ message: 'Not authorized to create this role' });
      }
    }

    // 1. Create in Firebase Auth
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Create in MongoDB
    const user = await User.create({
      name,
      email,
      password, // Still keep hash in DB as backup, though Firebase is primary
      role,
      clinicId: targetClinicId,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      firebaseUid: firebaseUser.uid
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      // Security check: ClinicAdmin is restricted to managing staff in their own clinic
      if (req.user && req.user.role === 'ClinicAdmin' && (!user.clinicId || user.clinicId.toString() !== req.user.clinicId.toString())) {
        return res.status(403).json({ message: 'Not authorized to manage this staff' });
      }
      user.isActive = !user.isActive;
      await user.save();
      res.json({ message: `User status updated to ${user.isActive ? 'Active' : 'Suspended'}` });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClinics = async (req, res) => {
  try {
    if (req.user && req.user.role === 'ClinicAdmin') {
      const clinics = await Clinic.find({ _id: req.user.clinicId });
      return res.json(clinics);
    }
    const clinics = await Clinic.find({});
    res.json(clinics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addClinic = async (req, res) => {
  try {
    const { name, address, operatingHours, averageConsultationTime } = req.body;
    const clinic = await Clinic.create({
      name,
      address,
      operatingHours,
      averageConsultationTime
    });
    res.status(201).json(clinic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateClinic = async (req, res) => {
  try {
    const { name, address, operatingHours, averageConsultationTime } = req.body;
    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      { name, address, operatingHours, averageConsultationTime },
      { new: true }
    );
    if (clinic) {
      res.json(clinic);
    } else {
      res.status(404).json({ message: 'Clinic not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStaff = async (req, res) => {
  try {
    let queryClinicId = req.params.clinicId;
    
    // Security check: ClinicAdmin is restricted to their own clinic's staff
    if (req.user && req.user.role === 'ClinicAdmin') {
      queryClinicId = req.user.clinicId.toString();
    }
    
    const users = await User.find(queryClinicId ? { clinicId: queryClinicId } : {});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addUser,
  toggleUserStatus,
  addClinic,
  getClinics,
  updateClinic,
  getStaff
};
