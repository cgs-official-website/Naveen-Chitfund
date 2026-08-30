import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/dio_client.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/buttons_and_inputs.dart';

class OtpVerifyScreen extends ConsumerStatefulWidget {
  final String phone;
  const OtpVerifyScreen({super.key, required this.phone});

  @override
  ConsumerState<OtpVerifyScreen> createState() => _OtpVerifyScreenState();
}

class _OtpVerifyScreenState extends ConsumerState<OtpVerifyScreen> {
  final _controller = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _verify(String code) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).verifyOtp(widget.phone, code);
      // Router's redirect() handles navigation to the correct role's home once auth state updates.
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _controller.clear();
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Verify your number', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text(
                'We sent a 6-digit code to ${widget.phone}. In this build the code is logged to the backend server console.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 32),
              OtpInputField(
                controller: _controller,
                onChanged: (_) => setState(() => _error = null),
                onCompleted: _verify,
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              ],
              const SizedBox(height: 24),
              if (_loading) const Center(child: CircularProgressIndicator()),
              const Spacer(),
              TextButton(
                onPressed: () => ref.read(authControllerProvider.notifier).requestOtp(widget.phone),
                child: const Text('Resend code'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
