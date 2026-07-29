/**
 * Firebase Cloud Functions - Main Entry Point
 * StockSense Backend API
 */

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const stocksRoutes = require('./routes/stocks.routes');
const signalsRoutes = require('./routes/signals.routes');
const holdingsRoutes = require('./routes/holdings.routes');
const watchlistRoutes = require('./routes/watchlist.routes');
const alertsRoutes = require('./routes/alerts.routes');
const usersRoutes = require('./routes/users.routes');
const aiRoutes = require('./routes/ai.routes');

// Initialize Express app
const app = express();

// Global Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection middleware for serverless cold starts & connection reuse
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Failed to connect to DB in request middleware:', error);
    next(error);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'StockSense API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes - Mounted under base paths
app.use('/api/stocks', stocksRoutes);       // Market data endpoints
app.use('/api/signals', signalsRoutes);     // Trading signals
app.use('/api/holdings', holdingsRoutes);   // Portfolio tracking
app.use('/api/watchlist', watchlistRoutes); // Watchlist management
app.use('/api/alerts', alertsRoutes);       // Price alerts
app.use('/api/users', usersRoutes);         // User management
app.use('/api/ai', aiRoutes);               // AI-powered Q&A

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last middleware)
app.use(errorHandler);

// Export as Firebase Cloud Function
exports.api = functions.https.onRequest(app);

// ============================================================================
// Scheduled Cloud Functions
// ============================================================================

// Update signal performance metrics daily
exports.updateSignalPerformance = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Running signal performance update...');
    return null;
  });

// Check price alerts every 5 minutes
exports.checkAlerts = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    console.log('Checking price alerts...');
    const alertsController = require('./controllers/alerts.controller');
    const req = {};
    const res = {
      status: (code) => ({
        json: (data) => {
          console.log(`Alert check completed: ${data.triggered || 0} alerts triggered`);
          return data;
        }
      })
    };
    const next = (error) => console.error('Alert check error:', error);
    await alertsController.checkAlerts(req, res, next);
    return null;
  });

// Clean expired cache entries daily
exports.cleanExpiredCache = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Cleaning expired cache...');
    return null;
  });
