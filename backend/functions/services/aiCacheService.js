/**
 * AI Cache Service
 * Manages caching of Gemini AI responses to reduce API calls
 */

const crypto = require('crypto');
const AIResponseCache = require('../models/AIResponseCache');

/**
 * Generate hash from input for cache key
 */
function generateInputHash(input) {
  return crypto.createHash('md5').update(JSON.stringify(input)).digest('hex');
}

/**
 * Get cached AI response
 */
exports.getCachedResponse = async (ticker, type, input) => {
  try {
    const inputHash = generateInputHash(input);
    
    const cached = await AIResponseCache.findOne({
      ticker,
      type,
      inputHash,
      expiresAt: { $gt: Date.now() }
    });
    
    if (cached) {
      console.log(`Cache hit for ${ticker} - ${type}`);
      return cached.response;
    }
    
    console.log(`Cache miss for ${ticker} - ${type}`);
    return null;
  } catch (error) {
    console.error('Error retrieving cached response:', error);
    return null; // Don't fail, just skip cache
  }
};

/**
 * Store AI response in cache
 */
exports.cacheResponse = async (ticker, type, input, response, ttlMinutes = 60) => {
  try {
    const inputHash = generateInputHash(input);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    
    // Upsert: update if exists, insert if not
    await AIResponseCache.findOneAndUpdate(
      { ticker, type, inputHash },
      {
        ticker,
        type,
        inputHash,
        response,
        generatedAt: Date.now(),
        expiresAt
      },
      { upsert: true, new: true }
    );
    
    console.log(`Cached response for ${ticker} - ${type} (TTL: ${ttlMinutes}m)`);
  } catch (error) {
    console.error('Error caching response:', error);
    // Don't throw - caching failure shouldn't break the flow
  }
};

/**
 * Clear cache for a specific ticker
 */
exports.clearCacheForTicker = async (ticker) => {
  try {
    const result = await AIResponseCache.deleteMany({ ticker });
    console.log(`Cleared ${result.deletedCount} cache entries for ${ticker}`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return 0;
  }
};

/**
 * Clear all expired cache entries (manual cleanup)
 */
exports.clearExpiredCache = async () => {
  try {
    const result = await AIResponseCache.deleteMany({
      expiresAt: { $lt: Date.now() }
    });
    console.log(`Cleared ${result.deletedCount} expired cache entries`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error clearing expired cache:', error);
    return 0;
  }
};

/**
 * Get cache statistics
 */
exports.getCacheStats = async () => {
  try {
    const total = await AIResponseCache.countDocuments();
    const expired = await AIResponseCache.countDocuments({
      expiresAt: { $lt: Date.now() }
    });
    const active = total - expired;
    
    const byType = await AIResponseCache.aggregate([
      { $match: { expiresAt: { $gt: new Date() } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    return {
      total,
      active,
      expired,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
};
