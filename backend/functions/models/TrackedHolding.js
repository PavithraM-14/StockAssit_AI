/**
 * Tracked Holding Model - Portfolio tracking (analysis only, no execution)
 * 
 * Users track their holdings for performance analysis.
 * NOT used for actual trading - users execute through their own brokers.
 */

const mongoose = require('mongoose');

const trackedHoldingSchema = new mongoose.Schema({
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
    match: [/^[A-Z]{1,5}$/, 'Please provide a valid stock ticker'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
  },
  avgBuyPrice: {
    type: Number,
    required: [true, 'Average buy price is required'],
    min: [0, 'Price cannot be negative'],
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required'],
    default: Date.now,
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: '',
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'tracked_holdings',
});

// Compound indexes for efficient queries
trackedHoldingSchema.index({ userId: 1, ticker: 1 }); // User's specific holding
trackedHoldingSchema.index({ userId: 1, createdAt: -1 }); // User's holdings by date
trackedHoldingSchema.index({ ticker: 1 }); // All holdings for a ticker

// Virtual for current value calculation (requires current price from API)
trackedHoldingSchema.virtual('currentValue').get(function() {
  // This would be calculated with real-time price data
  return this.quantity * this.avgBuyPrice;
});

module.exports = mongoose.model('TrackedHolding', trackedHoldingSchema);
