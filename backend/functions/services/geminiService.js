/**
 * Gemini AI Service - Explanation generator (NOT signal generator)
 * 
 * CRITICAL: This service ONLY explains signals and data.
 * It NEVER decides buy/sell signals - that's done by rule-based logic.
 * 
 * Uses official Google Generative AI SDK (@google/generative-ai)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AppError } = require('../middleware/errorHandler');

// Initialize Gemini API
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not configured. AI explanations will fail.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Use Gemini 1.5 Flash for fast, cost-effective responses
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.7, // Slightly creative but mostly factual
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 500, // Keep responses concise (2-3 paragraphs max)
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_NONE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_NONE',
    },
  ],
});

/**
 * Generate plain-English explanation from a prompt
 * 
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<string>} Plain text response
 * @throws {AppError} If Gemini API fails
 */
const generateExplanation = async (prompt) => {
  if (!API_KEY) {
    throw new AppError('AI service not configured', 503);
  }

  if (!prompt || prompt.trim().length === 0) {
    throw new AppError('Prompt cannot be empty', 400);
  }

  try {
    console.log('🤖 Generating AI explanation...');
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      throw new AppError('AI returned empty response', 500);
    }

    console.log(`✅ AI explanation generated (${text.length} chars)`);
    return text.trim();

  } catch (error) {
    console.error('Gemini API error:', error.message);

    // Handle specific Gemini errors
    if (error.message?.includes('API key')) {
      throw new AppError('Invalid AI API key', 500);
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new AppError(
        'AI service temporarily unavailable due to high demand. Please try again in a moment.',
        429
      );
    }

    if (error.message?.includes('blocked')) {
      throw new AppError(
        'AI response was blocked due to safety filters. Please try rephrasing your question.',
        400
      );
    }

    // Generic error
    throw new AppError(
      `AI service error: ${error.message || 'Unknown error'}`,
      500
    );
  }
};

/**
 * Generate stock-specific Q&A response
 * 
 * Takes stock context (price, fundamentals, news) and a user question,
 * returns an answer grounded in the provided data.
 * 
 * @param {Object} context - Stock data context
 * @param {string} context.ticker - Stock ticker symbol
 * @param {Object} context.quote - Current quote data
 * @param {Object} context.fundamentals - Company fundamentals
 * @param {Array} context.news - Recent news articles
 * @param {string} question - User's question
 * @returns {Promise<string>} AI-generated answer
 * @throws {AppError} If Gemini API fails
 */
const generateStockQnA = async (context, question) => {
  if (!API_KEY) {
    throw new AppError('AI service not configured', 503);
  }

  if (!question || question.trim().length === 0) {
    throw new AppError('Question cannot be empty', 400);
  }

  if (!context || !context.ticker) {
    throw new AppError('Stock context is required', 400);
  }

  try {
    console.log(`🤖 Generating Q&A for ${context.ticker}...`);

    // Build context string from provided data
    const contextString = buildContextString(context);

    // Build the full prompt
    const prompt = `You are a helpful stock market analysis assistant for StockSense, an educational app.

**CRITICAL RULES:**
1. ONLY answer based on the context provided below - do NOT make up numbers or facts
2. If the context doesn't contain the information needed, say "I don't have that information in the current data"
3. NEVER use imperative language like "you should buy" or "sell this stock"
4. ALWAYS use conditional/suggestive language: "the data suggests...", "indicators show...", "this might indicate..."
5. If asked for direct investment advice, remind the user this is educational analysis, not financial advice
6. Keep answers concise (2-4 sentences)
7. Do NOT generate buy/sell signals - only explain existing data

**STOCK CONTEXT FOR ${context.ticker}:**
${contextString}

**USER QUESTION:**
${question}

**YOUR ANSWER:**`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      throw new AppError('AI returned empty response', 500);
    }

    console.log(`✅ Q&A generated for ${context.ticker} (${text.length} chars)`);
    return text.trim();

  } catch (error) {
    console.error('Gemini Q&A error:', error.message);

    // Handle specific errors
    if (error.isOperational) {
      throw error; // Re-throw AppErrors
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new AppError(
        'AI service temporarily unavailable. Please try again shortly.',
        429
      );
    }

    throw new AppError(
      `AI service error: ${error.message || 'Unknown error'}`,
      500
    );
  }
};

/**
 * Build context string from stock data
 * Helper function to format context for Q&A prompts
 */
function buildContextString(context) {
  const parts = [];

  // Current price info
  if (context.quote) {
    parts.push(`Current Price: $${context.quote.currentPrice}`);
    parts.push(`Change: ${context.quote.change >= 0 ? '+' : ''}${context.quote.change} (${context.quote.changePercent}%)`);
    parts.push(`Volume: ${context.quote.volume?.toLocaleString() || 'N/A'}`);
  }

  // Fundamentals
  if (context.fundamentals) {
    const f = context.fundamentals;
    if (f.companyName) parts.push(`Company: ${f.companyName}`);
    if (f.sector) parts.push(`Sector: ${f.sector}`);
    if (f.marketCap) parts.push(`Market Cap: $${(f.marketCap / 1e9).toFixed(2)}B`);
    if (f.peRatio) parts.push(`P/E Ratio: ${f.peRatio}`);
    if (f.eps) parts.push(`EPS: $${f.eps}`);
    if (f.dividendYield) parts.push(`Dividend Yield: ${f.dividendYield}%`);
  }

  // Recent news headlines
  if (context.news && Array.isArray(context.news) && context.news.length > 0) {
    parts.push('\nRecent News:');
    context.news.slice(0, 3).forEach((article, i) => {
      parts.push(`${i + 1}. ${article.headline} (${article.source})`);
    });
  }

  return parts.join('\n');
}

/**
 * Check if Gemini API is configured and available
 * 
 * @returns {Promise<boolean>} True if API is working
 */
const checkHealth = async () => {
  if (!API_KEY) {
    return false;
  }

  try {
    await model.generateContent('Hello');
    return true;
  } catch (error) {
    console.error('Gemini health check failed:', error.message);
    return false;
  }
};

module.exports = {
  generateExplanation,
  generateStockQnA,
  checkHealth,
};
