import React from 'react';
import { View, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export const Card = ({
  children,
  style,
  variant = 'elevated',
  padding = 16,
}) => {
  const { theme } = useTheme();

  const isGold = variant === 'goldAccent';
  const isElevated = variant === 'elevated';

  const cardStyle = {
    backgroundColor: isGold ? theme.surface.cardSubtle : theme.surface.card,
    borderRadius: 14,
    padding,
    borderWidth: 1,
    borderColor: isGold ? theme.gold.accent + '40' : theme.surface.border,
    ...(isElevated
      ? Platform.select({
          android: {
            elevation: 3,
          },
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
          },
          default: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
          },
        })
      : {}),
  };

  return <View style={[cardStyle, style]}>{children}</View>;
};
