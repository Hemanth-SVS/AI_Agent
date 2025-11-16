require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const chatRoutes = require('./routes/chatRoutes');
const validateEnv = require('./utils/envValidator');

// Validate environment variables
validateEnv();

const app = express();
const MODEL_NAME = process.env.GEMINI_MODEL;


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', process.env.FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check
const healthCheck = require('./utils/healthCheck');
app.get('/health', async (req, res) => {
  const health = await healthCheck();
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.use('/api/chat', chatRoutes);

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/voter-agent-db', { 
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log('\n====================================');
  console.log('✅ AI Agent Backend Server Started');
  console.log('Port:', PORT);
  console.log('Model:', MODEL_NAME);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('====================================\n');
});

// Handle port already in use error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use. Please:`);
    console.error(`1. Stop the process using port ${PORT}`);
    console.error(`2. Or change PORT in .env file`);
    console.error(`\nTo find what's using the port, run:`);
    console.error(`   netstat -ano | findstr :${PORT}`);
    console.error(`Then kill the process: taskkill /PID <PID> /F\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  process.exit(0);
});
