import 'package:flutter/material.dart';
import '../../widgets/buttons_and_inputs.dart';

class OfflineScreen extends StatelessWidget {
  const OfflineScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.wifi_off_rounded, size: 64),
              const SizedBox(height: 16),
              Text('No internet connection', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              const Text('Check your connection and try again.', textAlign: TextAlign.center),
              const SizedBox(height: 20),
              SecondaryButton(label: 'Retry', onPressed: () => Navigator.maybePop(context), icon: Icons.refresh_rounded),
            ],
          ),
        ),
      ),
    );
  }
}
