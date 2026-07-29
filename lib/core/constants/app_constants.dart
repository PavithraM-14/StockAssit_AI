/// Application-wide Constants
class AppConstants {
  // App Metadata
  static const String appName = 'StockSense';
  static const String appTagline = 'AI-Powered Stock Market Analysis & Signal Tracking';
  static const String appVersion = '1.0.0';

  // Single Source of Truth for Financial Disclaimer across the App
  static const String disclaimer =
      'DISCLAIMER: All market signals, technical data, and AI-generated analysis provided by StockSense '
      'are for educational and informational purposes only and do NOT constitute financial, investment, '
      'or trading advice. Trading stocks involves substantial risk of financial loss. Always perform your '
      'own due diligence and consult with a certified financial advisor before making any investment decisions.';

  // Default Cache Durations
  static const Duration signalCacheDuration = Duration(hours: 24);
  static const Duration stockDataCacheDuration = Duration(minutes: 15);
  static const Duration aiSummaryCacheDuration = Duration(minutes: 60);

  // Signal Types
  static const String signalBuy = 'BUY';
  static const String signalSell = 'SELL';
  static const String signalHold = 'HOLD';
  static const String signalWatch = 'WATCH';

  // Time Period Filters
  static const List<String> timePeriods = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'];

  // Pagination Defaults
  static const int defaultPageSize = 20;
}
