import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/dio_client.dart';
import '../../providers/auth_provider.dart';
import '../../router/app_router.dart';
import '../../widgets/buttons_and_inputs.dart';

class ProfileSetupScreen extends ConsumerStatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _save() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await DioClient.instance.unwrap(
        () => DioClient.instance.dio.patch('/users/me', data: {
          if (_nameController.text.trim().isNotEmpty) 'fullName': _nameController.text.trim(),
          if (_emailController.text.trim().isNotEmpty) 'email': _emailController.text.trim(),
        }),
        (data) => data,
      );
      await ref.read(authControllerProvider.notifier).refreshProfile();
      if (mounted) context.go(Routes.kycStatus);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Set up your profile')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppTextField(label: 'Full name', controller: _nameController, hint: 'As per PAN'),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Email (optional)',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                hint: 'you@example.com',
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              ],
              const SizedBox(height: 24),
              PrimaryButton(label: 'Continue', onPressed: _save, loading: _loading),
              TextButton(
                onPressed: () => context.go(Routes.kycStatus),
                child: const Text('Skip for now'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
