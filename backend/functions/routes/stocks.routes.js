/**
 * Stocks Routes
 * Market data endpoints (quotes, fundamentals, news, search)
 */

const express = require('express');
const router = express.Router();
const stocksController = require('../controllers/stocks.controller');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');

// Apply verifyFirebaseToken middleware to all stock routes (requiring auth for consistency)
// NOTE: If you prefer public access for stock lookups (search/details/quotes),
// simply comment out or remove the line below.
router.use(verifyFirebaseToken);

// Search stocks by query
// GET /api/stocks/search?q=apple
router.get('/search', stocksController.searchStocks);

// Get batch quotes for multiple tickers
// POST /api/stocks/batch/quotes
// Body: { tickers: ['AAPL', 'GOOGL', 'MSFT'] }
router.post('/batch/quotes', stocksController.getBatchQuotes);

// Get complete stock details (quote + fundamentals + news)
// GET /api/stocks/AAPL
router.get('/:ticker', stocksController.getStockDetails);

// Get current quote for a ticker
// GET /api/stocks/AAPL/quote
router.get('/:ticker/quote', stocksController.getQuote);

// Get fundamentals for a ticker
// GET /api/stocks/AAPL/fundamentals
router.get('/:ticker/fundamentals', stocksController.getFundamentals);

// Get historical prices
// GET /api/stocks/AAPL/history?range=1M
router.get('/:ticker/history', stocksController.getHistoricalPrices);

// Get company news
// GET /api/stocks/AAPL/news
router.get('/:ticker/news', stocksController.getCompanyNews);

module.exports = router;
