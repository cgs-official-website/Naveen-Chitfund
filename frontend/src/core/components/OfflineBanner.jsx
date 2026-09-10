import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { WifiOff, RefreshCw } from 'lucide-react-native';

export const OfflineBanner = ({
  isOffline,
  lastUpdated = 'Just now',
  onRetry,
}) => {
  const { theme, typography } = useTheme();

  if (!isOffline) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.semantic.warningBg,
          borderColor: theme.semantic.warning + '50',
        },
      ]}
    >
      <View style={styles.leftRow}>
        <WifiOff size={16} color={theme.semantic.warning} />
        <View style={styles.textContainer}>
          <Text style={[typography.caption, { color: theme.semantic.warning, fontWeight: '700' }]}>
            Offline Mode — Read-Only
          </Text>
          <Text style={[typography.caption, { color: theme.text.secondary, fontSize: 10 }]}>
            Cached state as of {lastUpdated}
          </Text>
        </View>
      </View>

      {onRetry && (
        <TouchableOpacity onPress={onRetry} activeOpacity={0.7} style={styles.retryBtn}>
          <RefreshCw size={13} color={theme.semantic.warning} />
          <Text style={[typography.caption, { color: theme.semantic.warning, fontWeight: '700', marginLeft: 4 }]}>
            Retry
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 8,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
