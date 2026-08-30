import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// ChitTech brand palette.
/// Deep navy/indigo primary evokes trust and institutional weight; the warm
/// gold/amber accent evokes prosperity — a deliberate departure from Material's
/// default purple/blue so the app reads as a considered fintech product, not a
/// generic template.
class AppColors {
  AppColors._();

  static const navy900 = Color(0xFF0B1330);
  static const navy800 = Color(0xFF121B45);
  static const navy700 = Color(0xFF1B2A63);
  static const navy500 = Color(0xFF2E3E82);
  static const navy300 = Color(0xFF6B7BB8);
  static const navy100 = Color(0xFFE3E7F5);

  static const gold500 = Color(0xFFC9971F);
  static const gold400 = Color(0xFFDDB144);
  static const gold100 = Color(0xFFF7EBCE);

  static const success = Color(0xFF1E8E5A);
  static const warning = Color(0xFFB7791F);
  static const danger = Color(0xFFC0392B);

  static const neutral900 = Color(0xFF15171F);
  static const neutral600 = Color(0xFF565A6E);
  static const neutral300 = Color(0xFFD5D7E2);
  static const neutral100 = Color(0xFFF4F5F9);
  static const neutral50 = Color(0xFFFAFAFD);
}

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.navy700,
        brightness: Brightness.light,
        primary: AppColors.navy700,
        secondary: AppColors.gold500,
        surface: Colors.white,
        error: AppColors.danger,
      ),
      scaffoldBackgroundColor: AppColors.neutral50,
    );
    return _applyText(base);
  }

  static ThemeData get dark {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.navy500,
        brightness: Brightness.dark,
        primary: AppColors.navy300,
        secondary: AppColors.gold400,
        surface: AppColors.navy800,
        error: const Color(0xFFE57373),
      ),
      scaffoldBackgroundColor: AppColors.navy900,
    );
    return _applyText(base);
  }

  static ThemeData _applyText(ThemeData base) {
    final textTheme = GoogleFonts.interTextTheme(base.textTheme);
    final displayFont = GoogleFonts.plusJakartaSansTextTheme(base.textTheme);

    return base.copyWith(
      textTheme: textTheme.copyWith(
        displayLarge: displayFont.displayLarge?.copyWith(fontWeight: FontWeight.w700),
        displayMedium: displayFont.displayMedium?.copyWith(fontWeight: FontWeight.w700),
        headlineLarge: displayFont.headlineLarge?.copyWith(fontWeight: FontWeight.w700),
        headlineMedium: displayFont.headlineMedium?.copyWith(fontWeight: FontWeight.w600),
        titleLarge: displayFont.titleLarge?.copyWith(fontWeight: FontWeight.w600),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: base.scaffoldBackgroundColor,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: displayFont.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
          color: base.colorScheme.onSurface,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: base.colorScheme.primary,
          foregroundColor: base.colorScheme.onPrimary,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: base.brightness == Brightness.light ? Colors.white : AppColors.navy800,
        contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: base.colorScheme.outlineVariant),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: base.colorScheme.outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: base.colorScheme.primary, width: 1.6),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: base.brightness == Brightness.light ? Colors.white : AppColors.navy800,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: base.colorScheme.outlineVariant.withValues(alpha: 0.5)),
        ),
      ),
    );
  }
}
