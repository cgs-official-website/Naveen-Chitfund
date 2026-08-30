import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/dio_client.dart';
import '../../providers/auth_provider.dart';
import '../../router/app_router.dart';
import '../../widgets/buttons_and_inputs.dart';

class PhoneEntryScreen extends ConsumerStatefulWidget {
  const PhoneEntryScreen({super.key});

  @override
  ConsumerState<PhoneEntryScreen> createState() => _PhoneEntryScreenState();
}

class _PhoneEntryScreenState extends ConsumerState<PhoneEntryScreen> {
  final _controller = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final phone = _controller.text.trim();
    if (phone.length < 10) {
      setState(() => _error = 'Enter a valid phone number');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).requestOtp(phone);
      if (mounted) context.push(Routes.otpVerify, extra: phone);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Welcome to ChitTech', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text(
                'Enter your phone number to sign in or create an account.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 32),
              AppTextField(
                label: 'Phone number',
                controller: _controller,
                keyboardType: TextInputType.phone,
                hint: '+91XXXXXXXXXX',
                errorText: _error,
                prefixIcon: const Icon(Icons.phone_outlined),
              ),
              const SizedBox(height: 24),
              PrimaryButton(label: 'Send OTP', onPressed: _submit, loading: _loading),
            ],
          ),
        ),
      ),
    );
  }
}
