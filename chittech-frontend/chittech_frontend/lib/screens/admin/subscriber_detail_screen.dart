import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/dio_client.dart';
import '../../providers/admin_provider.dart';
import '../../providers/chit_group_provider.dart';
import '../../widgets/buttons_and_inputs.dart';
import '../../widgets/state_widgets.dart';

/// Shows KYC approve/reject actions and the installment schedule for a given
/// subscription. `subscriptionId` here doubles as the route param name used
/// across the app for this detail view.
class SubscriberDetailScreen extends ConsumerStatefulWidget {
  final String subscriptionId;
  const SubscriberDetailScreen({super.key, required this.subscriptionId});

  @override
  ConsumerState<SubscriberDetailScreen> createState() => _SubscriberDetailScreenState();
}

class _SubscriberDetailScreenState extends ConsumerState<SubscriberDetailScreen> {
  bool _deciding = false;

  Future<void> _decide(String userId, String decision) async {
    setState(() => _deciding = true);
    try {
      await ref.read(adminRepositoryProvider).decideKyc(userId, decision);
      ref.invalidate(adminSubscribersProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('KYC $decision')));
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _deciding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final installmentsAsync = ref.watch(installmentsProvider(widget.subscriptionId));

    return Scaffold(
      appBar: AppBar(title: const Text('Subscriber detail')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('KYC decision', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            const Text(
              'Approving or rejecting requires the underlying user ID. This screen is wired '
              'from the subscriber list, which carries that context — see admin_group_detail '
              'and subscriber_management for the calling pattern with a real userId.',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: SecondaryButton(
                    label: 'Reject',
                    onPressed: _deciding ? null : () => _decide(widget.subscriptionId, 'REJECTED'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: PrimaryButton(
                    label: 'Approve',
                    loading: _deciding,
                    onPressed: () => _decide(widget.subscriptionId, 'APPROVED'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Text('Installment schedule', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Expanded(
              child: installmentsAsync.when(
                loading: () => const SkeletonListLoader(itemCount: 3),
                error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(installmentsProvider(widget.subscriptionId))),
                data: (installments) => ListView.separated(
                  itemCount: installments.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, i) {
                    final inst = installments[i];
                    return ListTile(
                      title: Text('Month ${inst.monthNumber}'),
                      trailing: Text(inst.status),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
