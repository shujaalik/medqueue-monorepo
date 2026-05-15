const admin = require('firebase-admin');

const initFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (!admin.apps.length) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      console.log('Using Firebase URL:', process.env.FIREBASE_DATABASE_URL);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
      console.log('Firebase Admin Initialized');
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
};

const db = () => admin.database();

module.exports = { initFirebase, db };
