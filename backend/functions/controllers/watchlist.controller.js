/**
 * Watchlist Controller
 * Manages user watchlists (stocks they want to track)
 */

const Watchlist = require('../models/Watchlist');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get user's watchlist
 * 
 * GET /watchlist
 * 
 * Creates watchlist on first use if it doesn't exist.
 */
exports.getWatchlist = async (req, res, next) => {
  try {
    const userId = req.user.uid; // From Firebase auth middleware

    let watchlist = await Watchlist.findOne({ userId });

    if (!watchlist) {
      // Create empty watchlist on first use
      watchlist = await Watchlist.create({ 
        userId, 
        tickers: [] 
      });
    }

    return res.status(200).json({
      success: true,
      data: watchlist,
    });

  } catch (error) {
    console.error('Error in getWatchlist:', error);
    next(error);
  }
};

/**
 * Add ticker to watchlist
 * 
 * POST /watchlist
 * Body: { ticker: 'AAPL' }
 * 
 * Prevents duplicates automatically.
 */
exports.addTicker = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { ticker } = req.body;

    // Validation
    if (!ticker) {
      throw new AppError('Ticker is required', 400);
    }

    if (!/^[A-Z]{1,5}$/.test(ticker.toUpperCase())) {
      throw new AppError('Invalid ticker format (1-5 uppercase letters)', 400);
    }

    const tickerUpper = ticker.toUpperCase();

    let watchlist = await Watchlist.findOne({ userId });

    if (!watchlist) {
      // Create new watchlist with this ticker
      watchlist = await Watchlist.create({
        userId,
        tickers: [tickerUpper],
      });
    } else {
      // Check for duplicate
      if (watchlist.tickers.includes(tickerUpper)) {
        throw new AppError(`${tickerUpper} is already in your watchlist`, 400);
      }

      // Use the model's addTicker method (prevents duplicates)
      await watchlist.addTicker(tickerUpper);
    }

    return res.status(200).json({
      success: true,
      data: watchlist,
      message: `${tickerUpper} added to watchlist`,
    });

  } catch (error) {
    console.error('Error in addTicker:', error);
    next(error);
  }
};

/**
 * Remove ticker from watchlist
 * 
 * DELETE /watchlist/:ticker
 */
exports.removeTicker = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { ticker } = req.params;

    const tickerUpper = ticker.toUpperCase();

    const watchlist = await Watchlist.findOne({ userId });

    if (!watchlist) {
      throw new AppError('Watchlist not found', 404);
    }

    // Check if ticker exists in watchlist
    if (!watchlist.tickers.includes(tickerUpper)) {
      throw new AppError(`${tickerUpper} is not in your watchlist`, 404);
    }

    // Use the model's removeTicker method
    await watchlist.removeTicker(tickerUpper);

    return res.status(200).json({
      success: true,
      data: watchlist,
      message: `${tickerUpper} removed from watchlist`,
    });

  } catch (error) {
    console.error('Error in removeTicker:', error);
    next(error);
  }
};

/**
 * Update entire watchlist (replace all tickers)
 * 
 * PUT /watchlist
 * Body: { tickers: ['AAPL', 'GOOGL', 'MSFT'] }
 */
exports.updateWatchlist = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { tickers } = req.body;

    if (!Array.isArray(tickers)) {
      throw new AppError('tickers must be an array', 400);
    }

    if (tickers.length > 50) {
      throw new AppError('Maximum 50 tickers per watchlist', 400);
    }

    // Validate all tickers
    const validTickers = tickers.map(t => {
      const upper = t.toUpperCase();
      if (!/^[A-Z]{1,5}$/.test(upper)) {
        throw new AppError(`Invalid ticker format: ${t}`, 400);
      }
      return upper;
    });

    // Remove duplicates
    const uniqueTickers = [...new Set(validTickers)];

    const watchlist = await Watchlist.findOneAndUpdate(
      { userId },
      { tickers: uniqueTickers },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: watchlist,
      message: 'Watchlist updated successfully',
    });

  } catch (error) {
    console.error('Error in updateWatchlist:', error);
    next(error);
  }
};

/**
 * Clear watchlist (remove all tickers)
 * 
 * DELETE /watchlist
 */
exports.clearWatchlist = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    const watchlist = await Watchlist.findOneAndUpdate(
      { userId },
      { tickers: [] },
      { new: true }
    );

    if (!watchlist) {
      throw new AppError('Watchlist not found', 404);
    }

    return res.status(200).json({
      success: true,
      data: watchlist,
      message: 'Watchlist cleared',
    });

  } catch (error) {
    console.error('Error in clearWatchlist:', error);
    next(error);
  }
};
