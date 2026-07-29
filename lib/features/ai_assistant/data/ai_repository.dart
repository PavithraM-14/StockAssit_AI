import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';

class AiException implements Exception {
  final String message;
  final int? statusCode;
  AiException(this.message, {this.statusCode});
  @override
  String toString() => message;
}

/// AI Repository — wraps backend Gemini-powered Q&A and summary endpoints
class AiRepository {
  final ApiClient _apiClient;

  AiRepository({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  /// POST /ai/ask
  /// Ask a free-form question about a specific stock ticker
  Future<String> askAboutStock({required String ticker, required String question}) async {
    try {
      final response = await _apiClient.post('${ApiConstants.ai}/ask', data: {
        'ticker': ticker.toUpperCase(),
        'question': question,
      });
      final data = (response is Map && response['data'] != null) ? response['data'] : response;
      return (data as Map<String, dynamic>)['answer'] as String? ?? '';
    } on ApiException catch (e) {
      throw AiException('Failed to get AI answer: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw AiException('Unexpected error from AI service: $e');
    }
  }

  /// GET /ai/summary/:ticker
  /// Get a full AI-generated stock summary
  Future<String> getStockSummary(String ticker) async {
    try {
      final response = await _apiClient.get('${ApiConstants.ai}/summary/${ticker.toUpperCase()}');
      final data = (response is Map && response['data'] != null) ? response['data'] : response;
      return (data as Map<String, dynamic>)['summary'] as String? ?? '';
    } on ApiException catch (e) {
      throw AiException('Failed to get stock summary: ${e.message}', statusCode: e.statusCode);
    } catch (e) {
      throw AiException('Unexpected error fetching stock summary: $e');
    }
  }
}
