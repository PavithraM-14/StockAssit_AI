/**
 * AI Controller
 * Handles AI-powered stock Q&A using Gemini
 * 
 * CRITICAL: AI ONLY explains data. It does NOT make trading decisions.
 * All responses include disclaimers about educational purpose.
 */

const geminiService = require('../services/geminiService');
const marketDataService = require('../services/marketDataService');
const aiCacheService = require('../services/aiCacheService');
const { buildStockSummaryPrompt, STANDARD_DISCLAIMER } = require('../utils/promptTemplates');
const { AppError } = require('../middleware/errorHandler');

/**
 * Ask AI a question about a specific stock
 * 
 * POST /api/ai/ask
 * Body: {
 *   ticker: 'AAPL',
 *   question: 'What does the P/E ratio tell me about this stock?'
 * }
 * 
 * AI answers based on current stock data (quote, fundamentals, news).
 */
exports.askAboutStock = async (req, res, next) => {
  try {
    const { ticker, question } = req.body;

    if (!ticker || !question) {
      throw new AppError('Both ticker and question are required', 400);
    }

    if (question.trim().length < 5) {
      throw new AppError('Question must be at least 5 characters', 400);
    }

    if (question.length > 500) {
      throw new AppError('Question is too long (max 500 characters)', 400);
    }

    const tickerUpper = ticker.toUpperCase();

    // Fetch stock context
    const [quote, fundamentals, news] = await Promise.all([
      marketDataService.getQuote(tickerUpper),
      marketDataService.getFundamentals(tickerUpper),
      marketDataService.getCompanyNews(tickerUpper),
    ]);

    const context = {
      ticker: tickerUpper,
      quote,
      fundamentals,
      news: news.slice(0, 5), // Top 5 news articles
    };

    // Get AI response
    const answer = await geminiService.generateStockQnA(context, question);

    res.status(200).json({
      success: true,
      data: {
        ticker: tickerUpper,
        question,
        answer,
        disclaimer: STANDARD_DISCLAIMER,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get AI-generated stock summary
 * 
 * GET /api/ai/summary/:ticker
 * 
 * Returns a plain-English summary of the company's current situation
 * based on fundamentals and recent news.
 * Checks aiCacheService first to avoid redundant AI calls.
 */
exports.getStockSummary = async (req, res, next) => {
  try {
    const { ticker } = req.params;

    if (!ticker || !/^[A-Z]{1,5}$/.test(ticker.toUpperCase())) {
      throw new AppError('Please provide a valid stock ticker', 400);
    }

    const tickerUpper = ticker.toUpperCase();

    // Check cache first
    const cachedSummary = await aiCacheService.getCachedResponse(
      tickerUpper,
      'stock_summary',
      { ticker: tickerUpper }
    );

    if (cachedSummary) {
      console.log(`✅ Using cached summary for ${tickerUpper}`);
      return res.status(200).json({
        success: true,
        data: {
          ticker: tickerUpper,
          summary: cachedSummary,
          disclaimer: STANDARD_DISCLAIMER,
          cached: true,
        },
      });
    }

    // Cache miss - fetch data and generate summary
    console.log(`🤖 Generating new summary for ${tickerUpper}`);

    const [fundamentals, news] = await Promise.all([
      marketDataService.getFundamentals(tickerUpper),
      marketDataService.getCompanyNews(tickerUpper),
    ]);

    // Build prompt
    const prompt = buildStockSummaryPrompt({
      ticker: tickerUpper,
      fundamentals,
      recentNews: news.slice(0, 3),
    });

    // Generate summary
    const summary = await geminiService.generateExplanation(prompt);

    // Cache the result (60 minute TTL)
    await aiCacheService.cacheResponse(
      tickerUpper,
      'stock_summary',
      { ticker: tickerUpper },
      summary,
      60
    );

    res.status(200).json({
      success: true,
      data: {
        ticker: tickerUpper,
        summary,
        disclaimer: STANDARD_DISCLAIMER,
        cached: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check AI service health
 * 
 * GET /api/ai/health
 * 
 * Verifies Gemini API is configured and working.
 */
exports.checkHealth = async (req, res, next) => {
  try {
    const isHealthy = await geminiService.checkHealth();

    if (!isHealthy) {
      throw new AppError('AI service is not configured or unavailable', 503);
    }

    res.status(200).json({
      success: true,
      message: 'AI service is operational',
      service: 'Gemini 1.5 Flash',
    });
  } catch (error) {
    next(error);
  }
};
