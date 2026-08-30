import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  ThemeMode _mode = ThemeMode.system;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          const ListTile(title: Text('Appearance'), dense: true),
          RadioListTile(value: ThemeMode.light, groupValue: _mode, title: const Text('Light'), onChanged: (v) => setState(() => _mode = v!)),
          RadioListTile(value: ThemeMode.dark, groupValue: _mode, title: const Text('Dark'), onChanged: (v) => setState(() => _mode = v!)),
          RadioListTile(value: ThemeMode.system, groupValue: _mode, title: const Text('System default'), onChanged: (v) => setState(() => _mode = v!)),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.language_outlined),
            title: const Text('Language'),
            subtitle: const Text('English (regional languages coming soon)'),
            enabled: false,
          ),
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
