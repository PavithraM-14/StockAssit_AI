# Task 13: Signal Engine Index.js - COMPLETE ✅

## Overview
The `index.js` file has been updated to match your exact requirements. It's now a **pure function** that takes data as parameters and returns a signal object **without calling Gemini**.

## File Location
`backend/functions/services/signalEngineService/index.js`

---

## ✅ All Requirements Met

### 1. ✅ Function Signature
```javascript
generateSignal({ ticker, prices, fundamentals, newsHeadlines })
```

Takes an object with:
- `ticker` - Stock symbol (e.g., 'AAPL')
- `prices` - Historical OHLCV price array
- `fundamentals` - Company fundamental metrics object
- `newsHeadlines` - Array of news headline strings

### 2. ✅ Calls All Three Rule Engines
```javascript
const technicalResult = technicalRules.evaluateTechnicalSignal(prices);
const fundamentalResult = fundamentalRules.evaluateFundamentalSignal(fundamentals);
const sentimentResult = sentimentRules.evaluateSentimentSignal(newsHeadlines);
```

### 3. ✅ Configurable Weights (Named Constants)
```javascript
const WEIGHTS = {
  technical: 0.50,    // 50% - Price action, momentum, chart patterns
  fundamental: 0.30,  // 30% - Company financials, valuation metrics
  sentiment: 0.20,    // 20% - News sentiment, market mood
};
```

**Easy to tune** - Located at the top of the file with clear comments about different strategies (day traders, value investors, swing traders).

### 4. ✅ Signal Type Mapping
```javascript
const SIGNAL_THRESHOLDS = {
  BUY: 40,          // Score > 40 → BUY
  SELL: -40,        // Score < -40 → SELL
  HOLD_MIN: -10,    // Score -10 to 10 → HOLD
  HOLD_MAX: 10,
  // Everything else → WATCH
};
```

Mapping logic:
- `score > 40` → **BUY** (strong positive)
- `score < -40` → **SELL** (strong negative)
- `-10 ≤ score ≤ 10` → **HOLD** (neutral)
- Everything else → **WATCH** (moderate signals)

### 5. ✅ Return Value
```javascript
{
  ticker: 'AAPL',
  signalType: 'BUY',
  confidenceScore: 65,  // 0-100, absolute value of combined score
  triggeredIndicators: [
    // Merged from all three rule engines
    { name: 'RSI (14)', value: 28.5, threshold: 'Oversold < 30' },
    { name: 'P/E Ratio', value: 25.3, threshold: 'Sector avg: 28.0' },
    { name: 'News Sentiment', value: 'Positive (35)', threshold: '...' }
  ],
  scores: {
    technical: 45,
    fundamental: 30,
    sentiment: 35,
    combined: 37.5
  },
  generatedAt: Date
}
```

### 6. ✅ Does NOT Call Gemini
The function is **pure** - no external API calls. Controller handles AI explanation separately.

---

## Key Features

### Pure Function Design
- ✅ No side effects
- ✅ No external API calls
- ✅ Takes data in, returns signal out
- ✅ Deterministic (same inputs = same outputs)

### Easy Configuration
- ✅ Weights at top of file
- ✅ Thresholds clearly defined
- ✅ Comments explain strategy examples
- ✅ Can tune for different trading styles

### Comprehensive Logging
```
🎯 Generating signal for AAPL...
📈 Technical analysis...
💰 Fundamental analysis...
📰 Sentiment analysis...
⚖️  Combining scores...
   Technical: 45 × 50% = 22.5
   Fundamental: 30 × 30% = 9.0
   Sentiment: 35 × 20% = 7.0
   → Combined Score: 38.50
   → Signal Type: WATCH
   → Confidence: 39%
✅ Signal generated for AAPL: WATCH (39%)
```

### Error Handling
- Warns if any rule engine has errors
- Continues processing with partial data
- Returns valid signal even if some data is missing

---

## Usage Example

### Controller Pattern
```javascript
// In signals.controller.js
const signalEngine = require('../services/signalEngineService');
const geminiService = require('../services/geminiService');
const marketDataService = require('../services/marketDataService');

exports.generateSignal = catchAsync(async (req, res) => {
  const { ticker } = req.params;

  // 1. Fetch market data
  const [prices, fundamentals, news] = await Promise.all([
    marketDataService.getHistoricalPrices(ticker, '1Y'),
    marketDataService.getFundamentals(ticker),
    marketDataService.getCompanyNews(ticker),
  ]);

  // 2. Generate signal (pure function, no Gemini)
  const signal = signalEngine.generateSignal({
    ticker,
    prices,
    fundamentals,
    newsHeadlines: news.map(n => n.headline),
  });

  // 3. Add AI explanation (controller's responsibility)
  const prompt = buildSignalExplanationPrompt(signal);
  const aiExplanation = await geminiService.generateExplanation(prompt);

  // 4. Save to MongoDB
  const savedSignal = await Signal.create({
    ...signal,
    aiExplanation,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  res.json({
    success: true,
    data: savedSignal,
    disclaimer: SHORT_DISCLAIMER,
  });
});
```

---

## Scoring Breakdown

### Example Calculation

**Input Scores:**
- Technical: 45
- Fundamental: 30
- Sentiment: 35

**Weighted Calculation:**
```
Combined = (45 × 0.50) + (30 × 0.30) + (35 × 0.20)
         = 22.5 + 9.0 + 7.0
         = 38.5
```

**Signal Type:**
```
38.5 is between 10 and 40
→ WATCH
```

**Confidence:**
```
|38.5| = 38.5
Rounded to 39%
```

---

## Tuning Guide

### For Day Traders (Focus on Technicals)
```javascript
const WEIGHTS = {
  technical: 0.60,
  fundamental: 0.25,
  sentiment: 0.15,
};
```

### For Value Investors (Focus on Fundamentals)
```javascript
const WEIGHTS = {
  technical: 0.30,
  fundamental: 0.50,
  sentiment: 0.20,
};
```

### For Aggressive Signals (Wider Thresholds)
```javascript
const SIGNAL_THRESHOLDS = {
  BUY: 30,          // More BUY signals
  SELL: -30,        // More SELL signals
  HOLD_MIN: -15,
  HOLD_MAX: 15,
};
```

### For Conservative Signals (Narrower Thresholds)
```javascript
const SIGNAL_THRESHOLDS = {
  BUY: 60,          // Only very strong BUY signals
  SELL: -60,        // Only very strong SELL signals
  HOLD_MIN: -5,
  HOLD_MAX: 5,
};
```

---

## Module Exports

```javascript
module.exports = {
  generateSignal,           // Main function
  calculateWeightedScore,   // Helper function
  determineSignalType,      // Helper function
  WEIGHTS,                  // Configuration
  SIGNAL_THRESHOLDS,        // Configuration
};
```

---

## Testing

### Unit Test Example
```javascript
const signalEngine = require('./signalEngineService');

// Mock data
const testData = {
  ticker: 'TEST',
  prices: [ /* OHLCV array */ ],
  fundamentals: { peRatio: 20, eps: 5.5, /* ... */ },
  newsHeadlines: ['Stock surges on earnings', 'Revenue beats expectations'],
};

// Generate signal
const signal = signalEngine.generateSignal(testData);

// Assertions
assert.equal(signal.ticker, 'TEST');
assert.include(['BUY', 'SELL', 'HOLD', 'WATCH'], signal.signalType);
assert.isAtLeast(signal.confidenceScore, 0);
assert.isAtMost(signal.confidenceScore, 100);
assert.isArray(signal.triggeredIndicators);
```

---

## Advantages of This Design

1. **Separation of Concerns**
   - Signal generation is pure logic
   - AI explanation is controller's job
   - Data fetching is separate

2. **Testability**
   - Easy to unit test (no mocks needed)
   - Deterministic outputs
   - Can test with fixed data

3. **Flexibility**
   - Weights easily tunable
   - Thresholds configurable
   - Can use different data sources

4. **Performance**
   - No external API calls
   - Fast execution
   - Controller can parallelize AI calls

5. **Maintainability**
   - Clear, documented code
   - Single responsibility
   - Easy to understand flow

---

## File Statistics

- **Lines:** ~200
- **Functions:** 3 main functions
- **Dependencies:** 3 rule engines (no external APIs)
- **Exports:** 5 items

---

**Status:** ✅ Task 13 Complete

**Matches All Requirements:**
- ✅ Takes data as parameters (not ticker)
- ✅ Calls all three rule engines
- ✅ Configurable named weights at top
- ✅ Correct signal mapping (>40 BUY, <-40 SELL, -10 to 10 HOLD, else WATCH)
- ✅ Returns correct shape with all fields
- ✅ Does NOT call Gemini
- ✅ Pure function design
