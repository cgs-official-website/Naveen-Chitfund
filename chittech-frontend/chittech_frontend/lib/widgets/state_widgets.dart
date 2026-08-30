import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import 'buttons_and_inputs.dart';

/// Simple shimmer-less skeleton block — cheap, dependency-free loading placeholder.
class SkeletonBox extends StatefulWidget {
  final double height;
  final double? width;
  final BorderRadius? radius;

  const SkeletonBox({super.key, required this.height, this.width, this.radius});

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox> with SingleTickerProviderStateMixin {
  late final AnimationController _controller =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final opacity = 0.4 + (_controller.value * 0.25);
        return Container(
          height: widget.height,
          width: widget.width,
          decoration: BoxDecoration(
            color: AppColors.neutral300.withValues(alpha: opacity),
            borderRadius: widget.radius ?? BorderRadius.circular(10),
          ),
        );
      },
    );
  }
}

class SkeletonListLoader extends StatelessWidget {
  final int itemCount;
  const SkeletonListLoader({super.key, this.itemCount = 4});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: itemCount,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, __) => const SkeletonBox(height: 96, radius: BorderRadius.all(Radius.circular(16))),
    );
  }
}

/// Reusable empty state — icon, message, optional action.
class EmptyStateView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EmptyStateView({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 56, color: AppColors.navy300),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.titleMedium, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.neutral600),
              textAlign: TextAlign.center,
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 20),
              PrimaryButton(label: actionLabel!, onPressed: onAction),
            ],
          ],
        ),
      ),
    );
  }
}

/// Reusable error state — for failed loads, with a retry action.
class ErrorStateView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const ErrorStateView({super.key, required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded, size: 56, color: AppColors.danger),
            const SizedBox(height: 16),
            Text('Something went wrong', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.neutral600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            SecondaryButton(label: 'Retry', onPressed: onRetry, icon: Icons.refresh_rounded),
          ],
        ),
      ),
    );
  }
}
