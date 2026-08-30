import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/dio_client.dart';
import '../core/storage/secure_storage_service.dart';
import '../models/user.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final AppUser? user;
  final String? role;

  const AuthState({required this.status, this.user, this.role});

  const AuthState.unknown() : this(status: AuthStatus.unknown);
  const AuthState.unauthenticated() : this(status: AuthStatus.unauthenticated);

  bool get isAdmin => role == 'admin';
}

class AuthController extends StateNotifier<AuthState> {
  AuthController() : super(const AuthState.unknown()) {
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final token = await SecureStorageService.instance.getToken();
    final role = await SecureStorageService.instance.getRole();
    if (token == null) {
      state = const AuthState.unauthenticated();
      return;
    }
    state = AuthState(status: AuthStatus.authenticated, role: role);
    await _fetchProfile();
  }

  Future<void> requestOtp(String phone) async {
    await DioClient.instance.unwrap(
      () => DioClient.instance.dio.post('/auth/otp/request', data: {'phone': phone}),
      (data) => data,
    );
  }

  Future<void> verifyOtp(String phone, String code) async {
    final result = await DioClient.instance.unwrap(
      () => DioClient.instance.dio.post('/auth/otp/verify', data: {'phone': phone, 'code': code}),
      (data) => data,
    );

    final token = result['token'] as String;
    final role = result['role'] as String;
    await SecureStorageService.instance.saveSession(token: token, role: role);

    state = AuthState(
      status: AuthStatus.authenticated,
      role: role,
      user: AppUser.fromJson(Map<String, dynamic>.from(result['user'])),
    );
  }

  Future<void> _fetchProfile() async {
    try {
      final user = await DioClient.instance.unwrap(
        () => DioClient.instance.dio.get('/users/me'),
        (data) => AppUser.fromJson(Map<String, dynamic>.from(data)),
      );
      state = AuthState(status: AuthStatus.authenticated, role: user.role, user: user);
    } catch (_) {
      // token likely expired/invalid
      await logout();
    }
  }

  Future<void> refreshProfile() => _fetchProfile();

  Future<void> logout() async {
    await SecureStorageService.instance.clearSession();
    state = const AuthState.unauthenticated();
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController();
});
