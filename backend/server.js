const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import database connection
const { testConnection, testSimpleQuery } = require('./config/database');

// Import route modules
const coursesRoutes = require('./routes/courses');
const modulesRoutes = require('./routes/modules');
const lessonsRoutes = require('./routes/lessons');
const userProgressRoutes = require('./routes/user_progress');
const favoritesRoutes = require('./routes/favorites');
const categoriesRoutes = require('./routes/categories');
const regionsRoutes = require('./routes/regions');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
console.log('🔧 CORS Debug - ALLOWED_ORIGINS env var:', process.env.ALLOWED_ORIGINS);
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];
console.log('🔧 CORS Debug - Parsed origins:', allowedOrigins);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
};
console.log('🔧 CORS Debug - Final options:', corsOptions);
app.use(cors(corsOptions));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'eduweb-backend',
    version: '2.0.0',
    database: dbStatus ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/courses', coursesRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/user_progress', userProgressRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/regions', regionsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /health',
      'GET /api/courses',
      'GET /api/modules',
      'GET /api/lessons',
      'GET /api/user_progress',
      'GET /api/favorites',
      'GET /api/categories',
      'GET /api/regions'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 EDU WEB Backend running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('📚 Available API Endpoints:');
  console.log(`   GET/POST/PUT/DELETE /api/courses`);
  console.log(`   GET/POST/PUT/DELETE /api/modules`);
  console.log(`   GET/POST/PUT/DELETE /api/lessons`);
  console.log(`   GET/POST/PUT/DELETE /api/user_progress`);
  console.log(`   GET/POST/PUT/DELETE /api/favorites`);
  console.log(`   GET/POST/PUT/DELETE /api/categories`);
  console.log(`   GET/POST/PUT/DELETE /api/regions`);
  console.log('');
  
  // Test database connection on startup
  console.log('🔌 Testing database connection...');
  const dbConnected = await testConnection();
  
  if (dbConnected) {
    // If connection test passed, try a simple query
    await testSimpleQuery();
  } else {
    console.log('⚠️  Database connection failed. Check your .env configuration.');
    console.log('   Required: SUPABASE_URL, SUPABASE_ANON_KEY');
  }
});

module.exports = app;