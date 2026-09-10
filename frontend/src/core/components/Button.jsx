import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  size = 'md',
}) => {
  const { theme, typography } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.text.muted + '30';
    switch (variant) {
      case 'primary':
        return theme.maroon.primary;
      case 'secondary':
        return theme.maroon.deep;
      case 'gold':
        return theme.gold.accent;
      case 'danger':
        return theme.semantic.error;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return theme.maroon.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.text.muted;
    switch (variant) {
      case 'gold':
        return theme.maroon.deep;
      case 'outline':
        return theme.maroon.primary;
      case 'ghost':
        return theme.maroon.primary;
      default:
        return theme.text.inverse;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 14, minHeight: 38 };
      case 'lg':
        return { paddingVertical: 14, paddingHorizontal: 24, minHeight: 52 };
      case 'md':
      default:
        return { paddingVertical: 12, paddingHorizontal: 20, minHeight: 46 };
    }
  };

  const padding = getPadding();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical: padding.paddingVertical,
          paddingHorizontal: padding.paddingHorizontal,
          minHeight: padding.minHeight,
          borderColor: variant === 'outline' ? theme.maroon.primary : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            style={[
              typography.h3,
              {
                color: getTextColor(),
                fontWeight: '600',
                marginLeft: icon ? 8 : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
