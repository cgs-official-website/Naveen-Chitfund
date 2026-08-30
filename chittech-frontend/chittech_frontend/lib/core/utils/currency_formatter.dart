/// Single shared utility for ₹ formatting with Indian (lakh/crore) digit grouping.
/// Used everywhere money is shown so formatting never drifts per-screen.
class CurrencyFormatter {
  CurrencyFormatter._();

  /// Formats a rupee amount (double or int) as `₹1,23,456` or `₹1,23,456.78`.
  static String format(num amount, {bool showDecimals = false}) {
    final isNegative = amount < 0;
    final abs = amount.abs();

    final wholePart = abs.truncate();
    final decimalPart = showDecimals
        ? '.${((abs - wholePart) * 100).round().toString().padLeft(2, '0')}'
        : '';

    final grouped = _groupIndian(wholePart.toString());
    return '${isNegative ? '-' : ''}₹$grouped$decimalPart';
  }

  /// Compact form for dashboards: ₹5L, ₹1.2Cr, ₹850
  static String formatCompact(num amount) {
    final abs = amount.abs();
    final sign = amount < 0 ? '-' : '';
    if (abs >= 10000000) {
      return '$sign₹${_trimZero(abs / 10000000)}Cr';
    } else if (abs >= 100000) {
      return '$sign₹${_trimZero(abs / 100000)}L';
    } else if (abs >= 1000) {
      return '$sign₹${_trimZero(abs / 1000)}K';
    }
    return '$sign₹${abs.truncate()}';
  }

  static String _trimZero(double value) {
    final s = value.toStringAsFixed(1);
    return s.endsWith('.0') ? s.substring(0, s.length - 2) : s;
  }

  /// Indian digit grouping: last 3 digits, then groups of 2.
  /// e.g. 1234567 -> "12,34,567"
  static String _groupIndian(String digits) {
    if (digits.length <= 3) return digits;
    final last3 = digits.substring(digits.length - 3);
    var remaining = digits.substring(0, digits.length - 3);
    final buffer = StringBuffer();
    while (remaining.length > 2) {
      buffer.write(',${remaining.substring(remaining.length - 2)}');
      remaining = remaining.substring(0, remaining.length - 2);
    }
    if (remaining.isNotEmpty) buffer.write(',$remaining');
    final prefix = buffer.toString().split(',').reversed.join(',');
    return '$prefix,$last3'.replaceFirst(RegExp(r'^,'), '');
  }
}
