import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/admin_provider.dart';
import '../../widgets/cards.dart';
import '../../widgets/state_widgets.dart';

class LedgerReportsScreen extends ConsumerWidget {
  const LedgerReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ledgerAsync = ref.watch(adminLedgerProvider);

    return Scaffold(
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Export coming soon (placeholder)')),
                      );
                    },
                    icon: const Icon(Icons.download_outlined),
                    label: const Text('Export'),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ledgerAsync.when(
              loading: () => const SkeletonListLoader(),
              error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(adminLedgerProvider)),
              data: (entries) {
                if (entries.isEmpty) {
                  return const EmptyStateView(
                    icon: Icons.receipt_long_outlined,
                    title: 'No ledger entries yet',
                    message: 'Installments, dividends, and commissions will appear here.',
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(adminLedgerProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: entries.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final e = entries[i];
                      final isCredit = e['entry_type'] == 'DIVIDEND' || e['entry_type'] == 'PRIZE_PAYOUT';
                      return TransactionRow(
                        title: e['entry_type'] ?? '',
                        subtitle: 'Group ${e['chit_group_id'].toString().substring(0, 8)}',
                        amount: double.tryParse(e['amount'].toString()) ?? 0,
                        isCredit: isCredit,
                        date: DateTime.tryParse(e['created_at'] ?? '') ?? DateTime.now(),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
