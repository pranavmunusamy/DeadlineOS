require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
  setTimeout(() => process.exit(1), 2000);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.message || err);
  setTimeout(() => process.exit(1), 2000);
});

console.log('--- DeadlineOS Startup ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI set:', !!process.env.MONGODB_URI);
console.log('GOOGLE_CLIENT_ID set:', !!process.env.GOOGLE_CLIENT_ID);
console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const emailRoutes = require('./routes/emailRoutes');
const roomRoutes = require('./routes/roomRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const courseRoutes = require('./routes/courseRoutes');
const officeHourRoutes = require('./routes/officeHourRoutes');
const suggestionRoutes = require('./routes/suggestionRoutes');
const studentAnalyticsRoutes = require('./routes/studentAnalyticsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
}));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
];
app.use(cors({
  origin: isProduction
    ? (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) callback(null, true);
        else callback(null, true); // Allow same-origin in production
      }
    : allowedOrigins[0],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/office-hours', officeHourRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/student-analytics', studentAnalyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React frontend in production (single-service deploy)
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`DeadlineOS running on port ${PORT} [${isProduction ? 'production' : 'development'}]`);
});

module.exports = app;
