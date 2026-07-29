import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../domain/holding_model.dart';

/// Exception thrown when portfolio holdings operations fail
class HoldingsException implements Exception {
  final String message;
  final int? statusCode;

  HoldingsException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

/// Holdings Repository
/// Manages user portfolio holdings via backend API
class HoldingsRepository {
  final ApiClient _apiClient;

  HoldingsRepository({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  /// Get all tracked holdings for the logged-in user
  /// GET /holdings
  Future<List<HoldingModel>> getHoldings() async {
    try {
      final response = await _apiClient.get(ApiConstants.holdings);
      final List holdingsList;

      if (response is Map<String, dynamic> && response['data'] != null) {
        holdingsList = response['data'] as List;
      } else if (response is List) {
        holdingsList = response;
      } else {
        holdingsList = [];
      }

      return holdingsList.map((json) => HoldingModel.fromJson(json as Map<String, dynamic>)).toList();
    } on ApiException catch (e) {
      throw HoldingsException('Failed to fetch holdings: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw HoldingsException('Unexpected error fetching holdings: $e');
    }
  }

  /// Add a new tracked holding
  /// POST /holdings
  Future<HoldingModel> addHolding({
    required String ticker,
    required double quantity,
    required double avgBuyPrice,
    DateTime? purchaseDate,
    String? notes,
  }) async {
    try {
      final payload = {
        'ticker': ticker.toUpperCase(),
        'quantity': quantity,
        'avgBuyPrice': avgBuyPrice,
        if (purchaseDate != null) 'purchaseDate': purchaseDate.toIso8601String(),
        if (notes != null) 'notes': notes,
      };

      final response = await _apiClient.post(ApiConstants.holdings, data: payload);
      final data = (response is Map<String, dynamic> && response['data'] != null)
          ? response['data']
          : response;

      return HoldingModel.fromJson(data as Map<String, dynamic>);
    } on ApiException catch (e) {
      throw HoldingsException('Failed to add holding: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw HoldingsException('Unexpected error adding holding: $e');
    }
  }

  /// Update an existing holding
  /// PUT /holdings/:id
  Future<HoldingModel> updateHolding(
    String id, {
    double? quantity,
    double? avgBuyPrice,
    DateTime? purchaseDate,
    String? notes,
  }) async {
    try {
      final payload = <String, dynamic>{};
      if (quantity != null) payload['quantity'] = quantity;
      if (avgBuyPrice != null) payload['avgBuyPrice'] = avgBuyPrice;
      if (purchaseDate != null) payload['purchaseDate'] = purchaseDate.toIso8601String();
      if (notes != null) payload['notes'] = notes;

      final response = await _apiClient.put('${ApiConstants.holdings}/$id', data: payload);
      final data = (response is Map<String, dynamic> && response['data'] != null)
          ? response['data']
          : response;

      return HoldingModel.fromJson(data as Map<String, dynamic>);
    } on ApiException catch (e) {
      throw HoldingsException('Failed to update holding: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw HoldingsException('Unexpected error updating holding: $e');
    }
  }

  /// Delete a holding by ID
  /// DELETE /holdings/:id
  Future<void> deleteHolding(String id) async {
    try {
      await _apiClient.delete('${ApiConstants.holdings}/$id');
    } on ApiException catch (e) {
      throw HoldingsException('Failed to delete holding: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw HoldingsException('Unexpected error deleting holding: $e');
    }
  }
}
