/// API Constants for StockSense Frontend Application
class ApiConstants {
  // Base URL for Deployed Firebase Cloud Functions (Production environment)
  // Replace 'stock-sense-app' with your actual Firebase project ID once deployed
  static const String baseUrl = 'https://us-central1-stock-sense-app.cloudfunctions.net/api';

  // Alternative Local Firebase Emulator Base URLs (Uncomment when running locally):
  // For Android Emulator: 'http://10.0.2.2:5001/stock-sense-app/us-central1/api'
  // For iOS Simulator / Web: 'http://localhost:5001/stock-sense-app/us-central1/api'

  // Endpoint Paths
  static const String stocks = '/stocks';
  static const String signals = '/signals';
  static const String holdings = '/holdings';
  static const String watchlist = '/watchlist';
  static const String alerts = '/alerts';
  static const String ai = '/ai';
  static const String users = '/users';

  // Timeout Durations
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
