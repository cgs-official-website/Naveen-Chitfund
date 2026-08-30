import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/utils/currency_formatter.dart';
import '../../providers/chit_group_provider.dart';
import '../../widgets/state_widgets.dart';
import '../../widgets/status_badges.dart';

class MyChitsScreen extends ConsumerWidget {
  const MyChitsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final myChits = ref.watch(myChitsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Chits')),
      body: myChits.when(
        loading: () => const SkeletonListLoader(),
        error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(myChitsProvider)),
        data: (subs) {
          if (subs.isEmpty) {
            return EmptyStateView(
              icon: Icons.pie_chart_outline_rounded,
              title: 'No chits joined yet',
              message: 'Browse open chit groups to get started.',
              actionLabel: 'Browse groups',
              onAction: () => context.go('/user/groups'),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myChitsProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: subs.length,
              itemBuilder: (context, i) {
                final s = subs[i];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(16),
                    title: Text(s.groupName ?? 'Chit group', style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text('Ticket #${s.ticketNumber} · ${CurrencyFormatter.formatCompact(s.chitAmount ?? 0)} · ${s.durationMonths} mo'),
                    ),
                    trailing: SubscriberStatusBadge(status: switch (s.status) {
                      _ when s.status.name == 'ps' => 'PS',
                      _ when s.status.name == 'sb' => 'SB',
                      _ => 'NPS',
                    }),
                    onTap: () => context.push('/user/groups/${s.chitGroupId}'),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
