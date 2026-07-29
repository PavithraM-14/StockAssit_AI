/**
 * User Model - StockSense user profiles with preferences
 * 
 * Stores user settings, risk profiles, and notification preferences.
 * Linked to Firebase Authentication via firebaseUid.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: [true, 'Firebase UID is required'],
    unique: true,
    index: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  displayName: {
    type: String,
    trim: true,
    default: null,
  },
  riskProfile: {
    type: String,
    enum: {
      values: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'],
      message: '{VALUE} is not a valid risk profile',
    },
    default: 'MODERATE',
  },
  investmentGoals: {
    type: [String],
    enum: ['GROWTH', 'INCOME', 'PRESERVATION', 'SPECULATION'],
    default: [],
  },
  preferredSectors: {
    type: [String],
    default: [],
    validate: {
      validator: function(sectors) {
        return sectors.length <= 10; // Max 10 sectors
      },
      message: 'Cannot have more than 10 preferred sectors',
    },
  },
  // FCM tokens for push notifications
  fcmTokens: {
    type: [String],
    default: [],
  },
  // Notification preferences
  notifications: {
    signalAlerts: {
      type: Boolean,
      default: true,
    },
    priceAlerts: {
      type: Boolean,
      default: true,
    },
    newsAlerts: {
      type: Boolean,
      default: false,
    },
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'users',
});

// Indexes for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1, createdAt: -1 });

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.fcmTokens; // Don't expose FCM tokens in API responses
  return user;
};

module.exports = mongoose.model('User', userSchema);
