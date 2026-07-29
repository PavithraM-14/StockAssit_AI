/**
 * Signal Performance Service
 * Tracks how signals perform over time for backtesting
 */

const SignalHistory = require('../models/SignalHistory');
const marketDataService = require('./marketDataService');

/**
 * Update signal performance metrics
 * Called by cron job 7 days and 30 days after signal generation
 */
exports.updateSignalPerformance = async () => {
  try {
    const now = new Date();
    
    // Find signals that need 7-day update
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const signalsFor7Days = await SignalHistory.find({
      generatedAt: {
        $gte: new Date(sevenDaysAgo - 60 * 60 * 1000), // 1 hour window
        $lte: new Date(sevenDaysAgo + 60 * 60 * 1000)
      },
      priceAfter7Days: null
    });

    // Find signals that need 30-day update
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const signalsFor30Days = await SignalHistory.find({
      generatedAt: {
        $gte: new Date(thirtyDaysAgo - 60 * 60 * 1000),
        $lte: new Date(thirtyDaysAgo + 60 * 60 * 1000)
      },
      priceAfter30Days: null
    });

    console.log(`Updating ${signalsFor7Days.length} 7-day signals and ${signalsFor30Days.length} 30-day signals`);

    // Update 7-day prices
    for (const signal of signalsFor7Days) {
      try {
        const stockData = await marketDataService.getStockDetails(signal.ticker);
        signal.priceAfter7Days = stockData.price || stockData.currentPrice;
        await signal.save();
      } catch (error) {
        console.error(`Error updating 7-day price for ${signal.ticker}:`, error);
      }
    }

    // Update 30-day prices
    for (const signal of signalsFor30Days) {
      try {
        const stockData = await marketDataService.getStockDetails(signal.ticker);
        signal.priceAfter30Days = stockData.price || stockData.currentPrice;
        await signal.save();
      } catch (error) {
        console.error(`Error updating 30-day price for ${signal.ticker}:`, error);
      }
    }

    return {
      updated7Days: signalsFor7Days.length,
      updated30Days: signalsFor30Days.length
    };
  } catch (error) {
    console.error('Error updating signal performance:', error);
    throw error;
  }
};

/**
 * Get signal performance statistics
 */
exports.getSignalStats = async (ticker = null, signalType = null, days = 30) => {
  try {
    const query = {};
    
    if (ticker) query.ticker = ticker;
    if (signalType) query.signalType = signalType;
    
    // Only include signals with performance data
    query.priceAfter7Days = { $ne: null };
    
    const signals = await SignalHistory.find(query)
      .sort({ generatedAt: -1 })
      .limit(days > 30 ? 100 : 50);

    const stats = {
      total: signals.length,
      byType: {},
      performance7Days: {
        avgChange: 0,
        profitable: 0,
        unprofitable: 0
      },
      performance30Days: {
        avgChange: 0,
        profitable: 0,
        unprofitable: 0
      }
    };

    // Calculate performance metrics
    let totalChange7Days = 0;
    let totalChange30Days = 0;
    let count7Days = 0;
    let count30Days = 0;

    for (const signal of signals) {
      // Count by type
      stats.byType[signal.signalType] = (stats.byType[signal.signalType] || 0) + 1;

      // 7-day performance
      if (signal.priceAfter7Days) {
        const change7 = ((signal.priceAfter7Days - signal.priceAtSignal) / signal.priceAtSignal) * 100;
        totalChange7Days += change7;
        count7Days++;

        if (
          (signal.signalType === 'BUY' && change7 > 0) ||
          (signal.signalType === 'SELL' && change7 < 0)
        ) {
          stats.performance7Days.profitable++;
        } else {
          stats.performance7Days.unprofitable++;
        }
      }

      // 30-day performance
      if (signal.priceAfter30Days) {
        const change30 = ((signal.priceAfter30Days - signal.priceAtSignal) / signal.priceAtSignal) * 100;
        totalChange30Days += change30;
        count30Days++;

        if (
          (signal.signalType === 'BUY' && change30 > 0) ||
          (signal.signalType === 'SELL' && change30 < 0)
        ) {
          stats.performance30Days.profitable++;
        } else {
          stats.performance30Days.unprofitable++;
        }
      }
    }

    stats.performance7Days.avgChange = count7Days > 0 ? totalChange7Days / count7Days : 0;
    stats.performance30Days.avgChange = count30Days > 0 ? totalChange30Days / count30Days : 0;

    // Calculate accuracy
    stats.performance7Days.accuracy = count7Days > 0 
      ? (stats.performance7Days.profitable / count7Days) * 100 
      : 0;
    stats.performance30Days.accuracy = count30Days > 0 
      ? (stats.performance30Days.profitable / count30Days) * 100 
      : 0;

    return stats;
  } catch (error) {
    console.error('Error getting signal stats:', error);
    throw error;
  }
};

/**
 * Get signal accuracy by confidence level
 */
exports.getAccuracyByConfidence = async () => {
  try {
    const signals = await SignalHistory.find({
      priceAfter7Days: { $ne: null }
    });

    const buckets = {
      '80-100': { total: 0, correct: 0 },
      '60-79': { total: 0, correct: 0 },
      '40-59': { total: 0, correct: 0 },
      '0-39': { total: 0, correct: 0 }
    };

    // Note: This assumes confidence is stored somewhere in the signal
    // If not, you'll need to adjust the schema

    return buckets;
  } catch (error) {
    console.error('Error getting accuracy by confidence:', error);
    throw error;
  }
};
