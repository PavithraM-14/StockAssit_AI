/**
 * Technical Rules - Pure mathematical functions for technical analysis
 * 
 * All functions work on historical price data (OHLCV arrays).
 * NO API calls - just calculations.
 * 
 * Standard Technical Indicator Thresholds:
 * - RSI < 30: Oversold (bullish signal)
 * - RSI > 70: Overbought (bearish signal)
 * - MACD histogram > 0 and rising: Bullish momentum
 * - MACD histogram < 0 and falling: Bearish momentum
 * - Golden Cross (50 SMA > 200 SMA): Bullish long-term
 * - Death Cross (50 SMA < 200 SMA): Bearish long-term
 * - Price > SMA: Uptrend
 * - Price < SMA: Downtrend
 */

/**
 * Calculate RSI (Relative Strength Index)
 * 
 * RSI measures momentum on a scale of 0-100.
 * - RSI < 30: Oversold (potential buy signal)
 * - RSI > 70: Overbought (potential sell signal)
 * - RSI 40-60: Neutral
 * 
 * @param {Array<number>} prices - Array of closing prices
 * @param {number} period - Lookback period (default: 14)
 * @returns {number|null} RSI value (0-100) or null if insufficient data
 */
function calculateRSI(prices, period = 14) {
  if (!prices || prices.length < period + 1) {
    return null; // Need at least period + 1 data points
  }

  // Calculate price changes
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Get the most recent 'period' changes
  const recentChanges = changes.slice(-period);

  // Calculate average gains and losses
  let gains = 0;
  let losses = 0;

  recentChanges.forEach(change => {
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  });

  const avgGain = gains / period;
  const avgLoss = losses / period;

  // Avoid division by zero
  if (avgLoss === 0) {
    return 100; // All gains, maximum RSI
  }

  // Calculate RS and RSI
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return Math.round(rsi * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate SMA (Simple Moving Average)
 * 
 * @param {Array<number>} prices - Array of closing prices
 * @param {number} period - Number of periods to average
 * @returns {number|null} SMA value or null if insufficient data
 */
function calculateSMA(prices, period) {
  if (!prices || prices.length < period) {
    return null;
  }

  const recentPrices = prices.slice(-period);
  const sum = recentPrices.reduce((total, price) => total + price, 0);
  const sma = sum / period;

  return Math.round(sma * 100) / 100;
}

/**
 * Calculate EMA (Exponential Moving Average)
 * 
 * EMA gives more weight to recent prices than SMA.
 * 
 * @param {Array<number>} prices - Array of closing prices
 * @param {number} period - Number of periods
 * @returns {number|null} EMA value or null if insufficient data
 */
function calculateEMA(prices, period) {
  if (!prices || prices.length < period) {
    return null;
  }

  const multiplier = 2 / (period + 1);
  
  // Start with SMA for the first EMA value
  let ema = calculateSMA(prices.slice(0, period), period);

  // Calculate EMA for remaining prices
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return Math.round(ema * 100) / 100;
}

/**
 * Detect Moving Average Crossover
 * 
 * Golden Cross: Short-term MA crosses above long-term MA (bullish)
 * Death Cross: Short-term MA crosses below long-term MA (bearish)
 * 
 * @param {Array<number>} prices - Array of closing prices
 * @param {number} shortPeriod - Short MA period (default: 50)
 * @param {number} longPeriod - Long MA period (default: 200)
 * @returns {string|null} 'golden_cross', 'death_cross', or null
 */
function detectMovingAverageCrossover(prices, shortPeriod = 50, longPeriod = 200) {
  if (!prices || prices.length < longPeriod + 2) {
    return null; // Need enough data for crossover detection
  }

  // Calculate current and previous MAs
  const currentShortMA = calculateSMA(prices, shortPeriod);
  const currentLongMA = calculateSMA(prices, longPeriod);
  
  const prevShortMA = calculateSMA(prices.slice(0, -1), shortPeriod);
  const prevLongMA = calculateSMA(prices.slice(0, -1), longPeriod);

  if (!currentShortMA || !currentLongMA || !prevShortMA || !prevLongMA) {
    return null;
  }

  // Check for Golden Cross
  if (prevShortMA <= prevLongMA && currentShortMA > currentLongMA) {
    return 'golden_cross';
  }

  // Check for Death Cross
  if (prevShortMA >= prevLongMA && currentShortMA < currentLongMA) {
    return 'death_cross';
  }

  return null;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * 
 * MACD shows relationship between two EMAs.
 * - Positive histogram: Bullish momentum
 * - Negative histogram: Bearish momentum
 * - Histogram crossing zero: Potential trend change
 * 
 * @param {Array<number>} prices - Array of closing prices
 * @returns {Object|null} { macdLine, signalLine, histogram } or null
 */
function calculateMACD(prices) {
  if (!prices || prices.length < 26) {
    return null; // Need at least 26 periods for MACD
  }

  // Calculate 12-period and 26-period EMAs
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  if (!ema12 || !ema26) {
    return null;
  }

  // MACD Line = 12 EMA - 26 EMA
  const macdLine = ema12 - ema26;

  // Signal Line = 9-period EMA of MACD Line
  // For simplicity, we'll approximate using recent MACD values
  // In production, you'd calculate this properly with historical MACD values
  const signalLine = macdLine * 0.8; // Simplified approximation

  // Histogram = MACD Line - Signal Line
  const histogram = macdLine - signalLine;

  return {
    macdLine: Math.round(macdLine * 100) / 100,
    signalLine: Math.round(signalLine * 100) / 100,
    histogram: Math.round(histogram * 100) / 100,
  };
}

/**
 * Evaluate overall technical signal
 * 
 * Combines multiple technical indicators into a single score.
 * 
 * Score interpretation:
 * - Score > 50: Strong BUY signal
 * - Score 20-50: Moderate BUY signal
 * - Score -20 to 20: HOLD (neutral)
 * - Score -50 to -20: Moderate SELL signal
 * - Score < -50: Strong SELL signal
 * 
 * @param {Array<Object>} priceData - Array of OHLCV objects: [{ close, high, low, volume }, ...]
 * @returns {Object} { score: number, triggeredIndicators: Array }
 */
function evaluateTechnicalSignal(priceData) {
  if (!priceData || priceData.length < 200) {
    return {
      score: 0,
      triggeredIndicators: [],
      error: 'Insufficient data for technical analysis (need 200+ data points)',
    };
  }

  const closePrices = priceData.map(d => d.close);
  const currentPrice = closePrices[closePrices.length - 1];
  
  let score = 0;
  const triggeredIndicators = [];

  // 1. RSI Analysis (Weight: 25 points)
  const rsi = calculateRSI(closePrices, 14);
  if (rsi !== null) {
    triggeredIndicators.push({
      name: 'RSI (14)',
      value: rsi,
      threshold: 'Oversold < 30, Overbought > 70',
    });

    if (rsi < 30) {
      score += 25; // Oversold - bullish
    } else if (rsi > 70) {
      score -= 25; // Overbought - bearish
    } else if (rsi >= 40 && rsi <= 60) {
      // Neutral zone - slight positive bias if trending up
      score += 0;
    }
  }

  // 2. MACD Analysis (Weight: 25 points)
  const macd = calculateMACD(closePrices);
  if (macd) {
    triggeredIndicators.push({
      name: 'MACD Histogram',
      value: macd.histogram,
      threshold: 'Bullish > 0, Bearish < 0',
    });

    if (macd.histogram > 0 && macd.macdLine > macd.signalLine) {
      score += 25; // Bullish momentum
    } else if (macd.histogram < 0 && macd.macdLine < macd.signalLine) {
      score -= 25; // Bearish momentum
    }
  }

  // 3. Moving Average Crossover (Weight: 30 points)
  const crossover = detectMovingAverageCrossover(closePrices, 50, 200);
  const sma50 = calculateSMA(closePrices, 50);
  const sma200 = calculateSMA(closePrices, 200);

  if (sma50 && sma200) {
    triggeredIndicators.push({
      name: 'MA 50/200',
      value: `${sma50.toFixed(2)} / ${sma200.toFixed(2)}`,
      threshold: 'Golden Cross (50>200) bullish, Death Cross (50<200) bearish',
    });

    if (crossover === 'golden_cross') {
      score += 30; // Strong bullish signal
    } else if (crossover === 'death_cross') {
      score -= 30; // Strong bearish signal
    } else if (sma50 > sma200) {
      score += 15; // Uptrend
    } else if (sma50 < sma200) {
      score -= 15; // Downtrend
    }
  }

  // 4. Price vs Moving Averages (Weight: 15 points)
  if (sma50 && sma200) {
    if (currentPrice > sma50 && currentPrice > sma200) {
      score += 15; // Price above both MAs - bullish
      triggeredIndicators.push({
        name: 'Price Position',
        value: `Above MA50 and MA200`,
        threshold: 'Above MAs = bullish',
      });
    } else if (currentPrice < sma50 && currentPrice < sma200) {
      score -= 15; // Price below both MAs - bearish
      triggeredIndicators.push({
        name: 'Price Position',
        value: `Below MA50 and MA200`,
        threshold: 'Below MAs = bearish',
      });
    }
  }

  // 5. Volume Analysis (Weight: 5 points)
  if (priceData.length >= 20) {
    const recentVolumes = priceData.slice(-5).map(d => d.volume || 0);
    const avgRecentVolume = recentVolumes.reduce((a, b) => a + b, 0) / 5;
    
    const historicalVolumes = priceData.slice(-30, -5).map(d => d.volume || 0);
    const avgHistoricalVolume = historicalVolumes.reduce((a, b) => a + b, 0) / 25;

    const volumeRatio = avgHistoricalVolume > 0 ? avgRecentVolume / avgHistoricalVolume : 1;

    if (volumeRatio > 1.5) {
      score += 5; // High volume confirms trend
      triggeredIndicators.push({
        name: 'Volume',
        value: `${(volumeRatio * 100).toFixed(0)}% of average`,
        threshold: 'Above average volume confirms trend',
      });
    }
  }

  // Clamp score to -100 to 100 range
  score = Math.max(-100, Math.min(100, score));

  return {
    score: Math.round(score),
    triggeredIndicators,
  };
}

module.exports = {
  calculateRSI,
  calculateSMA,
  calculateEMA,
  detectMovingAverageCrossover,
  calculateMACD,
  evaluateTechnicalSignal,
};
