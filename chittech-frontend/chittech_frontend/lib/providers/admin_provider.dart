import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/dio_client.dart';

class AdminRepository {
  Future<Map<String, dynamic>> dashboard() {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.get('/admin/dashboard'),
      (data) => Map<String, dynamic>.from(data),
    );
  }

  Future<List<dynamic>> ledger({String? groupId}) {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.get('/admin/ledger', queryParameters: {
        if (groupId != null) 'groupId': groupId,
        'limit': 50,
      }),
      (data) => data['items'] as List,
    );
  }

  Future<List<dynamic>> subscribers({String? groupId, String? search}) {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.get('/admin/subscribers', queryParameters: {
        if (groupId != null) 'groupId': groupId,
        if (search != null && search.isNotEmpty) 'search': search,
        'limit': 50,
      }),
      (data) => data['items'] as List,
    );
  }

  Future<List<dynamic>> pendingKyc() {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.get('/users', queryParameters: {'kycStatus': 'PENDING', 'limit': 50}),
      (data) => data['items'] as List,
    );
  }

  Future<void> decideKyc(String userId, String decision) {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.post('/users/$userId/kyc', data: {'decision': decision}),
      (data) => data,
    );
  }
}

final adminRepositoryProvider = Provider((ref) => AdminRepository());

final adminDashboardProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) {
  return ref.watch(adminRepositoryProvider).dashboard();
});

final adminLedgerProvider = FutureProvider.autoDispose<List<dynamic>>((ref) {
  return ref.watch(adminRepositoryProvider).ledger();
});

final adminSubscribersProvider = FutureProvider.autoDispose<List<dynamic>>((ref) {
  return ref.watch(adminRepositoryProvider).subscribers();
});

final adminPendingKycProvider = FutureProvider.autoDispose<List<dynamic>>((ref) {
  return ref.watch(adminRepositoryProvider).pendingKyc();
});
