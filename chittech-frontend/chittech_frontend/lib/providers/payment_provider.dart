import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/dio_client.dart';
import '../models/payment.dart';

class PaymentRepository {
  Future<Map<String, dynamic>> createOrder(String installmentId) {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.post('/payments/order', data: {'installmentId': installmentId}),
      (data) => Map<String, dynamic>.from(data),
    );
  }

  Future<List<PaymentRecord>> myPayments() {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.get('/payments/mine'),
      (data) => (data as List).map((e) => PaymentRecord.fromJson(e)).toList(),
    );
  }
}

final paymentRepositoryProvider = Provider((ref) => PaymentRepository());

final myPaymentsProvider = FutureProvider.autoDispose<List<PaymentRecord>>((ref) {
  return ref.watch(paymentRepositoryProvider).myPayments();
});
