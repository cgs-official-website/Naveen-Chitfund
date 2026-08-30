import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../core/utils/currency_formatter.dart';
import '../models/chit_group.dart';
import 'status_badges.dart';

class ChitGroupCard extends StatelessWidget {
  final ChitGroup group;
  final VoidCallback onTap;

  const ChitGroupCard({super.key, required this.group, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      group.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ),
                  GroupStatusBadge(status: group.status),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _stat(context, 'Chit value', CurrencyFormatter.formatCompact(group.chitAmount)),
                  const SizedBox(width: 24),
                  _stat(context, 'Duration', '${group.durationMonths} mo'),
                  const SizedBox(width: 24),
                  _stat(context, 'Members', '${group.subscriberCount}/${group.durationMonths}'),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _stat(BuildContext context, String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.neutral600)),
        const SizedBox(height: 2),
        Text(value, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
      ],
    );
  }
}

class TransactionRow extends StatelessWidget {
  final String title;
  final String subtitle;
  final double amount;
  final bool isCredit;
  final DateTime date;

  const TransactionRow({
    super.key,
    required this.title,
    required this.subtitle,
    required this.amount,
    required this.isCredit,
    required this.date,
  });

  @override
  Widget build(BuildContext context) {
    final color = isCredit ? AppColors.success : AppColors.neutral900;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: (isCredit ? AppColors.success : AppColors.navy700).withValues(alpha: 0.12),
        child: Icon(
          isCredit ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
          color: isCredit ? AppColors.success : AppColors.navy700,
          size: 20,
        ),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text('$subtitle · ${_formatDate(date)}'),
      trailing: Text(
        '${isCredit ? '+' : '-'}${CurrencyFormatter.format(amount, showDecimals: true)}',
        style: TextStyle(fontWeight: FontWeight.w700, color: color),
      ),
    );
  }

  String _formatDate(DateTime d) => '${d.day}/${d.month}/${d.year}';
}

class SubscriberRow extends StatelessWidget {
  final String name;
  final String phone;
  final int ticketNumber;
  final String subscriberStatus;
  final String kycStatus;
  final VoidCallback? onTap;

  const SubscriberRow({
    super.key,
    required this.name,
    required this.phone,
    required this.ticketNumber,
    required this.subscriberStatus,
    required this.kycStatus,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: AppColors.navy100,
        child: Text('#$ticketNumber', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.navy700)),
      ),
      title: Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(phone),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SubscriberStatusBadge(status: subscriberStatus),
          const SizedBox(width: 6),
          KycStatusBadge(status: kycStatus),
        ],
      ),
    );
  }
}
