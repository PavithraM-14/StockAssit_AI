/**
 * Signals Routes
 * Trading signal generation and retrieval endpoints
 */

const express = require('express');
const router = express.Router();
const signalsController = require('../controllers/signals.controller');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');

// Protected routes (require authentication)

// Get signals for user's watchlist - MUST come before /:ticker route
// GET /api/signals/watchlist
router.get('/watchlist', verifyFirebaseToken, signalsController.getSignalsForWatchlist);

// Get signal for a specific ticker (cached or generate new)
// GET /api/signals/AAPL
router.get('/:ticker', verifyFirebaseToken, signalsController.getSignalForTicker);

// Get signal history for a ticker
// GET /api/signals/AAPL/history?limit=30
router.get('/:ticker/history', verifyFirebaseToken, signalsController.getSignalHistory);

module.exports = router;
