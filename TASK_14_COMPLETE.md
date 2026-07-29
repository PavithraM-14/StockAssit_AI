# Task 14: Signals Controller - COMPLETE ✅

## Overview
The `signals.controller.js` has been completely rewritten to match your exact requirements, using try/catch with next(error) pattern and proper integration with all services.

## File Location
`backend/functions/controllers/signals.controller.js`

---

## ✅ All Requirements Met

### 1. ✅ getSignalForTicker - GET /signals/:ticker

**Logic Flow:**
1. Check MongoDB for non-expired cached Signal
2. If found: Return cached signal
3. If missing/expired:
   - Fetch prices, fundamentals, news from marketDataService
   - Run signalEngineService.generateSignal()
   - Call geminiService.generateExplanation() with buildSignalExplanationPrompt()
   - Save combined result to Signal collection
   - Also save to SignalHistory collection for performance tracking
4. Return signal as JSON

**Response:**
```javascript
{
  success: true,
  data: {
    ticker: 'AAPL',
    signalType: 'BUY',
    confidenceScore: 75,
    triggeredIndicators: [...],
    aiExplanation: '...',
    technicalScore: 60,
    fundamentalScore: 45,
    sentimentScore: 30,
    generatedAt: Date,
    expiresAt: Date,
  },
  cached: true/false,  // Indicates if from cache or newly generated
  disclaimer: '⚠️ Not financial advice...'
}
```

---

### 2. ✅ getSignalHistory - GET /signals/:ticker/history

**Logic Flow:**
1. Fetch SignalHistory documents for ticker
2. Sort by date (newest first)
3. Apply limit from query params (default: 30)
4. Calculate performance stats (success rate, avg returns)
5. Return history + stats as JSON

**Response:**
```javascript
{
  success: true,
  data: {
    ticker: 'AAPL',
    history: [
      {
        ticker: 'AAPL',
        signalType: 'BUY',
        confidenceScore: 75,
        priceAtSignal: 150.00,
        priceAfter7Days: 155.00,
        priceAfter30Days: 160.00,
        generatedAt: Date,
        // Virtual fields:
        percentChange7Days: 3.33,
        percentChange30Days: 6.67,
        was7DayCorrect: true,
        was30DayCorrect: true,
      },
      // ...more history
    ],
    stats: {
      total: 50,
      completed: 42,
      pending: 8,
      successRate: '71.4%',
      avgReturn7d: '2.5%',
      avgReturn30d: '5.8%',
    },
    count: 30,
  }
}
```

---

### 3. ✅ getSignalsForWatchlist - GET /signals/watchlist

**Authentication Required:** Uses `req.user.uid` from verifyFirebaseToken middleware

**Logic Flow:**
1. Get user's watchlist from MongoDB using `req.user.uid`
2. If watchlist empty: Return empty array with message
3. For each ticker in watchlist:
   - Check for cached signal
   - If cached: Use it
   - If not cached: Generate new signal (same logic as getSignalForTicker)
4. Run all ticker fetches in parallel using Promise.all
5. Return all successful signals + summary

**Response:**
```javascript
{
  success: true,
  data: [
    { /* Signal for AAPL */ },
    { /* Signal for GOOGL */ },
    { /* Signal for MSFT */ },
  ],
  summary: {
    total: 5,
    successful: 3,
    failed: 2,
    failures: [
      { ticker: 'TSLA', error: 'Rate limit exceeded' },
      { ticker: 'NVDA', error: 'Invalid ticker' }
    ]
  },
  disclaimer: '⚠️ Not financial advice...'
}
```

---

## Error Handling Pattern

All functions use try/catch with next(error):

```javascript
exports.getSignalForTicker = async (req, res, next) => {
  try {
    // ... main logic
  } catch (error) {
    console.error('Error in getSignalForTicker:', error);
    next(error); // Passes to errorHandler middleware
  }
};
```

This relies on the global errorHandler.js middleware to format errors consistently.

---

## Integration Points

### Services Used:
1. **signalEngineService.generateSignal()**
   ```javascript
   const signalData = signalEngineService.generateSignal({
     ticker,
     prices,
     fundamentals,
     newsHeadlines,
   });
   ```

2. **marketDataService** (3 functions)
   ```javascript
   await marketDataService.getHistoricalPrices(ticker, '1Y')
   await marketDataService.getFundamentals(ticker)
   await marketDataService.getCompanyNews(ticker)
   ```

3. **geminiService.generateExplanation()**
   ```javascript
   const aiExplanation = await geminiService.generateExplanation(prompt);
   ```

4. **promptTemplates.buildSignalExplanationPrompt()**
   ```javascript
   const prompt = buildSignalExplanationPrompt({
     ticker,
     signalType,
     confidenceScore,
     indicators,
   });
   ```

### Models Used:
1. **Signal** - Main signal documents (24h TTL)
2. **SignalHistory** - Historical performance tracking
3. **Watchlist** - User's watched tickers

---

## Key Features

### 1. Smart Caching
- Checks for existing non-expired signals before generating
- 24-hour cache duration (TTL index on MongoDB)
- Returns `cached: true/false` to indicate source

### 2. Dual Storage
- **Signal collection:** Active signals with 24h expiry
- **SignalHistory collection:** Permanent record for performance tracking

### 3. Performance Tracking
Helper function calculates:
- Total signals vs completed (have 7-day follow-up data)
- Success rate (directional accuracy)
- Average 7-day and 30-day returns

### 4. Parallel Processing
Watchlist endpoint fetches/generates signals in parallel for efficiency:
```javascript
const signalPromises = watchlist.tickers.map(async (ticker) => {
  // ... fetch or generate signal
});
const results = await Promise.all(signalPromises);
```

### 5. Graceful Degradation
Watchlist endpoint continues even if some tickers fail:
```javascript
{
  summary: {
    total: 5,
    successful: 3,
    failed: 2,
    failures: [...]  // Lists which tickers failed and why
  }
}
```

---

## Example Usage

### 1. Get Signal (First Time)
```http
GET /signals/AAPL

Response (201):
{
  success: true,
  data: { /* full signal */ },
  cached: false,  // Newly generated
  disclaimer: '...'
}
```

### 2. Get Signal (Cached)
```http
GET /signals/AAPL

Response (200):
{
  success: true,
  data: { /* same signal */ },
  cached: true,   // From cache
  disclaimer: '...'
}
```

### 3. Get History
```http
GET /signals/AAPL/history?limit=50

Response:
{
  success: true,
  data: {
    ticker: 'AAPL',
    history: [...],
    stats: {
      successRate: '75.5%',
      avgReturn7d: '3.2%',
      ...
    }
  }
}
```

### 4. Get Watchlist Signals
```http
GET /signals/watchlist
Authorization: Bearer <firebase-token>

Response:
{
  success: true,
  data: [
    { /* AAPL signal */ },
    { /* GOOGL signal */ },
    { /* MSFT signal */ },
  ],
  summary: { total: 3, successful: 3, failed: 0 }
}
```

---

## Signal Generation Flow

```
User Request → getSignalForTicker
                    ↓
        Check MongoDB for cached signal
                    ↓
         ┌──────────┴──────────┐
         ↓                     ↓
    Found (not expired)    Not found/expired
         ↓                     ↓
    Return cached        Fetch market data
                              ↓
                     signalEngineService.generateSignal()
                     (technical + fundamental + sentiment)
                              ↓
                     Build prompt with promptTemplates
                              ↓
                     geminiService.generateExplanation()
                              ↓
                     Combine signal + AI explanation
                              ↓
                     Save to Signal collection (24h TTL)
                              ↓
                     Save to SignalHistory collection
                              ↓
                     Return new signal
```

---

## Performance Stats Calculation

```javascript
function calculatePerformanceStats(history) {
  // Filters completed signals (have 7-day follow-up data)
  const completed = history.filter(h => h.priceAfter7Days !== null);
  
  // Calculate success rate
  // BUY signal correct if price went up
  // SELL signal correct if price went down
  // HOLD signal correct if price stayed stable (±2%)
  
  // Calculate average returns
  // 7-day and 30-day percentage changes
  
  return {
    total: history.length,
    completed: completed.length,
    pending: history.length - completed.length,
    successRate: '75.0%',
    avgReturn7d: '2.5%',
    avgReturn30d: '5.8%',
  };
}
```

---

## Route Setup (for reference)

These endpoints should be wired in routes file:

```javascript
const router = require('express').Router();
const signalsController = require('../controllers/signals.controller');
const { verifyFirebaseToken } = require('../middleware/verifyFirebaseToken');

// Public endpoint
router.get('/signals/:ticker', signalsController.getSignalForTicker);
router.get('/signals/:ticker/history', signalsController.getSignalHistory);

// Protected endpoint (requires authentication)
router.get('/signals/watchlist', 
  verifyFirebaseToken, 
  signalsController.getSignalsForWatchlist
);
```

---

## File Statistics

- **Lines:** ~350
- **Functions:** 3 main exports + 1 helper
- **Error Handling:** try/catch + next(error) pattern
- **Dependencies:** 7 imports (models, services, utils)

---

## Testing Checklist

- [ ] GET /signals/AAPL - First time (should generate)
- [ ] GET /signals/AAPL - Second time (should return cached)
- [ ] GET /signals/AAPL - After 24 hours (should regenerate)
- [ ] GET /signals/INVALID - Invalid ticker (should error)
- [ ] GET /signals/AAPL/history - Returns history
- [ ] GET /signals/AAPL/history?limit=10 - Respects limit
- [ ] GET /signals/watchlist - With auth (should work)
- [ ] GET /signals/watchlist - Without auth (should 401)
- [ ] GET /signals/watchlist - Empty watchlist (should return empty array)
- [ ] SignalHistory creation - Verify priceAtSignal is saved correctly

---

**Status:** ✅ Task 14 Complete

**Matches All Requirements:**
- ✅ getSignalForTicker checks cache, generates if needed
- ✅ Fetches data from marketDataService
- ✅ Calls signalEngineService.generateSignal()
- ✅ Calls geminiService with promptTemplates
- ✅ Saves to both Signal and SignalHistory collections
- ✅ getSignalHistory returns sorted history
- ✅ getSignalsForWatchlist uses req.user.uid
- ✅ Uses try/catch + next(error) pattern
- ✅ All endpoints return proper JSON responses
