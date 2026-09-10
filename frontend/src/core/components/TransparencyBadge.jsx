import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { ShieldCheck, FileText, Award, Clock } from 'lucide-react-native';

export const TransparencyBadge = ({
  status,
  registrarState,
  onPressDocs,
  ticketNumber,
  style,
}) => {
  const { theme, typography } = useTheme();

  const getStatusDetails = (st) => {
    switch (st) {
      case 'NPS':
        return {
          label: 'Non-Prized Subscriber',
          color: theme.semantic.info,
          bg: theme.isDark ? '#0D2338' : '#E8F3FC',
          code: 'NPS',
          icon: Clock,
        };
      case 'SB':
        return {
          label: 'Successful Bidder',
          color: theme.gold.accent,
          bg: theme.isDark ? '#332608' : '#FDF6E3',
          code: 'SB',
          icon: Award,
        };
      case 'PS':
        return {
          label: 'Prized Subscriber',
          color: theme.semantic.success,
          bg: theme.semantic.successBg,
          code: 'PS',
          icon: ShieldCheck,
        };
      default:
        return {
          label: 'Non-Prized',
          color: theme.semantic.info,
          bg: theme.semantic.info + '15',
          code: 'NPS',
          icon: Clock,
        };
    }
  };

  const statusInfo = status ? getStatusDetails(status) : null;
  const StatusIcon = statusInfo ? statusInfo.icon : null;

  return (
    <View style={[styles.container, style]}>
      {/* Subscriber Status Chip */}
      {statusInfo && StatusIcon && (
        <View style={[styles.chip, { backgroundColor: statusInfo.bg, borderColor: statusInfo.color + '40' }]}>
          <StatusIcon size={13} color={statusInfo.color} strokeWidth={2.5} />
          <Text style={[typography.caption, { color: statusInfo.color, fontWeight: '700', marginLeft: 4 }]}>
            {ticketNumber ? `Ticket #${ticketNumber} · ` : ''}{statusInfo.label}
          </Text>
        </View>
      )}

      {/* Registrar State Chip */}
      {registrarState && (
        <View
          style={[
            styles.chip,
            {
              backgroundColor: theme.isDark ? '#2E1925' : '#F4EBF0',
              borderColor: theme.maroon.primary + '30',
            },
          ]}
        >
          <ShieldCheck size={13} color={theme.maroon.primary} strokeWidth={2.5} />
          <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '600', marginLeft: 4 }]}>
            {registrarState}
          </Text>
        </View>
      )}

      {/* Document Access Button */}
      {onPressDocs && (
        <TouchableOpacity
          onPress={onPressDocs}
          activeOpacity={0.7}
          style={[
            styles.chip,
            styles.docsChip,
            {
              backgroundColor: theme.isDark ? '#2B2313' : '#FFF9EB',
              borderColor: theme.gold.accent + '60',
            },
          ]}
        >
          <FileText size={12} color={theme.gold.accent} strokeWidth={2.5} />
          <Text style={[typography.caption, { color: theme.isDark ? theme.gold.accent : '#997300', fontWeight: '700', marginLeft: 4 }]}>
            FDR / PSO Docs
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  docsChip: {
    borderStyle: 'dashed',
  },
});
