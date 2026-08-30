import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  const _Badge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}

/// Subscriber status: NPS (non-prized), SB (surety/standby), PS (prized).
class SubscriberStatusBadge extends StatelessWidget {
  final String status;
  const SubscriberStatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    switch (status) {
      case 'PS':
        return const _Badge(label: 'Prized', color: AppColors.gold500);
      case 'SB':
        return const _Badge(label: 'Standby', color: AppColors.navy500);
      default:
        return const _Badge(label: 'Active', color: AppColors.success);
    }
  }
}

class KycStatusBadge extends StatelessWidget {
  final String status;
  const KycStatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    switch (status) {
      case 'APPROVED':
        return const _Badge(label: 'KYC ✓', color: AppColors.success);
      case 'REJECTED':
        return const _Badge(label: 'KYC ✗', color: AppColors.danger);
      case 'PENDING':
        return const _Badge(label: 'KYC pending', color: AppColors.warning);
      default:
        return const _Badge(label: 'KYC needed', color: AppColors.neutral600);
    }
  }
}

class GroupStatusBadge extends StatelessWidget {
  final String status;
  const GroupStatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    switch (status) {
      case 'OPEN':
        return const _Badge(label: 'Open', color: AppColors.success);
      case 'RUNNING':
        return const _Badge(label: 'Running', color: AppColors.navy500);
      case 'CLOSED':
        return const _Badge(label: 'Closed', color: AppColors.neutral600);
      default:
        return const _Badge(label: 'Draft', color: AppColors.warning);
    }
  }
}

class AuctionStatusBadge extends StatelessWidget {
  final String status;
  const AuctionStatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    switch (status) {
      case 'LIVE':
        return const _Badge(label: '● LIVE', color: AppColors.danger);
      case 'COMPLETED':
        return const _Badge(label: 'Completed', color: AppColors.success);
      case 'CANCELLED':
        return const _Badge(label: 'Cancelled', color: AppColors.neutral600);
      default:
        return const _Badge(label: 'Scheduled', color: AppColors.navy500);
    }
  }
}
