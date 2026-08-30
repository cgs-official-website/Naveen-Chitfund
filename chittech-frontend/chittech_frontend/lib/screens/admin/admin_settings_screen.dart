import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';

class AdminSettingsScreen extends ConsumerWidget {
  const AdminSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          CircleAvatar(radius: 32, child: Text(user?.fullName.isNotEmpty == true ? user!.fullName[0] : 'A', style: const TextStyle(fontSize: 24))),
          const SizedBox(height: 12),
          Center(child: Text(user?.fullName ?? 'Admin', style: Theme.of(context).textTheme.titleLarge)),
          Center(child: Text(user?.phone ?? '')),
          const SizedBox(height: 24),
          const ListTile(leading: Icon(Icons.notifications_outlined), title: Text('Notification preferences')),
          const ListTile(leading: Icon(Icons.security_outlined), title: Text('Security')),
          const Divider(),
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
