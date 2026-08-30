import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency_formatter.dart';
import '../../providers/admin_provider.dart';
import '../../router/app_router.dart';
import '../../widgets/buttons_and_inputs.dart';
import '../../widgets/state_widgets.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(adminDashboardProvider);

    return Scaffold(
      body: dashboardAsync.when(
        loading: () => const SkeletonListLoader(itemCount: 4),
        error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(adminDashboardProvider)),
        data: (d) {
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(adminDashboardProvider),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.5,
                  children: [
                    _statCard('Active groups', '${d['activeGroups']}', Icons.groups_outlined, AppColors.navy700),
                    _statCard('Total AUM', CurrencyFormatter.formatCompact((d['totalAUM'] as num).toDouble()), Icons.account_balance_wallet_outlined, AppColors.gold500),
                    _statCard('Pending KYC', '${d['pendingKyc']}', Icons.badge_outlined, AppColors.warning),
                    _statCard("Today's auctions", '${d['todaysAuctions']}', Icons.gavel_outlined, AppColors.success),
                  ],
                ),
                const SizedBox(height: 24),
                PrimaryButton(
                  label: 'Create new chit group',
                  icon: Icons.add_rounded,
                  onPressed: () => context.push(Routes.createGroup),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color),
            const Spacer(),
            Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
            Text(label, style: const TextStyle(fontSize: 12, color: AppColors.neutral600)),
          ],
        ),
      ),
    );
  }
}
