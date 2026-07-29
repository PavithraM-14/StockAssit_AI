import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';

/// Custom API Exception with message and optional HTTP status code
class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException({
    required this.message,
    this.statusCode,
  });

  @override
  String toString() => 'ApiException(statusCode: $statusCode, message: $message)';
}

/// Central Dio-based API Client for communicating with backend endpoints
class ApiClient {
  late final Dio _dio;

  ApiClient({Dio? dio}) {
    _dio = dio ??
        Dio(
          BaseOptions(
            baseUrl: ApiConstants.baseUrl,
            connectTimeout: ApiConstants.connectTimeout,
            receiveTimeout: ApiConstants.receiveTimeout,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        );

    // Interceptor: Attach Firebase ID Token on every request
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          try {
            final currentUser = FirebaseAuth.instance.currentUser;
            if (currentUser != null) {
              final token = await currentUser.getIdToken();
              if (token != null && token.isNotEmpty) {
                options.headers['Authorization'] = 'Bearer $token';
              }
            }
          } catch (e) {
            debugPrint('⚠️ Error retrieving Firebase ID token: $e');
          }
          return handler.next(options);
        },
      ),
    );

    // Interceptor: Logging in debug mode only
    if (kDebugMode) {
      _dio.interceptors.add(
        LogInterceptor(
          request: true,
          requestHeader: true,
          requestBody: true,
          responseHeader: false,
          responseBody: true,
          error: true,
          logPrint: (object) => debugPrint('🌐 [HTTP] $object'),
        ),
      );
    }
  }

  /// GET request
  Future<dynamic> get(String path, {Map<String, dynamic>? params}) async {
    try {
      final response = await _dio.get(path, queryParameters: params);
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(message: 'Unexpected error: $e');
    }
  }

  /// POST request
  Future<dynamic> post(String path, {dynamic data}) async {
    try {
      final response = await _dio.post(path, data: data);
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(message: 'Unexpected error: $e');
    }
  }

  /// PUT request
  Future<dynamic> put(String path, {dynamic data}) async {
    try {
      final response = await _dio.put(path, data: data);
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(message: 'Unexpected error: $e');
    }
  }

  /// DELETE request
  Future<dynamic> delete(String path) async {
    try {
      final response = await _dio.delete(path);
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(message: 'Unexpected error: $e');
    }
  }

  /// Maps DioException to custom ApiException
  ApiException _handleDioError(DioException error) {
    final statusCode = error.response?.statusCode;
    String message = 'An error occurred. Please try again.';

    if (error.response?.data != null) {
      final responseData = error.response?.data;
      if (responseData is Map) {
        message = responseData['message'] ?? responseData['error'] ?? message;
      } else if (responseData is String && responseData.isNotEmpty) {
        message = responseData;
      }
    } else if (error.message != null && error.message!.isNotEmpty) {
      message = error.message!;
    }

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        message = 'Connection timed out. Please check your network connection.';
        break;
      case DioExceptionType.connectionError:
        message = 'Unable to connect to server. Please check your internet connection.';
        break;
      case DioExceptionType.cancel:
        message = 'Request was cancelled.';
        break;
      default:
        break;
    }

    return ApiException(
      message: message,
      statusCode: statusCode,
    );
  }
}
