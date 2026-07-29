/**
 * Watchlist Routes
 * User's watched stock tickers
 */

const express = require('express');
const router = express.Router();
const watchlistController = require('../controllers/watchlist.controller');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');

// All watchlist routes require authentication
router.use(verifyFirebaseToken);

// Get user's watchlist
// GET /api/watchlist
router.get('/', watchlistController.getWatchlist);

// Add ticker to watchlist
// POST /api/watchlist
// Body: { ticker: 'AAPL' }
router.post('/', watchlistController.addTicker);

// Remove ticker from watchlist
// DELETE /api/watchlist/:ticker
router.delete('/:ticker', watchlistController.removeTicker);

// Update entire watchlist (replace all tickers)
// PUT /api/watchlist
// Body: { tickers: ['AAPL', 'GOOGL', 'MSFT'] }
router.put('/', watchlistController.updateWatchlist);

// Clear watchlist (remove all tickers)
// DELETE /api/watchlist
router.delete('/', watchlistController.clearWatchlist);

module.exports = router;
