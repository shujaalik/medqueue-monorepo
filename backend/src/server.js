const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initFirebase } = require('./config/firebase');
const { initWhatsApp } = require('./services/whatsappService');
const { initQueueMonitor } = require('./services/queueMonitor');

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Initialize Services
initFirebase();
initWhatsApp();
initQueueMonitor();

app.use(cors({
  origin: (origin, callback) => {
    // Dynamically allow any origin, reflecting it back to support local IP changes
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/queue', require('./routes/queueRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

app.get('/', (req, res) => {
  res.send('MedQueue API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
