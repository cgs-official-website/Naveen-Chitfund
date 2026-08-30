import 'package:flutter/material.dart';

class SupportScreen extends StatelessWidget {
  const SupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Support')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: const [
          ListTile(leading: Icon(Icons.email_outlined), title: Text('Email support'), subtitle: Text('support@chittech.example')),
          ListTile(leading: Icon(Icons.phone_outlined), title: Text('Call us'), subtitle: Text('+91 1800-XXX-XXXX')),
          ListTile(leading: Icon(Icons.help_center_outlined), title: Text('FAQs'), subtitle: Text('How chit auctions work, KYC, payments')),
        ],
      ),
    );
  }
}
