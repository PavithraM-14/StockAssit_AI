/**
 * AI Response Cache Model - Caches Gemini AI responses
 * 
 * Reduces API calls and costs by caching AI-generated explanations.
 * Automatically expires via TTL index based on response type.
 * Uses MD5 hash of input to detect duplicate queries.
 */

const mongoose = require('mongoose');

const aiResponseCacheSchema = new mongoose.Schema({
  ticker: {
    type: String,
    uppercase: true,
    trim: true,
    index: true,
    sparse: true, // Some cache entries may not have a ticker (general Q&A)
    match: [/^[A-Z]{1,5}$/, 'Please provide a valid stock ticker'],
  },
  type: {
    type: String,
    required: [true, 'Cache type is required'],
    enum: {
      values: ['SIGNAL_EXPLANATION', 'SUMMARY', 'SENTIMENT', 'QNA'],
      message: '{VALUE} is not a valid cache type',
    },
    index: true,
  },
  inputHash: {
    type: String,
    required: [true, 'Input hash is required'],
    index: true,
    unique: true, // Ensure one cache entry per unique input
  },
  response: {
    type: String,
    required: [true, 'Cached response is required'],
    maxlength: [5000, 'Response cannot exceed 5000 characters'],
  },
  tokenCount: {
    type: Number,
    min: 0,
    default: 0, // Track API usage for cost monitoring
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true,
    immutable: true,
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    index: true,
  },
  hitCount: {
    type: Number,
    default: 0,
    min: 0, // Track cache effectiveness
  },
}, {
  collection: 'ai_response_cache',
});

// Compound index for efficient cache lookups (most specific first)
aiResponseCacheSchema.index({ inputHash: 1 }, { unique: true }); // Primary lookup
aiResponseCacheSchema.index({ ticker: 1, type: 1, generatedAt: -1 }); // Ticker cache history
aiResponseCacheSchema.index({ type: 1, generatedAt: -1 }); // Type-based queries

// TTL index - MongoDB automatically deletes expired documents
aiResponseCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance method to increment hit count
aiResponseCacheSchema.methods.recordHit = function() {
  this.hitCount += 1;
  return this.save();
};

// Static method to get cache hit rate
aiResponseCacheSchema.statics.getCacheStats = async function() {
  const total = await this.countDocuments();
  const avgHits = await this.aggregate([
    { $group: { _id: null, avgHits: { $avg: '$hitCount' } } }
  ]);
  
  return {
    totalEntries: total,
    avgHitsPerEntry: avgHits[0]?.avgHits || 0,
  };
};

module.exports = mongoose.model('AIResponseCache', aiResponseCacheSchema);
