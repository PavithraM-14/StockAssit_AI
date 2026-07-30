import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../domain/signal_model.dart';

/// Exception thrown when signal operations fail
class SignalException implements Exception {
  final String message;
  final int? statusCode;

  SignalException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

/// Signal Repository
/// Handles network API calls for stock market signals
class SignalRepository {
  final ApiClient _apiClient;

  SignalRepository({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  /// Get or generate a signal for a specific stock ticker
  /// GET /signals/:ticker
  Future<SignalModel> getSignal(String ticker) async {
    try {
      final response = await _apiClient.get('${ApiConstants.signals}/${ticker.toUpperCase()}');
      final data = (response is Map<String, dynamic> && response.containsKey('data'))
          ? response['data']
          : response;

      return SignalModel.fromJson(data as Map<String, dynamic>);
    } on ApiException catch (e) {
      throw SignalException('Failed to fetch signal for $ticker: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw SignalException('Unexpected error fetching signal for $ticker: $e');
    }
  }

  /// Alias for getSignal (for consistency with watchlist screen)
  Future<SignalModel> getSignalForTicker(String ticker) => getSignal(ticker);

  /// Get signal history for a specific stock ticker
  /// GET /signals/:ticker/history
  Future<List<SignalModel>> getSignalHistory(String ticker, {int limit = 30}) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.signals}/${ticker.toUpperCase()}/history',
        params: {'limit': limit.toString()},
      );

      final List historyList;
      if (response is Map<String, dynamic> && response['data'] != null) {
        if (response['data'] is Map && response['data']['history'] != null) {
          historyList = response['data']['history'] as List;
        } else if (response['data'] is List) {
          historyList = response['data'] as List;
        } else {
          historyList = [];
        }
      } else {
        historyList = [];
      }

      return historyList.map((item) => SignalModel.fromJson(item as Map<String, dynamic>)).toList();
    } on ApiException catch (e) {
      throw SignalException('Failed to fetch signal history for $ticker: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw SignalException('Unexpected error fetching signal history for $ticker: $e');
    }
  }

  /// Get current signals for all tickers in user's watchlist
  /// GET /signals/watchlist
  Future<List<SignalModel>> getWatchlistSignals() async {
    try {
      final response = await _apiClient.get('${ApiConstants.signals}/watchlist');

      final List signalsList;
      if (response is Map<String, dynamic> && response['data'] != null) {
        signalsList = response['data'] as List;
      } else if (response is List) {
        signalsList = response;
      } else {
        signalsList = [];
      }

      return signalsList.map((item) => SignalModel.fromJson(item as Map<String, dynamic>)).toList();
    } on ApiException catch (e) {
      throw SignalException('Failed to fetch watchlist signals: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw SignalException('Unexpected error fetching watchlist signals: $e');
    }
  }
}
