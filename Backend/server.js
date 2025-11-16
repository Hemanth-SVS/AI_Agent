require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const validateEnv = require('./utils/envValidator');
const logger = require('./utils/logger');

// Validate environment variables
validateEnv();

// Import routes
const authRoutes = require('./routes/authRoutes');
const registerRoutes = require('./routes/registerRoutes');
const searchRoutes = require('./routes/searchRoutes');
const otpRoutes = require('./routes/otpRoutes'); // <-- FIXED
const pollingRoutes = require('./routes/pollingRoutes'); // <-- FIXED
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to database
connectDB().catch(err => {
  logger.error('Database connection failed', err);
  process.exit(1);
});

// CORS - Allow frontend access
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // <-- FIXED
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from Frontend folder
const frontendPath = path.join(__dirname, '../Frontend');
app.use(express.static(frontendPath));

// Health check
const healthCheck = require('./utils/healthCheck');
app.get('/api/health', async (req, res) => {
  const health = await healthCheck();
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.use('/api/auth', authRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/otp', otpRoutes); // <-- FIXED
app.use('/api/polling', pollingRoutes); // <-- FIXED

// Catch-all for non-existent API routes
app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: 'API route not found' });
});

// Error handler (BEFORE wildcard route)
app.use(errorHandler);

// Serve index.html for all non-API routes (MUST be LAST)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Serving frontend from: ${frontendPath}`);
  logger.info(`API health: http://localhost:${PORT}/api/health`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle port already in use error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Please:`);
    logger.error(`1. Stop the process using port ${PORT}`);
    logger.error(`2. Or change PORT in .env file`);
    logger.error(`\nTo find what's using the port, run:`);
    logger.error(`   netstat -ano | findstr :${PORT}`);
    logger.error(`Then kill the process: taskkill /PID <PID> /F`);
    process.exit(1);
  } else {
    logger.error('Server error:', err);
    process.exit(1);
  }
});