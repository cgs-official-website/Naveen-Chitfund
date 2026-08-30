import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency_formatter.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chit_group_provider.dart';
import '../../router/app_router.dart';
import '../../widgets/state_widgets.dart';

class HomeDashboardScreen extends ConsumerWidget {
  const HomeDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final myChits = ref.watch(myChitsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Hi, ${user?.fullName.split(' ').first ?? 'there'} 👋'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push(Routes.notifications),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myChitsProvider),
        child: myChits.when(
          loading: () => const SkeletonListLoader(),
          error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(myChitsProvider)),
          data: (subs) {
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  color: AppColors.navy700,
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Active chits', style: TextStyle(color: Colors.white70, fontSize: 13)),
                        const SizedBox(height: 4),
                        Text(
                          '${subs.length}',
                          style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.white,
                                  side: const BorderSide(color: Colors.white54),
                                ),
                                onPressed: () => context.go(Routes.browseGroups),
                                child: const Text('Browse chit groups'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text('Your chits', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                if (subs.isEmpty)
                  const EmptyStateView(
                    icon: Icons.pie_chart_outline_rounded,
                    title: 'No chits yet',
                    message: 'Browse open chit groups and join one to get started.',
                  )
                else
                  ...subs.map(
                    (s) => Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: ListTile(
                        title: Text(s.groupName ?? 'Chit group'),
                        subtitle: Text('Ticket #${s.ticketNumber} · ${CurrencyFormatter.formatCompact(s.chitAmount ?? 0)}'),
                        trailing: const Icon(Icons.chevron_right_rounded),
                        onTap: () => context.push('/user/groups/${s.chitGroupId}'),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}
