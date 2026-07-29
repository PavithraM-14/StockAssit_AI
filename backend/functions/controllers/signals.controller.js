/**
 * Signals Controller
 * Handles trading signal generation and retrieval
 * 
 * IMPORTANT: Signals are analysis outputs, NOT trading orders.
 * Always includes disclaimer that this is educational, not financial advice.
 */

const Signal = require('../models/Signal');
const SignalHistory = require('../models/SignalHistory');
const Watchlist = require('../models/Watchlist');
const signalEngineService = require('../services/signalEngineService');
const marketDataService = require('../services/marketDataService');
const geminiService = require('../services/geminiService');
const { buildSignalExplanationPrompt, SHORT_DISCLAIMER } = require('../utils/promptTemplates');

/**
 * Get signal for a specific ticker
 * 
 * GET /signals/:ticker
 * 
 * Logic:
 * 1. Check MongoDB for non-expired cached signal
 * 2. If missing/expired: fetch data, generate signal, get AI explanation, save
 * 3. Return signal
 */
exports.getSignalForTicker = async (req, res, next) => {
  try {
    const { ticker } = req.params;
    const tickerUpper = ticker.toUpperCase();

    console.log(`📊 Request for signal: ${tickerUpper}`);

    // Step 1: Check for existing non-expired signal in MongoDB
    const existingSignal = await Signal.findOne({
      ticker: tickerUpper,
      expiresAt: { $gt: new Date() }, // Not expired
    }).sort({ generatedAt: -1 }); // Most recent first

    if (existingSignal) {
      console.log(`✅ Found cached signal for ${tickerUpper}`);
      return res.status(200).json({
        success: true,
        data: existingSignal,
        cached: true,
        disclaimer: SHORT_DISCLAIMER,
      });
    }

    // Step 2: No cached signal - generate new one
    console.log(`🔄 No cached signal for ${tickerUpper}, generating new...`);

    // Fetch market data
    console.log('📡 Fetching market data...');
    const [prices, fundamentals, news] = await Promise.all([
      marketDataService.getHistoricalPrices(tickerUpper, '1Y'),
      marketDataService.getFundamentals(tickerUpper),
      marketDataService.getCompanyNews(tickerUpper),
    ]);

    // Extract news headlines
    const newsHeadlines = news.map(article => article.headline || '');

    // Generate signal using signal engine (pure function, no AI)
    console.log('⚙️  Running signal engine...');
    const signalData = signalEngineService.generateSignal({
      ticker: tickerUpper,
      prices,
      fundamentals,
      newsHeadlines,
    });

    // Generate AI explanation using Gemini
    console.log('🤖 Generating AI explanation...');
    const prompt = buildSignalExplanationPrompt({
      ticker: tickerUpper,
      signalType: signalData.signalType,
      confidenceScore: signalData.confidenceScore,
      indicators: signalData.triggeredIndicators,
    });

    const aiExplanation = await geminiService.generateExplanation(prompt);

    // Build complete signal document for MongoDB
    const signalDocument = {
      ticker: tickerUpper,
      signalType: signalData.signalType,
      confidenceScore: signalData.confidenceScore,
      triggeredIndicators: signalData.triggeredIndicators,
      aiExplanation,
      technicalScore: signalData.scores.technical,
      fundamentalScore: signalData.scores.fundamental,
      sentimentScore: signalData.scores.sentiment,
      generatedAt: signalData.generatedAt,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    // Save to MongoDB
    const savedSignal = await Signal.create(signalDocument);
    console.log(`✅ Signal saved to MongoDB for ${tickerUpper}`);

    // Also save to SignalHistory for performance tracking
    await SignalHistory.create({
      ticker: tickerUpper,
      signalType: signalData.signalType,
      confidenceScore: signalData.confidenceScore,
      priceAtSignal: prices[prices.length - 1].close, // Latest closing price
      generatedAt: signalData.generatedAt,
    });
    console.log(`📝 Signal saved to history for ${tickerUpper}`);

    return res.status(201).json({
      success: true,
      data: savedSignal,
      cached: false,
      disclaimer: SHORT_DISCLAIMER,
    });

  } catch (error) {
    console.error('Error in getSignalForTicker:', error);
    next(error);
  }
};

/**
 * Get signal history for a ticker
 * 
 * GET /signals/:ticker/history
 * 
 * Returns historical signals with performance data (7-day, 30-day price changes).
 */
exports.getSignalHistory = async (req, res, next) => {
  try {
    const { ticker } = req.params;
    const { limit = 30 } = req.query;
    const tickerUpper = ticker.toUpperCase();

    console.log(`📜 Fetching signal history for ${tickerUpper}`);

    const history = await SignalHistory.find({ ticker: tickerUpper })
      .sort({ generatedAt: -1 })
      .limit(parseInt(limit));

    // Calculate performance stats
    const stats = calculatePerformanceStats(history);

    return res.status(200).json({
      success: true,
      data: {
        ticker: tickerUpper,
        history,
        stats,
        count: history.length,
      },
    });

  } catch (error) {
    console.error('Error in getSignalHistory:', error);
    next(error);
  }
};

/**
 * Get signals for user's watchlist
 * 
 * GET /signals/watchlist
 * 
 * Requires authentication (req.user.uid from verifyFirebaseToken middleware).
 * Returns current signals for all tickers in user's watchlist.
 */
exports.getSignalsForWatchlist = async (req, res, next) => {
  try {
    const userId = req.user.uid; // From Firebase auth middleware

    console.log(`📋 Fetching watchlist signals for user ${userId}`);

    // Get user's watchlist
    const watchlist = await Watchlist.findOne({ userId });

    if (!watchlist || !watchlist.tickers || watchlist.tickers.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Your watchlist is empty. Add stocks to get started.',
      });
    }

    console.log(`📊 Found ${watchlist.tickers.length} tickers in watchlist`);

    // Get or generate signals for each ticker
    const signalPromises = watchlist.tickers.map(async (ticker) => {
      try {
        // Check for cached signal
        const existingSignal = await Signal.findOne({
          ticker: ticker.toUpperCase(),
          expiresAt: { $gt: new Date() },
        }).sort({ generatedAt: -1 });

        if (existingSignal) {
          console.log(`✅ Using cached signal for ${ticker}`);
          return {
            ticker,
            signal: existingSignal,
            success: true,
            cached: true,
          };
        }

        // No cached signal - generate new one
        console.log(`🔄 Generating new signal for ${ticker}`);
        
        const [prices, fundamentals, news] = await Promise.all([
          marketDataService.getHistoricalPrices(ticker.toUpperCase(), '1Y'),
          marketDataService.getFundamentals(ticker.toUpperCase()),
          marketDataService.getCompanyNews(ticker.toUpperCase()),
        ]);

        const newsHeadlines = news.map(article => article.headline || '');

        const signalData = signalEngineService.generateSignal({
          ticker: ticker.toUpperCase(),
          prices,
          fundamentals,
          newsHeadlines,
        });

        const prompt = buildSignalExplanationPrompt({
          ticker: ticker.toUpperCase(),
          signalType: signalData.signalType,
          confidenceScore: signalData.confidenceScore,
          indicators: signalData.triggeredIndicators,
        });

        const aiExplanation = await geminiService.generateExplanation(prompt);

        const signalDocument = {
          ticker: ticker.toUpperCase(),
          signalType: signalData.signalType,
          confidenceScore: signalData.confidenceScore,
          triggeredIndicators: signalData.triggeredIndicators,
          aiExplanation,
          technicalScore: signalData.scores.technical,
          fundamentalScore: signalData.scores.fundamental,
          sentimentScore: signalData.scores.sentiment,
          generatedAt: signalData.generatedAt,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };

        const savedSignal = await Signal.create(signalDocument);

        // Save to history
        await SignalHistory.create({
          ticker: ticker.toUpperCase(),
          signalType: signalData.signalType,
          confidenceScore: signalData.confidenceScore,
          priceAtSignal: prices[prices.length - 1].close,
          generatedAt: signalData.generatedAt,
        });

        return {
          ticker,
          signal: savedSignal,
          success: true,
          cached: false,
        };

      } catch (error) {
        console.error(`Failed to get signal for ${ticker}:`, error.message);
        return {
          ticker,
          error: error.message,
          success: false,
        };
      }
    });

    // Wait for all signals to be fetched/generated
    const results = await Promise.all(signalPromises);

    // Separate successful and failed results
    const successfulSignals = results
      .filter(r => r.success)
      .map(r => r.signal);

    const failedTickers = results
      .filter(r => !r.success)
      .map(r => ({ ticker: r.ticker, error: r.error }));

    console.log(`✅ Generated ${successfulSignals.length}/${watchlist.tickers.length} signals`);

    return res.status(200).json({
      success: true,
      data: successfulSignals,
      summary: {
        total: watchlist.tickers.length,
        successful: successfulSignals.length,
        failed: failedTickers.length,
        failures: failedTickers,
      },
      disclaimer: SHORT_DISCLAIMER,
    });

  } catch (error) {
    console.error('Error in getSignalsForWatchlist:', error);
    next(error);
  }
};

/**
 * Helper function to calculate signal performance statistics
 * 
 * @param {Array} history - Array of SignalHistory documents
 * @returns {Object} Performance statistics
 */
function calculatePerformanceStats(history) {
  if (!history || history.length === 0) {
    return {
      total: 0,
      completed: 0,
      pending: 0,
      message: 'No signal history available',
    };
  }

  // Filter completed signals (have 7-day price data)
  const completed = history.filter(h => h.priceAfter7Days !== null);

  if (completed.length === 0) {
    return {
      total: history.length,
      completed: 0,
      pending: history.length,
      message: 'No completed signals yet (waiting for 7-day follow-up)',
    };
  }

  // Calculate success rate
  let successCount = 0;
  let totalReturn7d = 0;
  let totalReturn30d = 0;
  let count30d = 0;

  completed.forEach(signal => {
    const return7d = ((signal.priceAfter7Days - signal.priceAtSignal) / signal.priceAtSignal) * 100;
    totalReturn7d += return7d;

    if (signal.priceAfter30Days) {
      const return30d = ((signal.priceAfter30Days - signal.priceAtSignal) / signal.priceAtSignal) * 100;
      totalReturn30d += return30d;
      count30d++;
    }

    // Check if signal was correct (directionally)
    const wasCorrect =
      (signal.signalType === 'BUY' && return7d > 0) ||
      (signal.signalType === 'SELL' && return7d < 0) ||
      (signal.signalType === 'HOLD' && Math.abs(return7d) < 2);

    if (wasCorrect) successCount++;
  });

  return {
    total: history.length,
    completed: completed.length,
    pending: history.length - completed.length,
    successRate: ((successCount / completed.length) * 100).toFixed(1) + '%',
    avgReturn7d: (totalReturn7d / completed.length).toFixed(2) + '%',
    avgReturn30d: count30d > 0 
      ? (totalReturn30d / count30d).toFixed(2) + '%' 
      : 'N/A',
  };
}
