/**
 * Signal Engine Service - Main orchestrator
 * 
 * Combines technical, fundamental, and sentiment analysis to generate
 * trading signals (BUY/SELL/HOLD/WATCH).
 * 
 * CRITICAL ARCHITECTURE:
 * 1. Rule-based logic decides signals (NOT AI)
 * 2. This service does NOT call Gemini - controller handles that
 * 3. Pure function - takes data in, returns signal out
 * 
 * WORKFLOW:
 * 1. Run three rule engines: technical, fundamental, sentiment
 * 2. Combine scores with weighted average
 * 3. Apply thresholds to determine signal type
 * 4. Return signal object (controller adds AI explanation later)
 */

const technicalRules = require('./technicalRules');
const fundamentalRules = require('./fundamentalRules');
const sentimentRules = require('./sentimentRules');

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CONFIGURABLE WEIGHTS - Easy to tune for different strategies
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Adjust these to change how much each factor influences the final signal.
 * Weights must sum to 1.0 (100%).
 * 
 * Examples:
 * - Day traders: Increase technical weight (e.g., 60%, 25%, 15%)
 * - Value investors: Increase fundamental weight (e.g., 30%, 50%, 20%)
 * - Swing traders: Balanced approach (current: 50%, 30%, 20%)
 */
const WEIGHTS = {
  technical: 0.50,    // 50% - Price action, momentum, chart patterns
  fundamental: 0.30,  // 30% - Company financials, valuation metrics
  sentiment: 0.20,    // 20% - News sentiment, market mood
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SIGNAL TYPE THRESHOLDS
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Maps combined score (-100 to 100) to signal types.
 * Adjust these for more/less aggressive signals.
 */
const SIGNAL_THRESHOLDS = {
  BUY: 40,          // Score > 40 → BUY (strong positive)
  SELL: -40,        // Score < -40 → SELL (strong negative)
  HOLD_MIN: -10,    // Score -10 to 10 → HOLD (neutral)
  HOLD_MAX: 10,
  // Everything else → WATCH
};

/**
 * Generate trading signal from market data
 * 
 * This is a PURE FUNCTION that takes data in and returns a signal.
 * It does NOT fetch data or call external APIs (including Gemini).
 * 
 * @param {Object} data - Market data for analysis
 * @param {string} data.ticker - Stock ticker symbol (e.g., 'AAPL')
 * @param {Array<Object>} data.prices - Historical OHLCV price data
 * @param {Object} data.fundamentals - Company fundamental metrics
 * @param {Array<string>} data.newsHeadlines - Recent news headlines
 * @returns {Object} Signal object { ticker, signalType, confidenceScore, triggeredIndicators, scores, generatedAt }
 */
function generateSignal({ ticker, prices, fundamentals, newsHeadlines }) {
  console.log(`\n🎯 Generating signal for ${ticker}...`);

  // Step 1: Run technical analysis
  console.log('📈 Technical analysis...');
  const technicalResult = technicalRules.evaluateTechnicalSignal(prices);
  
  if (technicalResult.error) {
    console.warn(`⚠️  Technical: ${technicalResult.error}`);
  }

  // Step 2: Run fundamental analysis
  console.log('💰 Fundamental analysis...');
  const fundamentalResult = fundamentalRules.evaluateFundamentalSignal(fundamentals);
  
  if (fundamentalResult.error) {
    console.warn(`⚠️  Fundamental: ${fundamentalResult.error}`);
  }

  // Step 3: Run sentiment analysis
  console.log('📰 Sentiment analysis...');
  const sentimentResult = sentimentRules.evaluateSentimentSignal(newsHeadlines);
  
  if (sentimentResult.error) {
    console.warn(`⚠️  Sentiment: ${sentimentResult.error}`);
  }

  // Step 4: Combine scores with weighted average
  console.log('⚖️  Combining scores...');
  const combinedScore = calculateWeightedScore({
    technical: technicalResult.score,
    fundamental: fundamentalResult.score,
    sentiment: sentimentResult.score,
  });

  console.log(`   Technical: ${technicalResult.score} × ${WEIGHTS.technical * 100}% = ${(technicalResult.score * WEIGHTS.technical).toFixed(1)}`);
  console.log(`   Fundamental: ${fundamentalResult.score} × ${WEIGHTS.fundamental * 100}% = ${(fundamentalResult.score * WEIGHTS.fundamental).toFixed(1)}`);
  console.log(`   Sentiment: ${sentimentResult.score} × ${WEIGHTS.sentiment * 100}% = ${(sentimentResult.score * WEIGHTS.sentiment).toFixed(1)}`);
  console.log(`   → Combined Score: ${combinedScore.toFixed(2)}`);

  // Step 5: Determine signal type based on thresholds
  const signalType = determineSignalType(combinedScore);
  console.log(`   → Signal Type: ${signalType}`);

  // Step 6: Calculate confidence score (0-100)
  const confidenceScore = Math.round(Math.abs(combinedScore));
  console.log(`   → Confidence: ${confidenceScore}%`);

  // Step 7: Merge all triggered indicators
  const triggeredIndicators = [
    ...technicalResult.triggeredIndicators,
    ...fundamentalResult.triggeredIndicators,
    ...sentimentResult.triggeredIndicators,
  ];

  // Step 8: Build signal object
  const signal = {
    ticker: ticker.toUpperCase(),
    signalType,
    confidenceScore,
    triggeredIndicators,
    scores: {
      technical: technicalResult.score,
      fundamental: fundamentalResult.score,
      sentiment: sentimentResult.score,
      combined: Math.round(combinedScore * 100) / 100, // Round to 2 decimals
    },
    generatedAt: new Date(),
  };

  console.log(`✅ Signal generated for ${ticker}: ${signalType} (${confidenceScore}%)\n`);

  return signal;
}

/**
 * Calculate weighted score from three analysis types
 * 
 * @param {Object} scores - Individual scores from each analysis
 * @param {number} scores.technical - Technical analysis score (-100 to 100)
 * @param {number} scores.fundamental - Fundamental analysis score (-100 to 100)
 * @param {number} scores.sentiment - Sentiment analysis score (-100 to 100)
 * @returns {number} Weighted combined score (-100 to 100)
 */
function calculateWeightedScore({ technical, fundamental, sentiment }) {
  const weighted = 
    (technical * WEIGHTS.technical) +
    (fundamental * WEIGHTS.fundamental) +
    (sentiment * WEIGHTS.sentiment);

  // Clamp to -100 to 100 range (should already be in range, but safety check)
  return Math.max(-100, Math.min(100, weighted));
}

/**
 * Determine signal type from combined score
 * 
 * Maps the combined score to one of four signal types:
 * - BUY: Strong positive signal (score > 40)
 * - SELL: Strong negative signal (score < -40)
 * - HOLD: Neutral signal (-10 to 10)
 * - WATCH: Everything else (moderate positive or negative)
 * 
 * @param {number} score - Combined weighted score (-100 to 100)
 * @returns {string} Signal type: 'BUY', 'SELL', 'HOLD', or 'WATCH'
 */
function determineSignalType(score) {
  if (score > SIGNAL_THRESHOLDS.BUY) {
    return 'BUY';
  } else if (score < SIGNAL_THRESHOLDS.SELL) {
    return 'SELL';
  } else if (score >= SIGNAL_THRESHOLDS.HOLD_MIN && score <= SIGNAL_THRESHOLDS.HOLD_MAX) {
    return 'HOLD';
  } else {
    return 'WATCH';
  }
}

module.exports = {
  generateSignal,
  calculateWeightedScore,
  determineSignalType,
  WEIGHTS,
  SIGNAL_THRESHOLDS,
};
