import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../domain/watchlist_model.dart';

/// Exception thrown when watchlist operations fail
class WatchlistException implements Exception {
  final String message;
  final int? statusCode;

  WatchlistException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

/// Watchlist Repository — wired to the backend API
class WatchlistRepository {
  final ApiClient _apiClient;

  WatchlistRepository({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  /// GET /watchlist — fetch the current user's watchlist
  Future<WatchlistModel> getWatchlist() async {
    try {
      final response = await _apiClient.get(ApiConstants.watchlist);
      final data = (response is Map<String, dynamic> && response['data'] != null)
          ? response['data']
          : response;
      return WatchlistModel.fromJson(data as Map<String, dynamic>);
    } on ApiException catch (e) {
      throw WatchlistException('Failed to fetch watchlist: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw WatchlistException('Unexpected error fetching watchlist: $e');
    }
  }

  /// POST /watchlist — add a single ticker
  Future<WatchlistModel> addTicker(String ticker) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.watchlist,
        data: {'ticker': ticker.toUpperCase()},
      );
      final data = (response is Map<String, dynamic> && response['data'] != null)
          ? response['data']
          : response;
      return WatchlistModel.fromJson(data as Map<String, dynamic>);
    } on ApiException catch (e) {
      throw WatchlistException('Failed to add $ticker: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw WatchlistException('Unexpected error adding ticker: $e');
    }
  }

  /// DELETE /watchlist/:ticker — remove a single ticker
  Future<WatchlistModel> removeTicker(String ticker) async {
    try {
      final response = await _apiClient.delete('${ApiConstants.watchlist}/${ticker.toUpperCase()}');
      final data = (response is Map<String, dynamic> && response['data'] != null)
          ? response['data']
          : response;
      return WatchlistModel.fromJson(data as Map<String, dynamic>);
    } on ApiException catch (e) {
      throw WatchlistException('Failed to remove $ticker: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw WatchlistException('Unexpected error removing ticker: $e');
    }
  }

  /// PUT /watchlist — replace all tickers
  Future<WatchlistModel> updateWatchlist(List<String> tickers) async {
    try {
      final response = await _apiClient.put(
        ApiConstants.watchlist,
        data: {'tickers': tickers.map((t) => t.toUpperCase()).toList()},
      );
      final data = (response is Map<String, dynamic> && response['data'] != null)
          ? response['data']
          : response;
      return WatchlistModel.fromJson(data as Map<String, dynamic>);
    } on ApiException catch (e) {
      throw WatchlistException('Failed to update watchlist: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw WatchlistException('Unexpected error updating watchlist: $e');
    }
  }

  /// DELETE /watchlist — clear all tickers
  Future<void> clearWatchlist() async {
    try {
      await _apiClient.delete(ApiConstants.watchlist);
    } on ApiException catch (e) {
      throw WatchlistException('Failed to clear watchlist: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw WatchlistException('Unexpected error clearing watchlist: $e');
    }
  }
}
