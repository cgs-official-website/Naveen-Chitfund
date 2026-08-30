/// Backend base URL, injected at build/run time — never hardcoded per-environment.
///
/// Run with, e.g.:
///   flutter run --dart-define=API_BASE_URL=https://chittech-backend.up.railway.app
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000   (Android emulator, local backend)
///   flutter run --dart-define=API_BASE_URL=http://localhost:4000  (iOS simulator, local backend)
class ApiConfig {
  ApiConfig._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000',
  );

  static const String apiPrefix = '/api/v1';
  static String get apiBaseUrl => '$baseUrl$apiPrefix';

  /// Socket.IO connects to the bare host, not the /api/v1 prefix.
  static String get socketUrl => baseUrl;
}
