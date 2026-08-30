import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class NotFoundScreen extends StatelessWidget {
  const NotFoundScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.explore_off_outlined, size: 64),
            const SizedBox(height: 16),
            Text('Page not found', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 20),
            FilledButton(onPressed: () => context.go('/'), child: const Text('Go home')),
          ],
        ),
      ),
    );
  }
}
