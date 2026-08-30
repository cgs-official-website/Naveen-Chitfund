import 'package:flutter/material.dart';
import '../../widgets/state_widgets.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: const EmptyStateView(
        icon: Icons.notifications_none_rounded,
        title: 'No notifications yet',
        message: 'Auction reminders, KYC updates, and payment confirmations will appear here.',
      ),
    );
  }
}
