/**
 * Firebase Cloud Functions - Main Entry Point
 * StockSense Backend API
 */

// Load environment variables from .env file (for local development)
// In production/emulator, Firebase Functions will use functions:config
if (process.env.FUNCTIONS_EMULATOR === 'true' || !process.env.FIREBASE_CONFIG) {
  require('dotenv').config({ path: '../.env' });
  console.log('📝 Loaded environment variables from .env file');
}

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

// Health check endpoint (before DB middleware - doesn't need DB)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'StockSense API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.FUNCTIONS_EMULATOR === 'true' ? 'emulator' : 'production',
  });
});

// Database connection middleware for serverless cold starts & connection reuse
// Applies to all routes EXCEPT /health and /test
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Failed to connect to DB in request middleware:', error);
    next(error);
  }
});

// ============================================================================
// TEST ENDPOINTS (FOR DEVELOPMENT ONLY - REMOVE BEFORE PRODUCTION DEPLOY)
// ============================================================================
if (process.env.FUNCTIONS_EMULATOR === 'true') {
  console.log('🧪 Registering test endpoints...');
  
  // Lazy-load services only when endpoints are called
  // Test Finnhub API
  app.get('/test/finnhub/:ticker', async (req, res, next) => {
    try {
      const { ticker } = req.params;
      console.log(`📊 Testing Finnhub API for ${ticker}...`);
      
      // Lazy-load service
      const marketDataService = require('./services/marketDataService');
      
      const quote = await marketDataService.getQuote(ticker);
      const fundamentals = await marketDataService.getFundamentals(ticker);
      
      res.json({
        success: true,
        test: 'Finnhub API',
        ticker,
        data: {
          quote,
          fundamentals
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Test Signal Engine
  app.get('/test/signal/:ticker', async (req, res, next) => {
    try {
      const { ticker } = req.params;
      console.log(`🎯 Testing Signal Engine for ${ticker}...`);
      
      // Lazy-load services
      const marketDataService = require('./services/marketDataService');
      const signalEngineService = require('./services/signalEngineService');
      
      const quote = await marketDataService.getQuote(ticker);
      const fundamentals = await marketDataService.getFundamentals(ticker);
      const news = await marketDataService.getCompanyNews(ticker);
      const historical = await marketDataService.getHistoricalPrices(ticker);
      
      // Format data for signal engine
      const signalData = {
        ticker,
        prices: historical,
        fundamentals,
        newsHeadlines: news.map(n => n.headline)
      };
      
      const signal = await signalEngineService.generateSignal(signalData);
      
      res.json({
        success: true,
        test: 'Signal Engine',
        ticker,
        signal
      });
    } catch (error) {
      next(error);
    }
  });

  // Test Gemini AI
  app.get('/test/gemini/:ticker', async (req, res, next) => {
    try {
      const { ticker } = req.params;
      console.log(`🤖 Testing Gemini AI for ${ticker}...`);
      
      // Lazy-load services
      const marketDataService = require('./services/marketDataService');
      const signalEngineService = require('./services/signalEngineService');
      const geminiService = require('./services/geminiService');
      const { buildSignalExplanationPrompt, SHORT_DISCLAIMER } = require('./utils/promptTemplates');
      
      const quote = await marketDataService.getQuote(ticker);
      const fundamentals = await marketDataService.getFundamentals(ticker);
      const news = await marketDataService.getCompanyNews(ticker);
      const historical = await marketDataService.getHistoricalPrices(ticker);
      const marketData = { quote, fundamentals, news };
      
      // Format data for signal engine
      const signalData = {
        ticker,
        prices: historical,
        fundamentals,
        newsHeadlines: news.map(n => n.headline)
      };
      
      const signal = await signalEngineService.generateSignal(signalData);
      
      const prompt = buildSignalExplanationPrompt(ticker, signal, marketData);
      const explanation = await geminiService.generateText(prompt);
      
      res.json({
        success: true,
        test: 'Gemini AI',
        ticker,
        signal: signal.signal,
        confidence: signal.confidence,
        explanation,
        disclaimer: SHORT_DISCLAIMER
      });
    } catch (error) {
      next(error);
    }
  });

  // Test Full Signal Generation (All integrated)
  app.get('/test/full-signal/:ticker', async (req, res, next) => {
    try {
      const { ticker } = req.params;
      console.log(`🚀 Testing FULL signal generation for ${ticker}...`);
      
      // Lazy-load services
      const marketDataService = require('./services/marketDataService');
      const signalEngineService = require('./services/signalEngineService');
      const geminiService = require('./services/geminiService');
      const { buildSignalExplanationPrompt, SHORT_DISCLAIMER } = require('./utils/promptTemplates');
      
      // 1. Fetch market data (Finnhub)
      const quote = await marketDataService.getQuote(ticker);
      const fundamentals = await marketDataService.getFundamentals(ticker);
      const news = await marketDataService.getCompanyNews(ticker);
      const historical = await marketDataService.getHistoricalPrices(ticker);
      const marketData = { quote, fundamentals, news };
      
      // 2. Generate signal (Signal Engine)
      const signalData = {
        ticker,
        prices: historical,
        fundamentals,
        newsHeadlines: news.map(n => n.headline)
      };
      
      const signal = await signalEngineService.generateSignal(signalData);
      
      // 3. Generate AI explanation (Gemini)
      const prompt = buildSignalExplanationPrompt(ticker, signal, marketData);
      const explanation = await geminiService.generateText(prompt);
      
      // 4. Return complete signal
      res.json({
        success: true,
        test: 'Full Signal Generation (Finnhub + Signal Engine + Gemini)',
        ticker,
        signal: {
          ticker,
          signal: signal.signal,
          confidence: signal.confidence,
          explanation,
          indicators: {
            technical: signal.technicalScore,
            fundamental: signal.fundamentalScore,
            sentiment: signal.sentimentScore
          },
          generatedAt: new Date().toISOString()
        },
        disclaimer: SHORT_DISCLAIMER
      });
    } catch (error) {
      next(error);
    }
  });

  console.log('🧪 Test endpoints enabled (emulator mode only)');
}

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
