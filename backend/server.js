const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

console.log('--- Startup Debugging ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI present:', !!process.env.MONGODB_URI);
console.log('------------------------');

// Route imports
const authRoutes = require('./routes/auth');
const facultyRoutes = require('./routes/faculty');
const departmentRoutes = require('./routes/departments');
const dutyRoutes = require('./routes/duties');
const timetableRoutes = require('./routes/timetables');
const allotmentRoutes = require('./routes/allotment');
const subjectRoutes = require('./routes/subjects');
const path = require('path');

// Initialize Express
const app = express();

// --- Middleware ---
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Serve Static Files in Production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EDASapp Backend',
    timestamp: new Date().toISOString()
  });
});

// --- Welcome Route ---
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the EDASapp API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      duties: '/api/duties'
    }
  });
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/duties', dutyRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/allotment', allotmentRoutes);
app.use('/api/subjects', subjectRoutes);

// --- 404 Handler ---
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.path.startsWith('/api')) {
    return res.sendFile(path.resolve(__dirname, '../', 'dist', 'index.html'));
  }
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// --- Global Error Handler ---
app.use(errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n🚀 EDASapp Backend running on PORT ${PORT}`);
    console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🔑 Auth:       POST http://localhost:${PORT}/api/auth/login`);
    console.log(`📚 Duties:     GET  http://localhost:${PORT}/api/duties`);
    console.log(`👥 Faculty:    GET  http://localhost:${PORT}/api/faculty`);
    console.log(`🏢 Depts:      GET  http://localhost:${PORT}/api/departments`);
    console.log(`📅 Timetables: GET  http://localhost:${PORT}/api/timetables`);
    console.log(`⚡ Allotment:  POST http://localhost:${PORT}/api/allotment/run\n`);
  });
};

startServer();
