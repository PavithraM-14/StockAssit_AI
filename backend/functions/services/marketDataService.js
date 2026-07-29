/**
 * Market Data Service - Wrapper for Finnhub API
 * 
 * Provides real-time stock data, fundamentals, historical prices, and news.
 * All data is cached to reduce API calls and respect rate limits.
 * 
 * Finnhub Free Tier: 60 API calls/minute
 * API Docs: https://finnhub.io/docs/api
 */

const axios = require('axios');
const cacheService = require('./cacheService');
const { AppError } = require('../middleware/errorHandler');

// Finnhub API configuration
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.MARKET_DATA_API_KEY;

// Cache TTLs (in seconds)
const CACHE_TTL = {
  QUOTE: 60,        // 1 minute - real-time data
  FUNDAMENTALS: 3600, // 1 hour - changes rarely
  HISTORICAL: 300,   // 5 minutes - for charts
  NEWS: 600,         // 10 minutes
  COMPANY: 86400,    // 24 hours - company info rarely changes
};

/**
 * Validate API key is configured
 */
if (!API_KEY) {
  console.warn('⚠️  MARKET_DATA_API_KEY not configured. Market data calls will fail.');
}

/**
 * Make authenticated request to Finnhub API
 * 
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response data
 */
const finnhubRequest = async (endpoint, params = {}) => {
  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}${endpoint}`, {
      params: {
        ...params,
        token: API_KEY,
      },
      timeout: 10000, // 10 second timeout
    });

    return response.data;
  } catch (error) {
    // Handle specific Finnhub errors
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error || error.message;

      if (status === 401) {
        throw new AppError('Invalid market data API key', 500);
      }
      
      if (status === 429) {
        throw new AppError(
          'Market data rate limit exceeded. Please try again in a moment.',
          429
        );
      }

      if (status === 404) {
        throw new AppError('Stock ticker not found', 404);
      }

      throw new AppError(`Market data error: ${message}`, status);
    }

    // Network or timeout errors
    if (error.code === 'ECONNABORTED') {
      throw new AppError('Market data request timed out', 504);
    }

    throw new AppError('Failed to fetch market data', 500);
  }
};

/**
 * Get real-time quote (current price, change, volume)
 * 
 * @param {string} ticker - Stock ticker symbol (e.g., 'AAPL')
 * @returns {Promise<Object>} Quote data
 * 
 * Response shape:
 * {
 *   ticker: 'AAPL',
 *   currentPrice: 178.45,
 *   change: 2.15,
 *   changePercent: 1.22,
 *   volume: 52468921,
 *   high: 179.20,
 *   low: 176.80,
 *   open: 177.00,
 *   previousClose: 176.30,
 *   timestamp: 1234567890
 * }
 */
const getQuote = async (ticker) => {
  const cacheKey = `quote:${ticker.toUpperCase()}`;
  
  // Check cache first
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit: ${cacheKey}`);
    return cached;
  }

  console.log(`🌐 Fetching quote for ${ticker}`);

  try {
    const data = await finnhubRequest('/quote', { symbol: ticker.toUpperCase() });

    // Finnhub returns { c, h, l, o, pc, t } where:
    // c = current price, h = high, l = low, o = open, pc = previous close, t = timestamp
    if (!data.c || data.c === 0) {
      throw new AppError(`Invalid or unknown ticker: ${ticker}`, 404);
    }

    const quote = {
      ticker: ticker.toUpperCase(),
      currentPrice: data.c,
      change: data.d || 0,
      changePercent: data.dp || 0,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      timestamp: data.t,
      lastUpdated: new Date(data.t * 1000).toISOString(),
    };

    // Cache the result
    await cacheService.set(cacheKey, quote, CACHE_TTL.QUOTE);

    return quote;
  } catch (error) {
    if (error.isOperational) throw error;
    throw new AppError(`Failed to get quote for ${ticker}: ${error.message}`, 500);
  }
};

/**
 * Get company fundamentals (P/E, market cap, EPS, sector, etc.)
 * 
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} Fundamental data
 * 
 * Response shape:
 * {
 *   ticker: 'AAPL',
 *   companyName: 'Apple Inc.',
 *   sector: 'Technology',
 *   industry: 'Consumer Electronics',
 *   marketCap: 2800000000000,
 *   peRatio: 28.5,
 *   eps: 6.25,
 *   dividend: 0.92,
 *   dividendYield: 0.52,
 *   beta: 1.2,
 *   week52High: 198.23,
 *   week52Low: 124.17
 * }
 */
const getFundamentals = async (ticker) => {
  const cacheKey = `fundamentals:${ticker.toUpperCase()}`;
  
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit: ${cacheKey}`);
    return cached;
  }

  console.log(`🌐 Fetching fundamentals for ${ticker}`);

  try {
    // Finnhub requires two calls: profile2 for company info, metric for financials
    const [profile, metrics] = await Promise.all([
      finnhubRequest('/stock/profile2', { symbol: ticker.toUpperCase() }),
      finnhubRequest('/stock/metric', { symbol: ticker.toUpperCase(), metric: 'all' }),
    ]);

    if (!profile.ticker) {
      throw new AppError(`Invalid or unknown ticker: ${ticker}`, 404);
    }

    const fundamentals = {
      ticker: ticker.toUpperCase(),
      companyName: profile.name || 'N/A',
      sector: profile.finnhubIndustry || 'N/A',
      industry: profile.finnhubIndustry || 'N/A',
      marketCap: profile.marketCapitalization ? profile.marketCapitalization * 1000000 : null,
      peRatio: metrics.metric?.peBasicExclExtraTTM || null,
      eps: metrics.metric?.epsBasicExclExtraItemsAnnual || null,
      dividend: metrics.metric?.dividendPerShareAnnual || null,
      dividendYield: metrics.metric?.dividendYieldIndicatedAnnual || null,
      beta: metrics.metric?.beta || null,
      week52High: metrics.metric?.['52WeekHigh'] || null,
      week52Low: metrics.metric?.['52WeekLow'] || null,
      country: profile.country || 'N/A',
      currency: profile.currency || 'USD',
      exchange: profile.exchange || 'N/A',
      ipo: profile.ipo || null,
      logo: profile.logo || null,
      phone: profile.phone || null,
      weburl: profile.weburl || null,
    };

    await cacheService.set(cacheKey, fundamentals, CACHE_TTL.FUNDAMENTALS);

    return fundamentals;
  } catch (error) {
    if (error.isOperational) throw error;
    throw new AppError(`Failed to get fundamentals for ${ticker}: ${error.message}`, 500);
  }
};

/**
 * Get historical OHLCV data for charting
 * 
 * @param {string} ticker - Stock ticker symbol
 * @param {string} range - Time range: '1D', '1W', '1M', '3M', '6M', '1Y', '5Y'
 * @returns {Promise<Array>} Array of OHLCV data points
 * 
 * Response shape:
 * [
 *   {
 *     date: '2024-01-15',
 *     timestamp: 1234567890,
 *     open: 150.00,
 *     high: 152.50,
 *     low: 149.00,
 *     close: 151.75,
 *     volume: 45678900
 *   },
 *   ...
 * ]
 */
const getHistoricalPrices = async (ticker, range = '1M') => {
  const cacheKey = `historical:${ticker.toUpperCase()}:${range}`;
  
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit: ${cacheKey}`);
    return cached;
  }

  console.log(`🌐 Fetching historical data for ${ticker} (${range})`);

  try {
    // Calculate date range
    const endDate = Math.floor(Date.now() / 1000); // Current time in Unix
    let startDate;
    const resolution = getRangeResolution(range);

    switch (range) {
      case '1D':
        startDate = endDate - (24 * 60 * 60);
        break;
      case '1W':
        startDate = endDate - (7 * 24 * 60 * 60);
        break;
      case '1M':
        startDate = endDate - (30 * 24 * 60 * 60);
        break;
      case '3M':
        startDate = endDate - (90 * 24 * 60 * 60);
        break;
      case '6M':
        startDate = endDate - (180 * 24 * 60 * 60);
        break;
      case '1Y':
        startDate = endDate - (365 * 24 * 60 * 60);
        break;
      case '5Y':
        startDate = endDate - (5 * 365 * 24 * 60 * 60);
        break;
      default:
        startDate = endDate - (30 * 24 * 60 * 60); // Default to 1M
    }

    const data = await finnhubRequest('/stock/candle', {
      symbol: ticker.toUpperCase(),
      resolution,
      from: startDate,
      to: endDate,
    });

    if (data.s === 'no_data') {
      throw new AppError(`No historical data available for ${ticker}`, 404);
    }

    // Transform Finnhub response to our format
    const historicalData = data.t.map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      timestamp: timestamp,
      open: data.o[index],
      high: data.h[index],
      low: data.l[index],
      close: data.c[index],
      volume: data.v[index],
    }));

    await cacheService.set(cacheKey, historicalData, CACHE_TTL.HISTORICAL);

    return historicalData;
  } catch (error) {
    if (error.isOperational) throw error;
    throw new AppError(`Failed to get historical data for ${ticker}: ${error.message}`, 500);
  }
};

/**
 * Get resolution for Finnhub API based on range
 */
function getRangeResolution(range) {
  switch (range) {
    case '1D':
      return '5'; // 5-minute candles
    case '1W':
      return '15'; // 15-minute candles
    case '1M':
      return '60'; // Hourly candles
    case '3M':
    case '6M':
      return 'D'; // Daily candles
    case '1Y':
    case '5Y':
      return 'W'; // Weekly candles
    default:
      return 'D';
  }
}

/**
 * Get recent company news
 * 
 * @param {string} ticker - Stock ticker symbol
 * @param {number} limit - Max number of articles (default: 10)
 * @returns {Promise<Array>} Array of news articles
 * 
 * Response shape:
 * [
 *   {
 *     headline: 'Apple Announces New Product',
 *     summary: 'Apple unveiled...',
 *     source: 'Reuters',
 *     url: 'https://...',
 *     publishedAt: '2024-01-15T10:30:00Z',
 *     sentiment: 'positive' // Finnhub provides sentiment
 *   },
 *   ...
 * ]
 */
const getCompanyNews = async (ticker, limit = 10) => {
  const cacheKey = `news:${ticker.toUpperCase()}:${limit}`;
  
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit: ${cacheKey}`);
    return cached;
  }

  console.log(`🌐 Fetching news for ${ticker}`);

  try {
    // Get news from last 7 days
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const data = await finnhubRequest('/company-news', {
      symbol: ticker.toUpperCase(),
      from: fromDate,
      to: toDate,
    });

    if (!Array.isArray(data)) {
      throw new AppError('Invalid news response', 500);
    }

    // Transform and limit results
    const news = data.slice(0, limit).map(article => ({
      headline: article.headline || 'No headline',
      summary: article.summary || '',
      source: article.source || 'Unknown',
      url: article.url || '#',
      publishedAt: new Date(article.datetime * 1000).toISOString(),
      category: article.category || 'general',
      image: article.image || null,
    }));

    await cacheService.set(cacheKey, news, CACHE_TTL.NEWS);

    return news;
  } catch (error) {
    if (error.isOperational) throw error;
    throw new AppError(`Failed to get news for ${ticker}: ${error.message}`, 500);
  }
};

/**
 * Search for stock symbols by company name or ticker
 * 
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching stocks
 */
const searchStocks = async (query) => {
  if (!query || query.trim().length < 1) {
    throw new AppError('Search query is required', 400);
  }

  const cacheKey = `search:${query.toLowerCase()}`;
  
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit: ${cacheKey}`);
    return cached;
  }

  console.log(`🌐 Searching for: ${query}`);

  try {
    const data = await finnhubRequest('/search', { q: query });

    const results = (data.result || []).slice(0, 20).map(item => ({
      ticker: item.symbol,
      displaySymbol: item.displaySymbol || item.symbol,
      description: item.description,
      type: item.type,
    }));

    await cacheService.set(cacheKey, results, CACHE_TTL.COMPANY);

    return results;
  } catch (error) {
    if (error.isOperational) throw error;
    throw new AppError(`Failed to search stocks: ${error.message}`, 500);
  }
};

module.exports = {
  getQuote,
  getFundamentals,
  getHistoricalPrices,
  getCompanyNews,
  searchStocks,
};
