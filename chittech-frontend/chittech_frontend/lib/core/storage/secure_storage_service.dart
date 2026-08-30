import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Wraps flutter_secure_storage for the handful of sensitive values the app
/// keeps on-device: the JWT and the role decoded from it. Non-sensitive prefs
/// (theme choice, etc.) live in shared_preferences instead — see AppPrefs.
class SecureStorageService {
  SecureStorageService._();
  static final instance = SecureStorageService._();

  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _tokenKey = 'chittech_jwt';
  static const _roleKey = 'chittech_role';

  Future<void> saveSession({required String token, required String role}) async {
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _roleKey, value: role);
  }

  Future<String?> getToken() => _storage.read(key: _tokenKey);
  Future<String?> getRole() => _storage.read(key: _roleKey);

  Future<void> clearSession() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _roleKey);
  }
}
