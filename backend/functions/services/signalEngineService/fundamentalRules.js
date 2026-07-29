/**
 * Fundamental Rules - Pure functions for fundamental analysis
 * 
 * Evaluates company financials, valuation metrics, and growth indicators.
 * NO API calls - just calculations on provided data.
 * 
 * Standard Fundamental Thresholds:
 * - P/E Ratio < sector avg: Potentially undervalued (bullish)
 * - P/E Ratio > sector avg * 1.5: Potentially overvalued (bearish)
 * - EPS Growth > 15%: Strong growth (bullish)
 * - EPS Growth < 0%: Declining earnings (bearish)
 * - Debt-to-Equity < 0.5: Strong balance sheet (bullish)
 * - Debt-to-Equity > 2.0: High debt risk (bearish)
 * - ROE > 15%: Efficient capital use (bullish)
 * - Dividend Yield > 3%: Income potential (slightly bullish)
 */

/**
 * Evaluate P/E Ratio
 * 
 * Compares company's P/E to sector average to determine if undervalued/overvalued.
 * 
 * @param {number} peRatio - Company's P/E ratio
 * @param {number} sectorAveragePE - Industry average P/E (default: 20 if not provided)
 * @returns {Object} { score, reason }
 */
function evaluatePERatio(peRatio, sectorAveragePE = 20) {
  if (!peRatio || peRatio <= 0) {
    return {
      score: 0,
      reason: 'No P/E ratio available',
    };
  }

  const ratio = peRatio / sectorAveragePE;

  if (ratio < 0.7) {
    // Significantly undervalued
    return {
      score: 25,
      reason: `P/E (${peRatio.toFixed(1)}) well below sector average (${sectorAveragePE.toFixed(1)}) - potentially undervalued`,
    };
  } else if (ratio < 1.0) {
    // Slightly undervalued
    return {
      score: 15,
      reason: `P/E (${peRatio.toFixed(1)}) below sector average (${sectorAveragePE.toFixed(1)}) - moderately valued`,
    };
  } else if (ratio <= 1.3) {
    // Fair value
    return {
      score: 5,
      reason: `P/E (${peRatio.toFixed(1)}) near sector average (${sectorAveragePE.toFixed(1)}) - fairly valued`,
    };
  } else if (ratio <= 2.0) {
    // Slightly overvalued
    return {
      score: -15,
      reason: `P/E (${peRatio.toFixed(1)}) above sector average (${sectorAveragePE.toFixed(1)}) - potentially overvalued`,
    };
  } else {
    // Significantly overvalued
    return {
      score: -25,
      reason: `P/E (${peRatio.toFixed(1)}) significantly above sector average (${sectorAveragePE.toFixed(1)}) - highly valued`,
    };
  }
}

/**
 * Evaluate EPS Growth
 * 
 * Analyzes earnings per share trend to determine growth momentum.
 * 
 * @param {Array<number>} epsHistory - Array of EPS values (oldest to newest), e.g., [2.5, 2.8, 3.2, 3.6]
 * @returns {Object} { score, reason, growthRate }
 */
function evaluateEPSGrowth(epsHistory) {
  if (!epsHistory || epsHistory.length < 2) {
    return {
      score: 0,
      reason: 'Insufficient EPS data',
      growthRate: null,
    };
  }

  // Calculate year-over-year growth rate
  const oldestEPS = epsHistory[0];
  const latestEPS = epsHistory[epsHistory.length - 1];

  if (oldestEPS <= 0) {
    return {
      score: 0,
      reason: 'Cannot calculate growth from negative/zero EPS',
      growthRate: null,
    };
  }

  const growthRate = ((latestEPS - oldestEPS) / Math.abs(oldestEPS)) * 100;

  if (growthRate > 25) {
    // Exceptional growth
    return {
      score: 30,
      reason: `Exceptional EPS growth of ${growthRate.toFixed(1)}%`,
      growthRate,
    };
  } else if (growthRate > 15) {
    // Strong growth
    return {
      score: 20,
      reason: `Strong EPS growth of ${growthRate.toFixed(1)}%`,
      growthRate,
    };
  } else if (growthRate > 5) {
    // Moderate growth
    return {
      score: 10,
      reason: `Moderate EPS growth of ${growthRate.toFixed(1)}%`,
      growthRate,
    };
  } else if (growthRate >= 0) {
    // Slow growth
    return {
      score: 0,
      reason: `Slow EPS growth of ${growthRate.toFixed(1)}%`,
      growthRate,
    };
  } else if (growthRate > -10) {
    // Slight decline
    return {
      score: -15,
      reason: `EPS declining by ${Math.abs(growthRate).toFixed(1)}%`,
      growthRate,
    };
  } else {
    // Significant decline
    return {
      score: -25,
      reason: `Significant EPS decline of ${Math.abs(growthRate).toFixed(1)}%`,
      growthRate,
    };
  }
}

/**
 * Evaluate Debt-to-Equity Ratio
 * 
 * Lower is better - indicates financial stability.
 * 
 * @param {number} debtToEquity - Debt-to-Equity ratio
 * @returns {Object} { score, reason }
 */
function evaluateDebtToEquity(debtToEquity) {
  if (debtToEquity === null || debtToEquity === undefined) {
    return {
      score: 0,
      reason: 'No debt-to-equity data available',
    };
  }

  if (debtToEquity < 0.3) {
    return {
      score: 15,
      reason: `Very low debt-to-equity (${debtToEquity.toFixed(2)}) - strong balance sheet`,
    };
  } else if (debtToEquity < 0.7) {
    return {
      score: 10,
      reason: `Low debt-to-equity (${debtToEquity.toFixed(2)}) - healthy balance sheet`,
    };
  } else if (debtToEquity < 1.5) {
    return {
      score: 0,
      reason: `Moderate debt-to-equity (${debtToEquity.toFixed(2)}) - acceptable leverage`,
    };
  } else if (debtToEquity < 2.5) {
    return {
      score: -10,
      reason: `High debt-to-equity (${debtToEquity.toFixed(2)}) - elevated financial risk`,
    };
  } else {
    return {
      score: -20,
      reason: `Very high debt-to-equity (${debtToEquity.toFixed(2)}) - significant financial risk`,
    };
  }
}

/**
 * Evaluate Return on Equity (ROE)
 * 
 * Measures profitability - how efficiently company uses shareholder equity.
 * 
 * @param {number} roe - Return on Equity percentage
 * @returns {Object} { score, reason }
 */
function evaluateROE(roe) {
  if (roe === null || roe === undefined) {
    return {
      score: 0,
      reason: 'No ROE data available',
    };
  }

  if (roe > 20) {
    return {
      score: 15,
      reason: `Excellent ROE of ${roe.toFixed(1)}% - highly efficient`,
    };
  } else if (roe > 15) {
    return {
      score: 10,
      reason: `Strong ROE of ${roe.toFixed(1)}% - efficient operations`,
    };
  } else if (roe > 10) {
    return {
      score: 5,
      reason: `Moderate ROE of ${roe.toFixed(1)}% - acceptable efficiency`,
    };
  } else if (roe > 5) {
    return {
      score: -5,
      reason: `Low ROE of ${roe.toFixed(1)}% - below-average efficiency`,
    };
  } else {
    return {
      score: -15,
      reason: `Very low ROE of ${roe.toFixed(1)}% - poor capital efficiency`,
    };
  }
}

/**
 * Evaluate Dividend Yield
 * 
 * Higher dividend can be attractive for income investors.
 * 
 * @param {number} dividendYield - Dividend yield percentage
 * @returns {Object} { score, reason }
 */
function evaluateDividendYield(dividendYield) {
  if (!dividendYield || dividendYield <= 0) {
    return {
      score: 0,
      reason: 'No dividend paid',
    };
  }

  if (dividendYield > 5) {
    // Very high yield - could be a red flag (unsustainable)
    return {
      score: 5,
      reason: `High dividend yield (${dividendYield.toFixed(2)}%) - verify sustainability`,
    };
  } else if (dividendYield > 3) {
    return {
      score: 10,
      reason: `Good dividend yield (${dividendYield.toFixed(2)}%) - attractive income`,
    };
  } else if (dividendYield > 1) {
    return {
      score: 5,
      reason: `Moderate dividend yield (${dividendYield.toFixed(2)}%)`,
    };
  } else {
    return {
      score: 0,
      reason: `Low dividend yield (${dividendYield.toFixed(2)}%)`,
    };
  }
}

/**
 * Evaluate overall fundamental signal
 * 
 * Combines multiple fundamental indicators into a single score.
 * 
 * @param {Object} fundamentals - Company fundamental data
 * @param {number} fundamentals.peRatio - P/E ratio
 * @param {number} fundamentals.sectorAveragePE - Sector average P/E (optional)
 * @param {Array<number>} fundamentals.epsHistory - EPS history array
 * @param {number} fundamentals.eps - Current EPS
 * @param {number} fundamentals.debtToEquity - Debt-to-Equity ratio
 * @param {number} fundamentals.roe - Return on Equity
 * @param {number} fundamentals.dividendYield - Dividend yield percentage
 * @param {number} fundamentals.marketCap - Market capitalization
 * @returns {Object} { score: number, triggeredIndicators: Array }
 */
function evaluateFundamentalSignal(fundamentals) {
  if (!fundamentals) {
    return {
      score: 0,
      triggeredIndicators: [],
      error: 'No fundamental data provided',
    };
  }

  let score = 0;
  const triggeredIndicators = [];

  // 1. P/E Ratio Analysis (Weight: 25 points)
  const peEval = evaluatePERatio(fundamentals.peRatio, fundamentals.sectorAveragePE);
  score += peEval.score;
  if (fundamentals.peRatio) {
    triggeredIndicators.push({
      name: 'P/E Ratio',
      value: fundamentals.peRatio.toFixed(2),
      threshold: `Sector avg: ${fundamentals.sectorAveragePE?.toFixed(1) || '20.0'}`,
    });
  }

  // 2. EPS Growth Analysis (Weight: 30 points)
  const epsEval = evaluateEPSGrowth(fundamentals.epsHistory);
  score += epsEval.score;
  if (epsEval.growthRate !== null) {
    triggeredIndicators.push({
      name: 'EPS Growth',
      value: `${epsEval.growthRate.toFixed(1)}%`,
      threshold: 'Strong > 15%, Moderate > 5%, Declining < 0%',
    });
  }

  // 3. Debt-to-Equity Analysis (Weight: 20 points)
  const debtEval = evaluateDebtToEquity(fundamentals.debtToEquity);
  score += debtEval.score;
  if (fundamentals.debtToEquity !== null && fundamentals.debtToEquity !== undefined) {
    triggeredIndicators.push({
      name: 'Debt-to-Equity',
      value: fundamentals.debtToEquity.toFixed(2),
      threshold: 'Low < 0.7, Moderate < 1.5, High > 2.0',
    });
  }

  // 4. ROE Analysis (Weight: 15 points)
  const roeEval = evaluateROE(fundamentals.roe);
  score += roeEval.score;
  if (fundamentals.roe !== null && fundamentals.roe !== undefined) {
    triggeredIndicators.push({
      name: 'Return on Equity',
      value: `${fundamentals.roe.toFixed(1)}%`,
      threshold: 'Excellent > 20%, Strong > 15%, Moderate > 10%',
    });
  }

  // 5. Dividend Yield Analysis (Weight: 10 points)
  const divEval = evaluateDividendYield(fundamentals.dividendYield);
  score += divEval.score;
  if (fundamentals.dividendYield) {
    triggeredIndicators.push({
      name: 'Dividend Yield',
      value: `${fundamentals.dividendYield.toFixed(2)}%`,
      threshold: 'Good > 3%, Moderate > 1%',
    });
  }

  // Clamp score to -100 to 100 range
  score = Math.max(-100, Math.min(100, score));

  return {
    score: Math.round(score),
    triggeredIndicators,
  };
}

module.exports = {
  evaluatePERatio,
  evaluateEPSGrowth,
  evaluateDebtToEquity,
  evaluateROE,
  evaluateDividendYield,
  evaluateFundamentalSignal,
};
