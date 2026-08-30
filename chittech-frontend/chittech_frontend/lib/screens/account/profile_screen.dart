import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../router/app_router.dart';
import '../../widgets/status_badges.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          CircleAvatar(radius: 36, child: Text(user?.fullName.isNotEmpty == true ? user!.fullName[0] : '?', style: const TextStyle(fontSize: 28))),
          const SizedBox(height: 12),
          Text(user?.fullName ?? '', style: Theme.of(context).textTheme.titleLarge, textAlign: TextAlign.center),
          Center(child: Text(user?.phone ?? '')),
          const SizedBox(height: 8),
          Center(child: KycStatusBadge(status: user?.kycStatus.name.toUpperCase() ?? 'NOT_SUBMITTED')),
          const SizedBox(height: 24),
          ListTile(leading: const Icon(Icons.badge_outlined), title: const Text('KYC status'), trailing: const Icon(Icons.chevron_right_rounded), onTap: () => context.push(Routes.kycStatus)),
          ListTile(leading: const Icon(Icons.folder_outlined), title: const Text('Document vault'), trailing: const Icon(Icons.chevron_right_rounded), onTap: () => context.push(Routes.documentVault)),
          ListTile(leading: const Icon(Icons.settings_outlined), title: const Text('Settings'), trailing: const Icon(Icons.chevron_right_rounded), onTap: () => context.push(Routes.settings)),
          ListTile(leading: const Icon(Icons.help_outline_rounded), title: const Text('Support'), trailing: const Icon(Icons.chevron_right_rounded), onTap: () => context.push(Routes.support)),
          const SizedBox(height: 16),
          ListTile(
            leading: const Icon(Icons.logout_rounded, color: Colors.red),
            title: const Text('Log out', style: TextStyle(color: Colors.red)),
            onTap: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
    );
  }
}
