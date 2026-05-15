const mongoose = require('mongoose');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const Clinic = require('../src/models/Clinic');
const User = require('../src/models/User');

dotenv.config();

// Initialize Firebase Admin for Seeding
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // 1. Create a Clinic
    let clinic = await Clinic.findOne({ name: 'MedQueue Central Clinic' });
    if (!clinic) {
      clinic = await Clinic.create({
        name: 'MedQueue Central Clinic',
        address: '123 Healthcare Blvd, Medical City',
        operatingHours: '09:00 AM - 05:00 PM',
        averageConsultationTime: 15
      });
      console.log('Clinic created:', clinic._id);
    }

    // 2. Create an Admin User
    const adminEmail = 'admin@medqueue.com';
    const adminPassword = 'adminpassword123';
    
    // Always try to create in Firebase (in case MongoDB exists but Firebase doesn't)
    try {
      await admin.auth().getUserByEmail(adminEmail);
      console.log('Firebase: Admin user already exists');
    } catch (e) {
      await admin.auth().createUser({ email: adminEmail, password: adminPassword, displayName: 'Super Admin' });
      console.log('Firebase: Admin user created');
    }

    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'Super Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'Admin',
        clinicId: clinic._id
      });
      console.log('MongoDB: Admin record created');
    }

    // 3. Create a Doctor
    const doctorEmail = 'doctor@medqueue.com';
    const doctorPassword = 'doctorpassword123';

    try {
      await admin.auth().getUserByEmail(doctorEmail);
      console.log('Firebase: Doctor user already exists');
    } catch (e) {
      await admin.auth().createUser({ email: doctorEmail, password: doctorPassword, displayName: 'John Doe' });
      console.log('Firebase: Doctor user created');
    }

    const doctorExists = await User.findOne({ email: doctorEmail });
    if (!doctorExists) {
      await User.create({
        name: 'John Doe',
        email: doctorEmail,
        password: doctorPassword,
        role: 'Doctor',
        clinicId: clinic._id
      });
      console.log('MongoDB: Doctor record created');
    }

    console.log('Seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
