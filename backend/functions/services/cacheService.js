/**
 * Cache Service - MongoDB-backed caching layer
 * 
 * Provides a simple key-value cache stored in MongoDB with TTL support.
 * Used for market data, AI responses, and other expensive operations.
 * 
 * MongoDB TTL index automatically removes expired entries.
 */

const mongoose = require('mongoose');

/**
 * Cache Entry Schema
 * 
 * Stores cached data with automatic expiration via MongoDB TTL index.
 */
const cacheEntrySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Can store any JSON-serializable data
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  hitCount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  collection: 'cache_entries',
});

// TTL index - MongoDB automatically deletes documents when expiresAt is reached
cacheEntrySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance method to increment hit count
cacheEntrySchema.methods.recordHit = function() {
  this.hitCount += 1;
  return this.save();
};

const CacheEntry = mongoose.model('CacheEntry', cacheEntrySchema);

/**
 * Cache Service Class
 */
class CacheService {
  /**
   * Get value from cache
   * 
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null if not found/expired
   */
  async get(key) {
    try {
      const entry = await CacheEntry.findOne({
        key,
        expiresAt: { $gt: new Date() }, // Only return if not expired
      });

      if (!entry) {
        console.log(`❌ Cache miss: ${key}`);
        return null;
      }

      // Record cache hit (don't await to avoid slowing down response)
      entry.recordHit().catch(err => 
        console.error('Failed to record cache hit:', err)
      );

      console.log(`✅ Cache hit: ${key} (hits: ${entry.hitCount + 1})`);
      return entry.value;
    } catch (error) {
      console.error(`Cache get error for key "${key}":`, error.message);
      return null; // Fail gracefully - don't break the app if cache fails
    }
  }

  /**
   * Set value in cache with TTL
   * 
   * @param {string} key - Cache key
   * @param {any} value - Value to cache (must be JSON-serializable)
   * @param {number} ttlSeconds - Time to live in seconds
   * @returns {Promise<void>}
   */
  async set(key, value, ttlSeconds) {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      await CacheEntry.findOneAndUpdate(
        { key },
        {
          key,
          value,
          expiresAt,
          createdAt: new Date(),
          hitCount: 0,
        },
        {
          upsert: true, // Create if doesn't exist, update if exists
          new: true,
        }
      );

      console.log(`💾 Cached: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      console.error(`Cache set error for key "${key}":`, error.message);
      // Don't throw - caching failure shouldn't break the app
    }
  }

  /**
   * Delete value from cache
   * 
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(key) {
    try {
      const result = await CacheEntry.deleteOne({ key });
      const deleted = result.deletedCount > 0;
      
      if (deleted) {
        console.log(`🗑️  Deleted from cache: ${key}`);
      }
      
      return deleted;
    } catch (error) {
      console.error(`Cache delete error for key "${key}":`, error.message);
      return false;
    }
  }

  /**
   * Clear all cache entries (use with caution)
   * 
   * @returns {Promise<number>} Number of entries deleted
   */
  async clear() {
    try {
      const result = await CacheEntry.deleteMany({});
      console.log(`🗑️  Cleared ${result.deletedCount} cache entries`);
      return result.deletedCount;
    } catch (error) {
      console.error('Cache clear error:', error.message);
      return 0;
    }
  }

  /**
   * Clear all expired cache entries (manual cleanup)
   * MongoDB TTL index handles this automatically, but this is useful for testing
   * 
   * @returns {Promise<number>} Number of expired entries deleted
   */
  async clearExpired() {
    try {
      const result = await CacheEntry.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      console.log(`🗑️  Cleared ${result.deletedCount} expired cache entries`);
      return result.deletedCount;
    } catch (error) {
      console.error('Cache clearExpired error:', error.message);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * 
   * @returns {Promise<Object>} Cache stats (total entries, expired, most hit, etc.)
   */
  async getStats() {
    try {
      const total = await CacheEntry.countDocuments();
      const expired = await CacheEntry.countDocuments({
        expiresAt: { $lt: new Date() }
      });
      const active = total - expired;

      const mostHit = await CacheEntry.findOne()
        .sort({ hitCount: -1 })
        .select('key hitCount')
        .limit(1);

      const avgHits = await CacheEntry.aggregate([
        { $match: { expiresAt: { $gt: new Date() } } },
        { $group: { _id: null, avgHits: { $avg: '$hitCount' } } }
      ]);

      return {
        total,
        active,
        expired,
        mostHitKey: mostHit?.key || null,
        mostHitCount: mostHit?.hitCount || 0,
        avgHitsPerEntry: avgHits[0]?.avgHits || 0,
      };
    } catch (error) {
      console.error('Cache getStats error:', error.message);
      return null;
    }
  }

  /**
   * Get or set cache entry with automatic fetch
   * 
   * This is a convenience method that:
   * 1. Checks cache for the key
   * 2. If found, returns cached value
   * 3. If not found, calls fetchFunction(), caches the result, and returns it
   * 
   * @param {string} key - Cache key
   * @param {number} ttlSeconds - Time to live in seconds
   * @param {Function} fetchFunction - Async function that fetches the data
   * @returns {Promise<any>} Cached or freshly fetched value
   * 
   * @example
   * const quote = await cacheService.getOrSet(
   *   `quote:${ticker}`,
   *   60,
   *   async () => await marketDataAPI.getQuote(ticker)
   * );
   */
  async getOrSet(key, ttlSeconds, fetchFunction) {
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Cache miss - fetch fresh data
      console.log(`🔄 Fetching fresh data for: ${key}`);
      const freshData = await fetchFunction();

      // Cache the result
      await this.set(key, freshData, ttlSeconds);

      return freshData;
    } catch (error) {
      console.error(`getOrSet error for key "${key}":`, error.message);
      
      // If fetchFunction fails, try to return stale cache if available
      // (even if expired, stale data is better than no data)
      const staleCache = await CacheEntry.findOne({ key });
      if (staleCache) {
        console.warn(`⚠️  Returning stale cache for ${key} due to fetch error`);
        return staleCache.value;
      }

      // No cache available and fetch failed - propagate error
      throw error;
    }
  }

  /**
   * Clear cache entries by pattern (e.g., all quotes)
   * 
   * @param {string} pattern - Regex pattern to match keys
   * @returns {Promise<number>} Number of entries deleted
   * 
   * @example
   * await cacheService.clearPattern('^quote:'); // Clear all quote caches
   */
  async clearPattern(pattern) {
    try {
      const regex = new RegExp(pattern);
      const result = await CacheEntry.deleteMany({ key: regex });
      console.log(`🗑️  Cleared ${result.deletedCount} cache entries matching pattern: ${pattern}`);
      return result.deletedCount;
    } catch (error) {
      console.error(`clearPattern error for pattern "${pattern}":`, error.message);
      return 0;
    }
  }

  /**
   * Get all cache keys (useful for debugging)
   * 
   * @param {number} limit - Max number of keys to return
   * @returns {Promise<Array<string>>} Array of cache keys
   */
  async getKeys(limit = 100) {
    try {
      const entries = await CacheEntry.find()
        .select('key')
        .limit(limit)
        .lean();
      
      return entries.map(e => e.key);
    } catch (error) {
      console.error('getKeys error:', error.message);
      return [];
    }
  }
}

// Export singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
module.exports.CacheEntry = CacheEntry; // Export model for testing/advanced use
