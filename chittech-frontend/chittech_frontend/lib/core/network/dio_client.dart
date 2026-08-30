import 'package:dio/dio.dart';
import '../constants/api_config.dart';
import '../storage/secure_storage_service.dart';

/// A friendly, typed exception surfaced to UI layers instead of raw DioExceptions.
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

/// Single Dio instance for the whole app. Injects the JWT on every request and
/// normalizes error responses into ApiException using the backend's
/// `{ success, data, error }` envelope.
class DioClient {
  DioClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await SecureStorageService.instance.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (DioException error, handler) {
          final response = error.response;
          String message = 'Something went wrong. Please try again.';

          if (response?.data is Map && response!.data['error'] != null) {
            message = response.data['error'].toString();
          } else if (error.type == DioExceptionType.connectionTimeout ||
              error.type == DioExceptionType.receiveTimeout) {
            message = 'The connection timed out. Check your network and try again.';
          } else if (error.type == DioExceptionType.connectionError) {
            message = 'No internet connection.';
          }

          handler.reject(
            DioException(
              requestOptions: error.requestOptions,
              error: ApiException(message, statusCode: response?.statusCode),
              response: response,
              type: error.type,
            ),
          );
        },
      ),
    );
  }

  static final DioClient instance = DioClient._internal();
  late final Dio _dio;
  Dio get dio => _dio;

  /// Unwraps the backend's `{ success, data }` envelope, or throws ApiException.
  Future<T> unwrap<T>(Future<Response> Function() call, T Function(dynamic data) map) async {
    try {
      final response = await call();
      final body = response.data;
      if (body is Map && body['success'] == true) {
        return map(body['data']);
      }
      throw ApiException(body is Map ? (body['error']?.toString() ?? 'Request failed') : 'Request failed');
    } on DioException catch (e) {
      if (e.error is ApiException) throw e.error as ApiException;
      throw ApiException(e.message ?? 'Network error');
    }
  }
}
