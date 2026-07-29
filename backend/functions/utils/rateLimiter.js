/**
 * Rate Limiter for Expensive API Calls
 * Prevents abuse of Gemini AI and market data APIs
 */

const rateLimit = require('express-rate-limit');

// General rate limiter for AI endpoints
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many AI requests. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for chat (more expensive)
const chatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many chat requests. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Signal generation rate limiter
const signalRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 requests per 5 minutes
  message: {
    success: false,
    message: 'Too many signal requests. Please try again in a few minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = aiRateLimiter;
module.exports.chatRateLimiter = chatRateLimiter;
module.exports.signalRateLimiter = signalRateLimiter;
