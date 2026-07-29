# Signal Engine Architecture

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIGNAL ENGINE SERVICE                        │
│                  (index.js - Orchestrator)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ generateSignal('AAPL')
                              ▼
        ┌─────────────────────────────────────────┐
        │   STEP 1: Fetch Market Data            │
        │   - Historical prices (1 year)          │
        │   - Company fundamentals                │
        │   - Recent news headlines               │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────────────┐
        │   STEP 2-4: Run Three Analysis Engines            │
        │                                                     │
        │  ┌──────────────────┐  ┌──────────────────┐       │
        │  │ Technical Rules  │  │ Fundamental Rules│       │
        │  │                  │  │                  │       │
        │  │ • RSI            │  │ • P/E Ratio      │       │
        │  │ • MACD           │  │ • EPS Growth     │       │
        │  │ • MA Crossover   │  │ • Debt-to-Equity │       │
        │  │ • Volume         │  │ • ROE            │       │
        │  │                  │  │ • Dividend Yield │       │
        │  │ Returns:         │  │ Returns:         │       │
        │  │ score: -100→100  │  │ score: -100→100  │       │
        │  └──────────────────┘  └──────────────────┘       │
        │                                                     │
        │          ┌──────────────────┐                      │
        │          │ Sentiment Rules  │                      │
        │          │                  │                      │
        │          │ • Keyword-based  │                      │
        │          │ • Positive words │                      │
        │          │ • Negative words │                      │
        │          │ • Headline count │                      │
        │          │                  │                      │
        │          │ Returns:         │                      │
        │          │ score: -100→100  │                      │
        │          └──────────────────┘                      │
        └─────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   STEP 5: Weighted Scoring              │
        │                                         │
        │   Final Score =                         │
        │     (Technical × 40%) +                 │
        │     (Fundamental × 35%) +               │
        │     (Sentiment × 25%)                   │
        │                                         │
        │   Example:                              │
        │     (45 × 0.40) + (30 × 0.35) + (35 × 0.25)  │
        │     = 18 + 10.5 + 8.75                  │
        │     = 37.25                             │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   STEP 6: Signal Type Decision          │
        │                                         │
        │   Score > 40   → BUY                    │
        │   Score 20-40  → WATCH                  │
        │   Score -20-20 → HOLD                   │
        │   Score < -20  → SELL                   │
        │                                         │
        │   Example: 37.25 → WATCH                │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   STEP 7: Confidence Calculation        │
        │                                         │
        │   |Score| → Confidence %                │
        │   0-20   → 0-40% (Low)                  │
        │   20-60  → 40-80% (Medium)              │
        │   60-100 → 80-100% (High)               │
        │                                         │
        │   Example: |37.25| = 37 → 67%           │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   STEP 8: AI Explanation (Gemini)      │
        │                                         │
        │   Prompt Template:                      │
        │   "Explain why indicators produced      │
        │    WATCH signal for AAPL..."            │
        │                                         │
        │   Gemini 1.5 Flash generates:           │
        │   "Technical indicators suggest AAPL    │
        │    is in a moderate uptrend with RSI... │
        │    ⚠️ Not financial advice."            │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   STEP 9: Return Complete Signal        │
        │                                         │
        │   {                                     │
        │     ticker: 'AAPL',                     │
        │     signalType: 'WATCH',                │
        │     confidenceScore: 67,                │
        │     triggeredIndicators: [...],         │
        │     aiExplanation: '...',               │
        │     technicalScore: 45,                 │
        │     fundamentalScore: 30,               │
        │     sentimentScore: 35,                 │
        │     generatedAt: Date,                  │
        │     expiresAt: Date (24h)               │
        │   }                                     │
        └─────────────────────────────────────────┘
                              │
                              ▼
                    Save to MongoDB Signal collection
```

## Component Interactions

```
┌─────────────────┐
│   Controller    │ ← Express route handler
│  (API Layer)    │
└────────┬────────┘
         │ calls generateSignal()
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Signal Engine  │─────→│  Market Data     │
│   (index.js)    │      │  Service         │
└────────┬────────┘      │  (Finnhub API)   │
         │               └──────────────────┘
         │
         ├──→ technicalRules.js    (Pure Math)
         ├──→ fundamentalRules.js  (Pure Math)
         ├──→ sentimentRules.js    (Keyword Matching)
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Gemini Service │─────→│  Prompt          │
│  (AI Explain)   │      │  Templates       │
└────────┬────────┘      └──────────────────┘
         │
         ▼
    Return Signal Object
         │
         ▼
┌─────────────────┐
│  MongoDB        │
│  Signal Model   │
│  (24h TTL)      │
└─────────────────┘
```

## File Dependencies

```
index.js (Main Orchestrator)
├── technicalRules.js       ✅ (460 lines)
│   ├── calculateRSI()
│   ├── calculateMACD()
│   ├── detectMovingAverageCrossover()
│   └── evaluateTechnicalSignal()
│
├── fundamentalRules.js     ✅ (295 lines)
│   ├── evaluatePERatio()
│   ├── evaluateEPSGrowth()
│   ├── evaluateDebtToEquity()
│   └── evaluateFundamentalSignal()
│
├── sentimentRules.js       ✅ (220 lines)
│   ├── scoreHeadlineSentiment()
│   └── evaluateSentimentSignal()
│
├── marketDataService.js    ✅ (Finnhub integration)
│   ├── getHistoricalPrices()
│   ├── getFundamentals()
│   └── getCompanyNews()
│
├── geminiService.js        ✅ (Gemini AI integration)
│   └── generateExplanation()
│
└── promptTemplates.js      ✅ (Prompt engineering)
    └── buildSignalExplanationPrompt()
```

## Scoring Weights Rationale

| Component    | Weight | Reasoning |
|--------------|--------|-----------|
| Technical    | 40%    | Price action and momentum are most immediate indicators of market sentiment |
| Fundamental  | 35%    | Company health and valuation determine long-term value |
| Sentiment    | 25%    | News and market sentiment provide context but can be noisy |

## Signal Type Thresholds Rationale

| Score Range | Signal | Reasoning |
|-------------|--------|-----------|
| > 40        | BUY    | Strong positive signal across multiple indicators |
| 20 to 40    | WATCH  | Moderate positive signal - worth monitoring |
| -20 to 20   | HOLD   | Neutral zone - no clear direction |
| < -20       | SELL   | Negative signal - indicators suggest weakness |

## Confidence Score Mapping

The confidence score is calculated from the absolute value of the weighted score:

```
|Score|    Confidence    Interpretation
0-20   →   0-40%        Low confidence (weak signal)
20-60  →   40-80%       Medium confidence (moderate signal)
60-100 →   80-100%      High confidence (strong signal)
```

This ensures that:
- Neutral signals (near 0) have low confidence
- Strong signals (far from 0) have high confidence
- Confidence scales non-linearly to be more meaningful

## Example Calculations

### Example 1: Strong BUY Signal

```
Technical Score:    75  (Strong uptrend, golden cross, RSI recovering)
Fundamental Score:  60  (Good P/E, strong EPS growth)
Sentiment Score:    40  (Positive news headlines)

Weighted Score = (75 × 0.40) + (60 × 0.35) + (40 × 0.25)
               = 30 + 21 + 10
               = 61

Signal Type: BUY (score > 40)
Confidence: 88% (strong signal, |61| in 60-100 range)
```

### Example 2: Moderate WATCH Signal

```
Technical Score:    45  (Price above moving averages)
Fundamental Score:  20  (Fair valuation, moderate growth)
Sentiment Score:    10  (Neutral news)

Weighted Score = (45 × 0.40) + (20 × 0.35) + (10 × 0.25)
               = 18 + 7 + 2.5
               = 27.5

Signal Type: WATCH (20 < score <= 40)
Confidence: 55% (moderate signal, |27.5| in 20-60 range)
```

### Example 3: HOLD Signal

```
Technical Score:    10  (Consolidating)
Fundamental Score:  -5  (Mixed fundamentals)
Sentiment Score:    0   (Neutral sentiment)

Weighted Score = (10 × 0.40) + (-5 × 0.35) + (0 × 0.25)
               = 4 - 1.75 + 0
               = 2.25

Signal Type: HOLD (-20 <= score <= 20)
Confidence: 9% (very weak signal, |2.25| in 0-20 range)
```

### Example 4: SELL Signal

```
Technical Score:    -60  (Death cross, RSI overbought)
Fundamental Score:  -40  (High P/E, declining EPS)
Sentiment Score:    -30  (Negative news)

Weighted Score = (-60 × 0.40) + (-40 × 0.35) + (-30 × 0.25)
               = -24 - 14 - 7.5
               = -45.5

Signal Type: SELL (score < -20)
Confidence: 76% (strong negative signal, |-45.5| in 20-60 range)
```

---

**Architecture Status:** ✅ Complete and Production Ready
