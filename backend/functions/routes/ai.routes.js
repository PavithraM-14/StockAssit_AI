/**
 * AI Routes
 * Gemini-powered analysis and Q&A endpoints
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');

// All AI routes require authentication (matching default auth requirement)
router.use(verifyFirebaseToken);

// Ask AI about a stock (Q&A)
// POST /api/ai/ask
// Body: { ticker: 'AAPL', question: 'What does the P/E ratio mean?' }
router.post('/ask', aiController.askAboutStock);

// Get AI-generated stock summary
// GET /api/ai/summary/AAPL
router.get('/summary/:ticker', aiController.getStockSummary);

// Check AI service health
// GET /api/ai/health
router.get('/health', aiController.checkHealth);

module.exports = router;
