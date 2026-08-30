import 'package:flutter/material.dart';
import '../../widgets/state_widgets.dart';

/// KYC docs / chit certificates viewer. Stub upload only for MVP — a clearly
/// separated KYC-service class (see docs) keeps a real DigiLocker integration
/// from being painful to add later.
class DocumentVaultScreen extends StatelessWidget {
  const DocumentVaultScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Document vault')),
      body: const EmptyStateView(
        icon: Icons.folder_open_outlined,
        title: 'No documents yet',
        message: 'Your uploaded KYC documents and chit certificates will appear here.',
      ),
    );
  }
}
