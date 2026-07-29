/**
 * Signal History Model - Historical signal performance tracking
 * 
 * Stores signals with price snapshots for backtesting and accuracy analysis.
 * Updated by scheduled functions after 7 and 30 days to track performance.
 */

const mongoose = require('mongoose');

const signalHistorySchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: [true, 'Stock ticker is required'],
    uppercase: true,
    trim: true,
    index: true,
    match: [/^[A-Z]{1,5}$/, 'Please provide a valid stock ticker'],
  },
  signalType: {
    type: String,
    required: [true, 'Signal type is required'],
    enum: {
      values: ['BUY', 'SELL', 'HOLD', 'WATCH'],
      message: '{VALUE} is not a valid signal type',
    },
    index: true,
  },
  confidenceScore: {
    type: Number,
    required: [true, 'Confidence score is required'],
    min: 0,
    max: 100,
  },
  priceAtSignal: {
    type: Number,
    required: [true, 'Price at signal generation is required'],
    min: [0, 'Price cannot be negative'],
  },
  priceAfter7Days: {
    type: Number,
    default: null,
    min: [0, 'Price cannot be negative'],
  },
  priceAfter30Days: {
    type: Number,
    default: null,
    min: [0, 'Price cannot be negative'],
  },
  generatedAt: {
    type: Date,
    required: [true, 'Generation date is required'],
    default: Date.now,
    index: true,
    immutable: true,
  },
}, {
  collection: 'signal_history',
});

// Compound indexes for performance queries and backtesting
signalHistorySchema.index({ ticker: 1, generatedAt: -1 }); // History for a ticker
signalHistorySchema.index({ signalType: 1, generatedAt: -1 }); // History by signal type
signalHistorySchema.index({ confidenceScore: -1, generatedAt: -1 }); // High-confidence history
signalHistorySchema.index({ generatedAt: 1 }); // For scheduled updates (7-day, 30-day)

// Virtual fields for performance calculation
signalHistorySchema.virtual('percentChange7Days').get(function() {
  if (!this.priceAfter7Days || !this.priceAtSignal) return null;
  return ((this.priceAfter7Days - this.priceAtSignal) / this.priceAtSignal) * 100;
});

signalHistorySchema.virtual('percentChange30Days').get(function() {
  if (!this.priceAfter30Days || !this.priceAtSignal) return null;
  return ((this.priceAfter30Days - this.priceAtSignal) / this.priceAtSignal) * 100;
});

signalHistorySchema.virtual('was7DayCorrect').get(function() {
  if (!this.priceAfter7Days) return null;
  const change = this.percentChange7Days;
  if (this.signalType === 'BUY') return change > 0;
  if (this.signalType === 'SELL') return change < 0;
  return null; // HOLD/WATCH don't have right/wrong
});

signalHistorySchema.virtual('was30DayCorrect').get(function() {
  if (!this.priceAfter30Days) return null;
  const change = this.percentChange30Days;
  if (this.signalType === 'BUY') return change > 0;
  if (this.signalType === 'SELL') return change < 0;
  return null;
});

// Include virtuals in JSON output
signalHistorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('SignalHistory', signalHistorySchema);
