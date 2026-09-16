import { TextStyle, Platform } from 'react-native';

const POPPINS_REGULAR = Platform.select({
  ios: 'Poppins-Regular',
  android: 'Poppins-Regular',
  default: 'Poppins, sans-serif',
});

const POPPINS_MEDIUM = Platform.select({
  ios: 'Poppins-Medium',
  android: 'Poppins-Medium',
  default: 'Poppins, sans-serif',
});

const POPPINS_SEMIBOLD = Platform.select({
  ios: 'Poppins-SemiBold',
  android: 'Poppins-SemiBold',
  default: 'Poppins, sans-serif',
});

const POPPINS_BOLD = Platform.select({
  ios: 'Poppins-Bold',
  android: 'Poppins-Bold',
  default: 'Poppins, sans-serif',
});

export const typography = {
  // Hero numbers and display headlines (Poppins Bold)
  displayHero: {
    fontFamily: POPPINS_BOLD,
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 42,
    fontVariant: ['tabular-nums' as const],
  },
  displayLarge: {
    fontFamily: POPPINS_BOLD,
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    fontVariant: ['tabular-nums' as const],
  },
  displayMedium: {
    fontFamily: POPPINS_SEMIBOLD,
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    fontVariant: ['tabular-nums' as const],
  },

  // Sans headings (Poppins Bold & SemiBold)
  h1: {
    fontFamily: POPPINS_BOLD,
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h2: {
    fontFamily: POPPINS_SEMIBOLD,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h3: {
    fontFamily: POPPINS_SEMIBOLD,
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },

  // Body sans (Poppins Regular)
  bodyLarge: {
    fontFamily: POPPINS_REGULAR,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: POPPINS_REGULAR,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: POPPINS_REGULAR,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 18,
  },

  // Numeric and tabular
  numericLarge: {
    fontFamily: POPPINS_BOLD,
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    fontVariant: ['tabular-nums' as const],
  },
  numericMedium: {
    fontFamily: POPPINS_SEMIBOLD,
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    fontVariant: ['tabular-nums' as const],
  },
  numericSmall: {
    fontFamily: POPPINS_MEDIUM,
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    fontVariant: ['tabular-nums' as const],
  },

  // Metadata & Captions
  caption: {
    fontFamily: POPPINS_MEDIUM,
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  overline: {
    fontFamily: POPPINS_BOLD,
    fontSize: 10,
    fontWeight: '700' as const,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
};
