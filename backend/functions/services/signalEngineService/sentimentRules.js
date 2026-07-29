/**
 * Sentiment Rules - Keyword-based sentiment analysis
 * 
 * Simple sentiment scoring based on positive/negative keywords in news headlines.
 * NO API calls - just text analysis.
 * 
 * NOTE: This is a basic implementation using keyword matching.
 * Can be upgraded to use Gemini API or proper NLP models (VADER, TextBlob, etc.)
 * for more accurate sentiment analysis in the future.
 * 
 * Standard Sentiment Thresholds:
 * - Score > 40: Very positive sentiment (bullish)
 * - Score 20-40: Positive sentiment (moderately bullish)
 * - Score -20 to 20: Neutral sentiment
 * - Score -40 to -20: Negative sentiment (moderately bearish)
 * - Score < -40: Very negative sentiment (bearish)
 */

// Positive keywords that suggest bullish sentiment
const POSITIVE_KEYWORDS = [
  'surge', 'soar', 'rally', 'gain', 'rise', 'jump', 'climb',
  'boost', 'profit', 'growth', 'beat', 'exceed', 'outperform',
  'upgrade', 'bullish', 'optimistic', 'strong', 'record',
  'breakthrough', 'innovation', 'expansion', 'partnership',
  'acquisition', 'revenue', 'earnings beat', 'positive',
  'success', 'opportunity', 'momentum', 'recovery',
];

// Negative keywords that suggest bearish sentiment
const NEGATIVE_KEYWORDS = [
  'plunge', 'crash', 'drop', 'fall', 'decline', 'sink', 'tumble',
  'loss', 'miss', 'disappoint', 'concern', 'worry', 'fear',
  'downgrade', 'bearish', 'pessimistic', 'weak', 'struggle',
  'lawsuit', 'investigation', 'scandal', 'fraud', 'bankruptcy',
  'layoff', 'cut', 'slash', 'reduce', 'warning', 'negative',
  'risk', 'threat', 'challenge', 'pressure', 'debt',
];

/**
 * Score a single headline's sentiment
 * 
 * Counts positive and negative keywords, returns a score.
 * 
 * @param {string} headline - News headline text
 * @returns {number} Sentiment score (-10 to 10)
 */
function scoreHeadlineSentiment(headline) {
  if (!headline || typeof headline !== 'string') {
    return 0;
  }

  const lowerHeadline = headline.toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;

  // Count positive keywords
  POSITIVE_KEYWORDS.forEach(keyword => {
    if (lowerHeadline.includes(keyword)) {
      positiveCount++;
    }
  });

  // Count negative keywords
  NEGATIVE_KEYWORDS.forEach(keyword => {
    if (lowerHeadline.includes(keyword)) {
      negativeCount++;
    }
  });

  // Calculate net sentiment (-10 to 10)
  const netSentiment = positiveCount - negativeCount;
  
  // Clamp to -10 to 10 range
  return Math.max(-10, Math.min(10, netSentiment));
}

/**
 * Evaluate sentiment signal from news headlines
 * 
 * Analyzes multiple news headlines and returns overall sentiment score.
 * 
 * @param {Array<string>} newsHeadlines - Array of news headline strings
 * @returns {Object} { score: number, triggeredIndicators: Array }
 */
function evaluateSentimentSignal(newsHeadlines) {
  if (!newsHeadlines || !Array.isArray(newsHeadlines) || newsHeadlines.length === 0) {
    return {
      score: 0,
      triggeredIndicators: [],
      error: 'No news headlines provided for sentiment analysis',
    };
  }

  // Score each headline
  const headlineScores = newsHeadlines.map(headline => scoreHeadlineSentiment(headline));
  
  // Calculate average sentiment
  const totalScore = headlineScores.reduce((sum, score) => sum + score, 0);
  const avgSentiment = totalScore / headlineScores.length;

  // Scale to -100 to 100 range
  // Each headline can contribute -10 to +10, we'll scale this to -100 to 100
  let scaledScore = avgSentiment * 10;

  // Apply weighting based on number of headlines
  // More headlines = more confidence in sentiment
  if (newsHeadlines.length >= 10) {
    // Full weight for 10+ headlines
    scaledScore = scaledScore * 1.0;
  } else if (newsHeadlines.length >= 5) {
    // 80% weight for 5-9 headlines
    scaledScore = scaledScore * 0.8;
  } else {
    // 60% weight for fewer than 5 headlines
    scaledScore = scaledScore * 0.6;
  }

  // Clamp final score to -100 to 100
  scaledScore = Math.max(-100, Math.min(100, scaledScore));

  // Determine sentiment category
  let sentimentCategory;
  if (scaledScore > 40) {
    sentimentCategory = 'Very Positive';
  } else if (scaledScore > 20) {
    sentimentCategory = 'Positive';
  } else if (scaledScore >= -20) {
    sentimentCategory = 'Neutral';
  } else if (scaledScore >= -40) {
    sentimentCategory = 'Negative';
  } else {
    sentimentCategory = 'Very Negative';
  }

  // Count positive and negative headlines
  const positiveHeadlines = headlineScores.filter(s => s > 0).length;
  const negativeHeadlines = headlineScores.filter(s => s < 0).length;
  const neutralHeadlines = headlineScores.filter(s => s === 0).length;

  const triggeredIndicators = [
    {
      name: 'News Sentiment',
      value: `${sentimentCategory} (${scaledScore.toFixed(0)})`,
      threshold: 'Positive > 20, Neutral -20 to 20, Negative < -20',
    },
    {
      name: 'Headline Breakdown',
      value: `${positiveHeadlines} positive, ${negativeHeadlines} negative, ${neutralHeadlines} neutral`,
      threshold: `Based on ${newsHeadlines.length} headlines`,
    },
  ];

  return {
    score: Math.round(scaledScore),
    triggeredIndicators,
  };
}

/**
 * Get sentiment summary statistics
 * 
 * Helper function to analyze sentiment distribution.
 * Useful for debugging or detailed reporting.
 * 
 * @param {Array<string>} newsHeadlines - Array of news headline strings
 * @returns {Object} Statistics about sentiment
 */
function getSentimentStats(newsHeadlines) {
  if (!newsHeadlines || !Array.isArray(newsHeadlines) || newsHeadlines.length === 0) {
    return null;
  }

  const scores = newsHeadlines.map(headline => scoreHeadlineSentiment(headline));
  
  const positive = scores.filter(s => s > 0).length;
  const negative = scores.filter(s => s < 0).length;
  const neutral = scores.filter(s => s === 0).length;
  
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const avgScore = totalScore / scores.length;

  return {
    totalHeadlines: newsHeadlines.length,
    positiveCount: positive,
    negativeCount: negative,
    neutralCount: neutral,
    avgSentimentScore: avgScore.toFixed(2),
    distribution: {
      positive: ((positive / newsHeadlines.length) * 100).toFixed(1) + '%',
      negative: ((negative / newsHeadlines.length) * 100).toFixed(1) + '%',
      neutral: ((neutral / newsHeadlines.length) * 100).toFixed(1) + '%',
    },
  };
}

module.exports = {
  scoreHeadlineSentiment,
  evaluateSentimentSignal,
  getSentimentStats,
  POSITIVE_KEYWORDS, // Export for testing/customization
  NEGATIVE_KEYWORDS, // Export for testing/customization
};
