/**
 * Stocks Controller
 * Handles stock market data API endpoints
 * 
 * Wraps marketDataService (Finnhub API) to provide stock quotes,
 * fundamentals, historical prices, and search functionality.
 */

const marketDataService = require('../services/marketDataService');
const { AppError, catchAsync } = require('../middleware/errorHandler');

/**
 * Get stock quote (current price, change, volume)
 * 
 * GET /api/stocks/:ticker/quote
 */
exports.getQuote = catchAsync(async (req, res) => {
  const { ticker } = req.params;

  if (!ticker || !/^[A-Z]{1,5}$/.test(ticker.toUpperCase())) {
    throw new AppError('Please provide a valid stock ticker', 400);
  }

  const quote = await marketDataService.getQuote(ticker.toUpperCase());

  res.status(200).json({
    success: true,
    data: quote,
  });
});

/**
 * Get stock fundamentals (P/E, EPS, market cap, etc.)
 * 
 * GET /api/stocks/:ticker/fundamentals
 */
exports.getFundamentals = catchAsync(async (req, res) => {
  const { ticker } = req.params;

  if (!ticker || !/^[A-Z]{1,5}$/.test(ticker.toUpperCase())) {
    throw new AppError('Please provide a valid stock ticker', 400);
  }

  const fundamentals = await marketDataService.getFundamentals(ticker.toUpperCase());

  res.status(200).json({
    success: true,
    data: fundamentals,
  });
});

/**
 * Get historical prices (OHLCV data)
 * 
 * GET /api/stocks/:ticker/history?range=1M
 * 
 * Range options: 1D, 1W, 1M, 3M, 6M, 1Y, 5Y
 */
exports.getHistoricalPrices = catchAsync(async (req, res) => {
  const { ticker } = req.params;
  const { range = '1M' } = req.query;

  if (!ticker || !/^[A-Z]{1,5}$/.test(ticker.toUpperCase())) {
    throw new AppError('Please provide a valid stock ticker', 400);
  }

  const validRanges = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'];
  if (!validRanges.includes(range.toUpperCase())) {
    throw new AppError(`Invalid range. Must be one of: ${validRanges.join(', ')}`, 400);
  }

  const priceHistory = await marketDataService.getHistoricalPrices(
    ticker.toUpperCase(), 
    range.toUpperCase()
  );

  res.status(200).json({
    success: true,
    data: priceHistory,
    range: range.toUpperCase(),
  });
});

/**
 * Get company news
 * 
 * GET /api/stocks/:ticker/news
 */
exports.getCompanyNews = catchAsync(async (req, res) => {
  const { ticker } = req.params;

  if (!ticker || !/^[A-Z]{1,5}$/.test(ticker.toUpperCase())) {
    throw new AppError('Please provide a valid stock ticker', 400);
  }

  const news = await marketDataService.getCompanyNews(ticker.toUpperCase());

  res.status(200).json({
    success: true,
    data: news,
    count: news.length,
  });
});

/**
 * Search stocks by query
 * 
 * GET /api/stocks/search?q=apple
 * 
 * Searches stock symbols and company names.
 */
exports.searchStocks = catchAsync(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    throw new AppError('Please provide a search query (q parameter)', 400);
  }

  if (q.length < 1) {
    throw new AppError('Search query must be at least 1 character', 400);
  }

  const results = await marketDataService.searchStocks(q.trim());

  res.status(200).json({
    success: true,
    data: results,
    count: results.length,
    query: q.trim(),
  });
});

/**
 * Get complete stock details (combines quote + fundamentals + news)
 * 
 * GET /api/stocks/:ticker
 * 
 * Single endpoint that returns all available data for a stock.
 * Useful for stock detail pages in the frontend.
 */
exports.getStockDetails = catchAsync(async (req, res) => {
  const { ticker } = req.params;

  if (!ticker || !/^[A-Z]{1,5}$/.test(ticker.toUpperCase())) {
    throw new AppError('Please provide a valid stock ticker', 400);
  }

  const tickerUpper = ticker.toUpperCase();

  // Fetch all data in parallel
  const [quote, fundamentals, news] = await Promise.all([
    marketDataService.getQuote(tickerUpper),
    marketDataService.getFundamentals(tickerUpper),
    marketDataService.getCompanyNews(tickerUpper),
  ]);

  res.status(200).json({
    success: true,
    data: {
      ticker: tickerUpper,
      quote,
      fundamentals,
      news: news.slice(0, 5), // Top 5 news articles
    },
  });
});

/**
 * Get multiple stock quotes in batch
 * 
 * POST /api/stocks/batch/quotes
 * Body: { tickers: ['AAPL', 'GOOGL', 'MSFT'] }
 * 
 * Efficiently fetches quotes for multiple stocks.
 */
exports.getBatchQuotes = catchAsync(async (req, res) => {
  const { tickers } = req.body;

  if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
    throw new AppError('Please provide an array of tickers', 400);
  }

  if (tickers.length > 50) {
    throw new AppError('Maximum 50 tickers per batch request', 400);
  }

  // Fetch quotes in parallel
  const quotes = await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const quote = await marketDataService.getQuote(ticker.toUpperCase());
        return {
          ticker: ticker.toUpperCase(),
          success: true,
          data: quote,
        };
      } catch (error) {
        return {
          ticker: ticker.toUpperCase(),
          success: false,
          error: error.message,
        };
      }
    })
  );

  const successCount = quotes.filter(q => q.success).length;

  res.status(200).json({
    success: true,
    data: quotes,
    summary: {
      total: tickers.length,
      successful: successCount,
      failed: tickers.length - successCount,
    },
  });
});
