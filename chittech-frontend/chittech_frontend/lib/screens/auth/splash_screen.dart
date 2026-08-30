import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.navy900,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: AppColors.gold500,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(Icons.account_balance_rounded, color: Colors.white, size: 44),
            ),
            const SizedBox(height: 24),
            const Text(
              'ChitTech',
              style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: 0.5),
            ),
            const SizedBox(height: 8),
            Text(
              'Trusted chit funds, digitized',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 14),
            ),
            const SizedBox(height: 40),
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(strokeWidth: 2.6, color: AppColors.gold400),
            ),
          ],
        ),
      ),
    );
  }
}
