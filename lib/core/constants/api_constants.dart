/// API Constants for StockSense Frontend Application
class ApiConstants {
  // Base URL for Local Firebase Emulator (Development)
  // Using PC's local network IP: 192.168.1.8
  static const String baseUrl = 'http://192.168.1.8:5001/stockanalytics-40b2a/us-central1/api';
  
  // For Android Emulator use: 'http://10.0.2.2:5001/stockanalytics-40b2a/us-central1/api'
  // For iOS Simulator / Web use: 'http://localhost:5001/stockanalytics-40b2a/us-central1/api'
  // For Production (after deployment): 'https://us-central1-stockanalytics-40b2a.cloudfunctions.net/api'

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
