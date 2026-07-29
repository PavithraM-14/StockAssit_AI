/**
 * Watchlist Model - User's monitored stocks
 * 
 * Each user has one watchlist containing multiple stock tickers.
 * Used to generate signal feeds for watched stocks.
 */

const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true,
    index: true,
    trim: true,
  },
  tickers: [{
    type: String,
    uppercase: true,
    trim: true,
    match: [/^[A-Z]{1,5}$/, 'Invalid ticker symbol'],
  }],
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'watchlists',
});

// Validation: Max 50 tickers per watchlist
watchlistSchema.path('tickers').validate(function(tickers) {
  return tickers.length <= 50;
}, 'Watchlist cannot contain more than 50 tickers');

// Remove duplicates before saving
watchlistSchema.pre('save', function(next) {
  if (this.tickers) {
    this.tickers = [...new Set(this.tickers)]; // Remove duplicates
  }
  next();
});

// Instance method to add ticker
watchlistSchema.methods.addTicker = function(ticker) {
  const upperTicker = ticker.toUpperCase();
  if (!this.tickers.includes(upperTicker)) {
    this.tickers.push(upperTicker);
  }
  return this.save();
};

// Instance method to remove ticker
watchlistSchema.methods.removeTicker = function(ticker) {
  const upperTicker = ticker.toUpperCase();
  this.tickers = this.tickers.filter(t => t !== upperTicker);
  return this.save();
};

module.exports = mongoose.model('Watchlist', watchlistSchema);
