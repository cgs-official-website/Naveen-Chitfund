import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AlertCircle, X } from 'lucide-react-native';

export const Input = forwardRef((props, ref) => {
  const {
    label,
    value,
    onChangeText,
    placeholder,
    placeholderTextColor,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    rightElement,
    prefix,
    suffix,
    error,
    helperText,
    required = false,
    disabled = false,
    clearable = false,
    onClear,
    containerStyle,
    inputContainerStyle,
    inputStyle,
    onFocus,
    onBlur,
    style,
    ...rest
  } = props;

  const { theme, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const handleClear = () => {
    if (onChangeText) onChangeText('');
    if (onClear) onClear();
  };

  const getBorderColor = () => {
    if (error) return theme.semantic.error;
    if (isFocused) return theme.gold.accent;
    return theme.surface.border;
  };

  const getBorderWidth = () => {
    if (error || isFocused) return 1.5;
    return 1;
  };

  const renderIcon = (icon) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon;
    return (
      <IconComponent
        size={18}
        color={error ? theme.semantic.error : isFocused ? theme.gold.accent : theme.text.muted}
      />
    );
  };

  return (
    <View style={[styles.wrapper, containerStyle, style]}>
      {/* Label */}
      {label && (
        <View style={styles.labelRow}>
          <Text
            style={[
              typography.caption,
              styles.label,
              { color: isFocused ? theme.gold.accent : theme.text.secondary },
            ]}
          >
            {label}
            {required && <Text style={{ color: theme.semantic.error }}> *</Text>}
          </Text>
        </View>
      )}

      {/* Input Container Box */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: disabled
              ? theme.surface.cardSubtle + '80'
              : theme.surface.inputBg,
            borderColor: getBorderColor(),
            borderWidth: getBorderWidth(),
            shadowColor: isFocused ? theme.gold.accent : '#000',
            shadowOffset: { width: 0, height: isFocused ? 2 : 1 },
            shadowOpacity: isFocused ? 0.15 : 0.04,
            shadowRadius: isFocused ? 4 : 2,
            elevation: isFocused ? 3 : 1,
          },
          inputContainerStyle,
        ]}
      >
        {/* Left Prefix Badge */}
        {prefix && (
          <View
            style={[
              styles.prefixBadge,
              {
                backgroundColor: theme.surface.cardSubtle,
                borderRightColor: theme.surface.border,
              },
            ]}
          >
            {typeof prefix === 'string' ? (
              <Text
                style={[
                  typography.bodyMedium,
                  { color: theme.text.primary, fontWeight: '700' },
                ]}
              >
                {prefix}
              </Text>
            ) : (
              prefix
            )}
          </View>
        )}

        {/* Left Icon */}
        {LeftIcon && <View style={styles.leftIconWrapper}>{renderIcon(LeftIcon)}</View>}

        {/* Text Input */}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor || theme.text.muted}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            typography.bodyMedium,
            styles.nativeInput,
            {
              color: disabled ? theme.text.muted : theme.text.primary,
            },
            inputStyle,
          ]}
          {...rest}
        />

        {/* Clear Button */}
        {clearable && !!value && !disabled && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={[styles.clearCircle, { backgroundColor: theme.text.muted + '25' }]}>
              <X size={12} color={theme.text.secondary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Right Element or Right Icon */}
        {rightElement ? (
          <View style={styles.rightElementWrapper}>{rightElement}</View>
        ) : RightIcon ? (
          <View style={styles.rightIconWrapper}>{renderIcon(RightIcon)}</View>
        ) : null}

        {/* Suffix Badge */}
        {suffix && (
          <View
            style={[
              styles.suffixBadge,
              {
                backgroundColor: theme.surface.cardSubtle,
                borderLeftColor: theme.surface.border,
              },
            ]}
          >
            {typeof suffix === 'string' ? (
              <Text
                style={[
                  typography.caption,
                  { color: theme.text.secondary, fontWeight: '600' },
                ]}
              >
                {suffix}
              </Text>
            ) : (
              suffix
            )}
          </View>
        )}
      </View>

      {/* Error or Helper Message */}
      {error ? (
        <View style={styles.feedbackRow}>
          <AlertCircle size={12} color={theme.semantic.error} style={{ marginTop: 2 }} />
          <Text style={[typography.caption, { color: theme.semantic.error, marginLeft: 4, flex: 1 }]}>
            {error}
          </Text>
        </View>
      ) : helperText ? (
        <Text style={[typography.caption, styles.helperText, { color: theme.text.muted }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    minHeight: 50,
    overflow: 'hidden',
  },
  prefixBadge: {
    paddingHorizontal: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  suffixBadge: {
    paddingHorizontal: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
  },
  leftIconWrapper: {
    paddingLeft: 14,
    paddingRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconWrapper: {
    paddingRight: 14,
    paddingLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightElementWrapper: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtn: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    height: 50,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 5,
    paddingHorizontal: 2,
  },
  helperText: {
    marginTop: 4,
    paddingHorizontal: 2,
    fontSize: 11,
  },
});
