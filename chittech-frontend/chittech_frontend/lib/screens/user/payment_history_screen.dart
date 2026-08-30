import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/payment_provider.dart';
import '../../widgets/cards.dart';
import '../../widgets/state_widgets.dart';

class PaymentHistoryScreen extends ConsumerWidget {
  const PaymentHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final paymentsAsync = ref.watch(myPaymentsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Payments & receipts')),
      body: paymentsAsync.when(
        loading: () => const SkeletonListLoader(),
        error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(myPaymentsProvider)),
        data: (payments) {
          if (payments.isEmpty) {
            return const EmptyStateView(
              icon: Icons.receipt_long_outlined,
              title: 'No payments yet',
              message: 'Your installment payments and receipts will show up here.',
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myPaymentsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: payments.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final p = payments[i];
                return TransactionRow(
                  title: 'Installment payment',
                  subtitle: p.status,
                  amount: p.amount,
                  isCredit: false,
                  date: p.createdAt,
                );
              },
            ),
          );
        },
      ),
    );
  }
}
