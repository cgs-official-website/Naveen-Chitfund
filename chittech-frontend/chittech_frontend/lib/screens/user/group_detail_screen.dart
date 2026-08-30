import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/utils/currency_formatter.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chit_group_provider.dart';
import '../../widgets/buttons_and_inputs.dart';
import '../../widgets/state_widgets.dart';
import '../../widgets/status_badges.dart';

class GroupDetailScreen extends ConsumerWidget {
  final String groupId;
  const GroupDetailScreen({super.key, required this.groupId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupAsync = ref.watch(groupDetailProvider(groupId));
    final myChits = ref.watch(myChitsProvider);
    final kycApproved = ref.watch(authControllerProvider).user?.kycStatus.name == 'approved';

    return Scaffold(
      appBar: AppBar(title: const Text('Chit group details')),
      body: groupAsync.when(
        loading: () => const SkeletonListLoader(itemCount: 3),
        error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(groupDetailProvider(groupId))),
        data: (group) {
          final alreadyJoined = myChits.maybeWhen(
            data: (subs) => subs.any((s) => s.chitGroupId == groupId),
            orElse: () => false,
          );

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(group.name, style: Theme.of(context).textTheme.headlineMedium),
                  ),
                  GroupStatusBadge(status: group.status),
                ],
              ),
              const SizedBox(height: 20),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _row('Chit value', CurrencyFormatter.format(group.chitAmount)),
                      const Divider(height: 24),
                      _row('Duration', '${group.durationMonths} months'),
                      const Divider(height: 24),
                      _row('Monthly installment', CurrencyFormatter.format(group.chitAmount / group.durationMonths, showDecimals: true)),
                      const Divider(height: 24),
                      _row('Foreman commission', '${group.foremanCommissionPct}%'),
                      const Divider(height: 24),
                      _row('Members', '${group.subscriberCount}/${group.durationMonths}'),
                      const Divider(height: 24),
                      _row('Dividend policy', group.dividendDistributionPolicy == 'ALL_SUBSCRIBERS'
                          ? 'Shared by all subscribers'
                          : 'Shared by non-prized subscribers'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text('About chit funds', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(
                'Each month, subscribers bid in an auction to receive the prize money early. '
                'The winning discount is shared as a dividend among the other members, after '
                'foreman commission. Governed by the Chit Funds Act, 1982.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 32),
              if (alreadyJoined)
                const SecondaryButton(label: 'Already joined', onPressed: null)
              else if (!kycApproved)
                SecondaryButton(
                  label: 'Complete KYC to join',
                  onPressed: () => context.push('/auth/kyc-status'),
                )
              else if (group.status != 'OPEN')
                const SecondaryButton(label: 'Group not open for new members', onPressed: null)
              else
                PrimaryButton(
                  label: 'Join this chit group',
                  onPressed: () => context.push('/user/groups/$groupId/join'),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _row(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
      ],
    );
  }
}
