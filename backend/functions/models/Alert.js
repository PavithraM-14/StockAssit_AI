/**
 * Alert Model - User-defined stock alerts
 * 
 * Users set alerts for price movements, signals, or technical indicators.
 * Alerts are checked periodically by scheduled functions.
 */

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true,
    trim: true,
  },
  ticker: {
    type: String,
    required: [true, 'Stock ticker is required'],
    uppercase: true,
    trim: true,
    index: true,
    match: [/^[A-Z]{1,5}$/, 'Please provide a valid stock ticker'],
  },
  condition: {
    type: String,
    required: [true, 'Alert condition is required'],
    enum: {
      values: [
        'PRICE_ABOVE',
        'PRICE_BELOW',
        'SIGNAL_BUY',
        'SIGNAL_SELL',
        'CONFIDENCE_ABOVE',
        'RSI_OVERSOLD',
        'RSI_OVERBOUGHT',
        'VOLUME_SPIKE',
      ],
      message: '{VALUE} is not a valid alert condition',
    },
  },
  threshold: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Alert threshold is required'],
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastTriggered: {
    type: Date,
    default: null,
  },
  triggerCount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'alerts',
});

// Compound indexes for efficient queries
alertSchema.index({ userId: 1, ticker: 1, isActive: 1 });
alertSchema.index({ isActive: 1, ticker: 1 }); // For batch alert checking
alertSchema.index({ userId: 1, createdAt: -1 }); // User's alerts by date

// Instance method to trigger alert
alertSchema.methods.trigger = function() {
  this.lastTriggered = new Date();
  this.triggerCount += 1;
  return this.save();
};

// Instance method to toggle active status
alertSchema.methods.toggle = function() {
  this.isActive = !this.isActive;
  return this.save();
};

module.exports = mongoose.model('Alert', alertSchema);
