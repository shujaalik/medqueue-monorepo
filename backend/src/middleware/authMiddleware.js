const admin = require('firebase-admin');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Find user by email (Firebase email matches MongoDB email)
      req.user = await User.findOne({ email: decodedToken.email }).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found in database' });
      }
      
      next();
    } catch (error) {
      console.error('Firebase Auth Error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, adminOnly };
