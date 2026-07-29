import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../domain/alert_model.dart';

class AlertsException implements Exception {
  final String message;
  final int? statusCode;
  AlertsException(this.message, {this.statusCode});
  @override
  String toString() => message;
}

/// Alerts Repository — CRUD for user price/signal alerts
class AlertsRepository {
  final ApiClient _apiClient;

  AlertsRepository({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  /// GET /alerts?isActive=true|false
  Future<List<AlertModel>> getAlerts({bool? isActive}) async {
    try {
      final params = <String, dynamic>{};
      if (isActive != null) params['isActive'] = isActive.toString();
      final response = await _apiClient.get(ApiConstants.alerts, params: params);
      final List list = (response is Map && response['data'] != null)
          ? response['data'] as List
          : (response is List ? response : []);
      return list.map((j) => AlertModel.fromJson(j as Map<String, dynamic>)).toList();
    } on ApiException catch (e) {
      throw AlertsException('Failed to fetch alerts: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw AlertsException('Unexpected error fetching alerts: $e');
    }
  }

  /// POST /alerts
  Future<AlertModel> createAlert({
    required String ticker,
    required String condition,
    required double threshold,
  }) async {
    try {
      final response = await _apiClient.post(ApiConstants.alerts, data: {
        'ticker': ticker.toUpperCase(),
        'condition': condition,
        'threshold': threshold,
      });
      final data = (response is Map && response['data'] != null) ? response['data'] : response;
      return AlertModel.fromJson(data as Map<String, dynamic>);
    } on ApiException catch (e) {
      throw AlertsException('Failed to create alert: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw AlertsException('Unexpected error creating alert: $e');
    }
  }

  /// PATCH /alerts/:alertId — toggle isActive or update threshold
  Future<AlertModel> updateAlert(String alertId, {bool? isActive, double? threshold}) async {
    try {
      final payload = <String, dynamic>{};
      if (isActive != null) payload['isActive'] = isActive;
      if (threshold != null) payload['threshold'] = threshold;
      final response = await _apiClient.put('${ApiConstants.alerts}/$alertId', data: payload);
      final data = (response is Map && response['data'] != null) ? response['data'] : response;
      return AlertModel.fromJson(data as Map<String, dynamic>);
    } on ApiException catch (e) {
      throw AlertsException('Failed to update alert: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw AlertsException('Unexpected error updating alert: $e');
    }
  }

  /// DELETE /alerts/:alertId
  Future<void> deleteAlert(String alertId) async {
    try {
      await _apiClient.delete('${ApiConstants.alerts}/$alertId');
    } on ApiException catch (e) {
      throw AlertsException('Failed to delete alert: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw AlertsException('Unexpected error deleting alert: $e');
    }
  }
}
