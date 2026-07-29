/**
 * Prompt Templates for Gemini AI
 * 
 * Builds carefully crafted prompts that ensure:
 * 1. AI NEVER decides buy/sell signals (only explains)
 * 2. Always uses conditional/suggestive language ("indicators suggest...")
 * 3. Never imperative advice ("you should buy")
 * 4. Always includes disclaimer reminders
 * 5. Stays grounded in provided data
 */

/**
 * Build prompt for explaining a trading signal
 * 
 * Used when rule-based engine generates a signal and we need Gemini
 * to explain it in plain English.
 * 
 * @param {Object} params
 * @param {string} params.ticker - Stock ticker symbol
 * @param {string} params.signalType - BUY, SELL, HOLD, or WATCH
 * @param {number} params.confidenceScore - 0-100 confidence
 * @param {Array} params.indicators - Triggered indicators [{name, value, threshold}]
 * @returns {string} Formatted prompt for Gemini
 */
function buildSignalExplanationPrompt({ ticker, signalType, confidenceScore, indicators }) {
  const indicatorsText = indicators
    .map(ind => `- ${ind.name}: ${ind.value} (threshold: ${ind.threshold})`)
    .join('\n');

  return `You are explaining a stock market signal for the educational app "StockSense".

**CRITICAL RULES:**
1. Use ONLY conditional/suggestive language: "the indicators suggest...", "this may indicate...", "data shows..."
2. NEVER use imperative commands: "you should buy", "sell now", "buy this stock"
3. Keep explanation to 2-3 sentences maximum
4. End with exactly this line: "⚠️ This is analysis based on technical indicators, not financial advice."

**SIGNAL DETAILS:**
Stock: ${ticker}
Signal: ${signalType}
Confidence: ${confidenceScore}%

**TRIGGERED INDICATORS:**
${indicatorsText}

Explain in plain English WHY these indicators produced a ${signalType} signal. Focus on what the data is showing, not what action to take.`;
}

/**
 * Build prompt for stock summary
 * 
 * Used to generate a plain-English summary of a company's current situation
 * based on fundamentals and recent news.
 * 
 * @param {Object} params
 * @param {string} params.ticker - Stock ticker symbol
 * @param {Object} params.fundamentals - Company fundamental data
 * @param {Array} params.recentNews - Array of news articles
 * @returns {string} Formatted prompt for Gemini
 */
function buildStockSummaryPrompt({ ticker, fundamentals, recentNews }) {
  const newsText = recentNews && recentNews.length > 0
    ? recentNews.slice(0, 3).map((n, i) => `${i + 1}. ${n.headline} (${n.source})`).join('\n')
    : 'No recent news available.';

  return `You are creating a brief stock summary for the educational app "StockSense".

**CRITICAL RULES:**
1. Keep summary to 3-4 sentences
2. Use factual, neutral language - no recommendations
3. Focus on current situation based on provided data only
4. If data shows concerning metrics, use phrases like "data shows..." or "indicators reflect..."
5. Never use "you should" or imperative language

**STOCK: ${ticker}**

**FUNDAMENTALS:**
- Company: ${fundamentals.companyName || 'N/A'}
- Sector: ${fundamentals.sector || 'N/A'}
- Market Cap: $${fundamentals.marketCap ? (fundamentals.marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}
- P/E Ratio: ${fundamentals.peRatio || 'N/A'}
- EPS: $${fundamentals.eps || 'N/A'}
- Dividend Yield: ${fundamentals.dividendYield ? fundamentals.dividendYield + '%' : 'N/A'}

**RECENT NEWS:**
${newsText}

Provide a concise summary of ${ticker}'s current situation based on this data.`;
}

/**
 * Build prompt for Q&A assistant
 * 
 * Used for the AI chat feature where users ask questions about a stock.
 * 
 * @param {Object} params
 * @param {string} params.ticker - Stock ticker symbol
 * @param {string} params.context - Stock data context (formatted string)
 * @param {string} params.question - User's question
 * @returns {string} Formatted prompt for Gemini
 */
function buildQnAPrompt({ ticker, context, question }) {
  return `You are a helpful stock market analysis assistant for "StockSense", an educational investment analysis app.

**CRITICAL RULES:**
1. Answer ONLY based on the context provided below - do NOT make up data
2. If information isn't in the context, say "I don't have that information in the current data"
3. Use conditional language: "the data suggests...", "indicators show...", "this may indicate..."
4. NEVER use imperative advice: "you should buy/sell"
5. If asked for direct investment advice, remind user: "I can analyze the data, but this is not financial advice. Consult a licensed financial advisor for personalized recommendations."
6. Keep answers concise (2-4 sentences)
7. Stay focused on the specific question asked

**STOCK CONTEXT FOR ${ticker}:**
${context}

**USER QUESTION:**
${question}

**YOUR ANSWER:**`;
}

/**
 * Build prompt for technical indicator explanation
 * 
 * Explains what a specific technical indicator means and why it matters.
 * 
 * @param {string} indicatorName - Name of indicator (e.g., "RSI", "MACD")
 * @param {number} currentValue - Current value of the indicator
 * @returns {string} Formatted prompt for Gemini
 */
function buildIndicatorExplanationPrompt(indicatorName, currentValue) {
  return `Explain the ${indicatorName} indicator in simple terms for beginner investors.

Current value: ${currentValue}

Requirements:
1. Define what ${indicatorName} measures (1 sentence)
2. Explain what the current value of ${currentValue} suggests (1-2 sentences)
3. Keep it under 100 words total
4. Use plain English, avoid jargon
5. Use conditional language: "this suggests...", "typically indicates..."

No investment advice or action recommendations.`;
}

/**
 * Build prompt for risk assessment explanation
 * 
 * Explains the risk level of a stock based on various factors.
 * 
 * @param {Object} params
 * @param {string} params.ticker - Stock ticker
 * @param {Object} params.riskFactors - Risk factors {volatility, beta, sector, etc.}
 * @returns {string} Formatted prompt for Gemini
 */
function buildRiskExplanationPrompt({ ticker, riskFactors }) {
  return `Explain the risk profile of ${ticker} in simple terms for beginner investors.

**RISK FACTORS:**
- Volatility: ${riskFactors.volatility || 'N/A'}
- Beta: ${riskFactors.beta || 'N/A'}
- Sector: ${riskFactors.sector || 'N/A'}
- Debt-to-Equity: ${riskFactors.debtToEquity || 'N/A'}

**RULES:**
1. Keep explanation to 2-3 sentences
2. Explain what these factors mean for risk level
3. Use phrases like "data suggests...", "this indicates..."
4. No recommendations - only explain the risk profile
5. End with: "Risk tolerance varies by investor - consult a financial advisor."`;
}

/**
 * Standard disclaimer text
 * Used across the app wherever financial analysis is shown
 */
const STANDARD_DISCLAIMER = `⚠️ DISCLAIMER: This analysis is for educational and informational purposes only. It is NOT financial advice. StockSense uses algorithms and public data to generate signals and analysis. Always conduct your own research and consult with a licensed financial advisor before making investment decisions. Past performance does not guarantee future results.`;

/**
 * Short disclaimer for UI elements
 */
const SHORT_DISCLAIMER = `⚠️ Not financial advice. For educational purposes only.`;

module.exports = {
  buildSignalExplanationPrompt,
  buildStockSummaryPrompt,
  buildQnAPrompt,
  buildIndicatorExplanationPrompt,
  buildRiskExplanationPrompt,
  STANDARD_DISCLAIMER,
  SHORT_DISCLAIMER,
};
