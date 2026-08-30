import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../router/app_router.dart';

/// The full ADMIN navigation shell: drawer-nav with Dashboard, Groups,
/// Auctions (via group detail), Subscribers, Ledger, Settings. This shell
/// tree never imports or references any user-facing screen — the two
/// experiences are structurally separate navigation graphs (see app_router.dart).
class AdminShell extends ConsumerWidget {
  final Widget child;
  const AdminShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).matchedLocation;
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      appBar: AppBar(title: Text(_titleFor(location))),
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    const CircleAvatar(backgroundColor: AppColors.gold500, child: Icon(Icons.shield_outlined, color: Colors.white)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(user?.fullName ?? 'Admin', style: const TextStyle(fontWeight: FontWeight.w700)),
                          const Text('Foreman / Operator', style: TextStyle(fontSize: 12, color: AppColors.neutral600)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              _tile(context, Icons.dashboard_outlined, 'Dashboard', Routes.adminDashboard),
              _tile(context, Icons.groups_outlined, 'Groups', Routes.adminGroups),
              _tile(context, Icons.people_outline_rounded, 'Subscribers', Routes.subscriberManagement),
              _tile(context, Icons.receipt_long_outlined, 'Ledger', Routes.ledgerReports),
              _tile(context, Icons.settings_outlined, 'Settings', Routes.adminSettings),
              const Spacer(),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.logout_rounded, color: Colors.red),
                title: const Text('Log out', style: TextStyle(color: Colors.red)),
                onTap: () => ref.read(authControllerProvider.notifier).logout(),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
      body: child,
    );
  }

  Widget _tile(BuildContext context, IconData icon, String label, String route) {
    final selected = GoRouterState.of(context).matchedLocation.startsWith(route);
    return ListTile(
      leading: Icon(icon, color: selected ? AppColors.navy700 : null),
      title: Text(label, style: TextStyle(fontWeight: selected ? FontWeight.w700 : FontWeight.w400)),
      selected: selected,
      selectedTileColor: AppColors.navy100,
      onTap: () {
        Navigator.of(context).pop();
        context.go(route);
      },
    );
  }

  String _titleFor(String location) {
    if (location.startsWith(Routes.adminGroups) || location.startsWith('/admin/groups')) return 'Chit groups';
    if (location.startsWith(Routes.subscriberManagement)) return 'Subscribers';
    if (location.startsWith(Routes.ledgerReports)) return 'Ledger & reports';
    if (location.startsWith(Routes.adminSettings)) return 'Settings';
    return 'Admin dashboard';
  }
}
