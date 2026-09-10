import { TextStyle, Platform } from 'react-native';

const SERIF_FAMILY = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia, serif',
});

const SANS_FAMILY = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'Inter, system-ui, -apple-system, sans-serif',
});

export const typography = {
  // Hero numbers and display headlines (Serif)
  displayHero: {
    fontFamily: SERIF_FAMILY,
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 42,
    fontVariant: ['tabular-nums' as const],
  },
  displayLarge: {
    fontFamily: SERIF_FAMILY,
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    fontVariant: ['tabular-nums' as const],
  },
  displayMedium: {
    fontFamily: SERIF_FAMILY,
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    fontVariant: ['tabular-nums' as const],
  },

  // Sans headings
  h1: {
    fontFamily: SANS_FAMILY,
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 30,
  },
  h2: {
    fontFamily: SANS_FAMILY,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  h3: {
    fontFamily: SANS_FAMILY,
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },

  // Body sans
  bodyLarge: {
    fontFamily: SANS_FAMILY,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: SANS_FAMILY,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: SANS_FAMILY,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },

  // Numeric and tabular
  numericLarge: {
    fontFamily: SERIF_FAMILY,
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 30,
    fontVariant: ['tabular-nums' as const],
  },
  numericMedium: {
    fontFamily: SANS_FAMILY,
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    fontVariant: ['tabular-nums' as const],
  },
  numericSmall: {
    fontFamily: SANS_FAMILY,
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    fontVariant: ['tabular-nums' as const],
  },

  // Metadata & Captions
  caption: {
    fontFamily: SANS_FAMILY,
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  overline: {
    fontFamily: SANS_FAMILY,
    fontSize: 10,
    fontWeight: '700' as const,
    lineHeight: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
};
