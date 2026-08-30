import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/dio_client.dart';
import '../models/chit_group.dart';
import '../models/subscription.dart';

class ChitGroupRepository {
  Future<List<ChitGroup>> browseGroups({String? status}) {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.get('/chit-groups', queryParameters: {
        if (status != null) 'status': status,
        'limit': 50,
      }),
      (data) => (data['items'] as List).map((e) => ChitGroup.fromJson(e)).toList(),
    );
  }

  Future<ChitGroup> getGroup(String id) {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.get('/chit-groups/$id'),
      (data) => ChitGroup.fromJson(Map<String, dynamic>.from(data)),
    );
  }

  Future<ChitGroup> createGroup({
    required String name,
    required double chitAmount,
    required int durationMonths,
    required double foremanCommissionPct,
    required String dividendDistributionPolicy,
  }) {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.post('/chit-groups', data: {
        'name': name,
        'chitAmount': chitAmount,
        'durationMonths': durationMonths,
        'foremanCommissionPct': foremanCommissionPct,
        'dividendDistributionPolicy': dividendDistributionPolicy,
      }),
      (data) => ChitGroup.fromJson(Map<String, dynamic>.from(data)),
    );
  }

  Future<ChitSubscription> joinGroup(String groupId) {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.post('/chit-groups/$groupId/join'),
      (data) => ChitSubscription.fromJson(Map<String, dynamic>.from(data)),
    );
  }

  Future<List<ChitSubscription>> myChits() {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.get('/subscriptions/mine'),
      (data) => (data as List).map((e) => ChitSubscription.fromJson(e)).toList(),
    );
  }

  Future<List<Installment>> installments(String subscriptionId) {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.get('/subscriptions/$subscriptionId/installments'),
      (data) => (data as List).map((e) => Installment.fromJson(e)).toList(),
    );
  }
}

final chitGroupRepositoryProvider = Provider((ref) => ChitGroupRepository());

final browseGroupsProvider = FutureProvider.autoDispose<List<ChitGroup>>((ref) {
  return ref.watch(chitGroupRepositoryProvider).browseGroups(status: 'OPEN');
});

final groupDetailProvider = FutureProvider.autoDispose.family<ChitGroup, String>((ref, id) {
  return ref.watch(chitGroupRepositoryProvider).getGroup(id);
});

final myChitsProvider = FutureProvider.autoDispose<List<ChitSubscription>>((ref) {
  return ref.watch(chitGroupRepositoryProvider).myChits();
});

final installmentsProvider = FutureProvider.autoDispose.family<List<Installment>, String>((ref, subscriptionId) {
  return ref.watch(chitGroupRepositoryProvider).installments(subscriptionId);
});
