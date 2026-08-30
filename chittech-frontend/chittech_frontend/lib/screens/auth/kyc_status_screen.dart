import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../router/app_router.dart';
import '../../widgets/buttons_and_inputs.dart';

class KycStatusScreen extends ConsumerWidget {
  const KycStatusScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final status = auth.user?.kycStatus ?? KycStatus.notSubmitted;

    return Scaffold(
      appBar: AppBar(title: const Text('KYC status')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Expanded(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(_iconFor(status), size: 72, color: _colorFor(status)),
                    const SizedBox(height: 20),
                    Text(_titleFor(status), style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 8),
                    Text(
                      _messageFor(status),
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.neutral600),
                    ),
                    if (status == KycStatus.notSubmitted || status == KycStatus.rejected) ...[
                      const SizedBox(height: 24),
                      // Stub upload — a real DigiLocker/Aadhaar integration is out of scope
                      // for this MVP; this just sets kyc_status to PENDING via the profile
                      // PATCH endpoint (panNumber triggers that transition server-side).
                      SecondaryButton(
                        label: 'Upload PAN (stub)',
                        icon: Icons.upload_file_outlined,
                        onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('PAN uploaded — pending admin review (stub).')),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            PrimaryButton(label: 'Continue to app', onPressed: () => context.go(Routes.userHome)),
          ],
        ),
      ),
    );
  }

  IconData _iconFor(KycStatus s) => switch (s) {
        KycStatus.approved => Icons.verified_rounded,
        KycStatus.rejected => Icons.cancel_rounded,
        KycStatus.pending => Icons.hourglass_top_rounded,
        KycStatus.notSubmitted => Icons.badge_outlined,
      };

  Color _colorFor(KycStatus s) => switch (s) {
        KycStatus.approved => AppColors.success,
        KycStatus.rejected => AppColors.danger,
        KycStatus.pending => AppColors.warning,
        KycStatus.notSubmitted => AppColors.navy300,
      };

  String _titleFor(KycStatus s) => switch (s) {
        KycStatus.approved => 'KYC approved',
        KycStatus.rejected => 'KYC rejected',
        KycStatus.pending => 'KYC under review',
        KycStatus.notSubmitted => 'Complete your KYC',
      };

  String _messageFor(KycStatus s) => switch (s) {
        KycStatus.approved => 'You can now join chit groups and bid in auctions.',
        KycStatus.rejected => 'Your submission was rejected. Please re-upload your PAN.',
        KycStatus.pending => 'Our team is reviewing your documents. This usually takes 1–2 business days.',
        KycStatus.notSubmitted => 'Upload your PAN to unlock joining chit groups and bidding.',
      };
}
