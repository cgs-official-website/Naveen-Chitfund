import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Minus, Plus, TrendingUp } from 'lucide-react-native';

export const ReverseBidSlider = ({
  currentLowestBidPct,
  selectedBidPct,
  onBidChange,
  minBidPct = 5.0,
  maxBidPct = 40.0,
  chitAmount,
  totalSubscribers = 20,
}) => {
  const { theme, typography } = useTheme();

  const step = 0.5;

  const handleDecrease = () => {
    const nextVal = Math.max(currentLowestBidPct + 0.5, selectedBidPct - step);
    onBidChange(Number(nextVal.toFixed(1)));
  };

  const handleIncrease = () => {
    const nextVal = Math.min(maxBidPct, selectedBidPct + step);
    onBidChange(Number(nextVal.toFixed(1)));
  };

  const handleQuickStep = (delta) => {
    const nextVal = Math.min(maxBidPct, Math.max(currentLowestBidPct + 0.5, selectedBidPct + delta));
    onBidChange(Number(nextVal.toFixed(1)));
  };

  const discountRupees = (chitAmount * selectedBidPct) / 100;
  const prizeMoney = chitAmount - discountRupees;
  const foremanCommission = (chitAmount * 5) / 100;
  const distributableDividend = Math.max(0, discountRupees - foremanCommission);
  const dividendPerSubscriber = distributableDividend / totalSubscribers;

  const isAtMaxCap = selectedBidPct >= maxBidPct;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[typography.h3, { color: theme.text.primary }]}>Your Reverse Bid</Text>
          <Text style={[typography.caption, { color: theme.text.secondary }]}>
            Current best: {currentLowestBidPct.toFixed(1)}% · Legal Cap: {maxBidPct}%
          </Text>
        </View>
        <View style={[styles.discountBadge, { backgroundColor: theme.maroon.primary + '15' }]}>
          <TrendingUp size={14} color={theme.maroon.primary} />
          <Text style={[typography.numericMedium, { color: theme.maroon.primary, fontWeight: '700', marginLeft: 4 }]}>
            {selectedBidPct.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Stepper Controls */}
      <View style={styles.stepperContainer}>
        <TouchableOpacity
          onPress={handleDecrease}
          disabled={selectedBidPct <= currentLowestBidPct + 0.5}
          activeOpacity={0.7}
          style={[
            styles.stepButton,
            {
              backgroundColor: theme.surface.cardSubtle,
              borderColor: theme.surface.border,
              opacity: selectedBidPct <= currentLowestBidPct + 0.5 ? 0.4 : 1,
            },
          ]}
        >
          <Minus size={20} color={theme.text.primary} />
        </TouchableOpacity>

        <View style={styles.bidDisplayBox}>
          <Text style={[typography.displayLarge, { color: theme.maroon.primary, textAlign: 'center' }]}>
            {selectedBidPct.toFixed(1)}%
          </Text>
          <Text style={[typography.caption, { color: theme.text.muted, textAlign: 'center' }]}>
            Discount Rate
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleIncrease}
          disabled={isAtMaxCap}
          activeOpacity={0.7}
          style={[
            styles.stepButton,
            {
              backgroundColor: theme.surface.cardSubtle,
              borderColor: theme.surface.border,
              opacity: isAtMaxCap ? 0.4 : 1,
            },
          ]}
        >
          <Plus size={20} color={theme.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Quick Increments */}
      <View style={styles.quickStepsRow}>
        <TouchableOpacity
          onPress={() => handleQuickStep(0.5)}
          style={[styles.quickStepChip, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.surface.border }]}
        >
          <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '600' }]}>+0.5%</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleQuickStep(1.0)}
          style={[styles.quickStepChip, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.surface.border }]}
        >
          <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '600' }]}>+1.0%</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleQuickStep(2.0)}
          style={[styles.quickStepChip, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.surface.border }]}
        >
          <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '600' }]}>+2.0%</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onBidChange(maxBidPct)}
          style={[styles.quickStepChip, { backgroundColor: theme.gold.accent + '20', borderColor: theme.gold.accent + '40' }]}
        >
          <Text style={[typography.caption, { color: theme.isDark ? theme.gold.accent : '#997300', fontWeight: '700' }]}>Max Cap (40%)</Text>
        </TouchableOpacity>
      </View>

      {/* Realtime Impact Summary Box */}
      <View style={[styles.impactBox, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.surface.border }]}>
        <View style={styles.impactItem}>
          <Text style={[typography.caption, { color: theme.text.secondary }]}>Prize You Receive</Text>
          <Text style={[typography.numericMedium, { color: theme.semantic.success, fontWeight: '700' }]}>
            ₹{prizeMoney.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.impactDivider, { backgroundColor: theme.surface.border }]} />
        <View style={styles.impactItem}>
          <Text style={[typography.caption, { color: theme.text.secondary }]}>Dividend / Subscriber</Text>
          <Text style={[typography.numericMedium, { color: theme.gold.accent, fontWeight: '700' }]}>
            ₹{dividendPerSubscriber.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  stepButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidDisplayBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 16,
  },
  quickStepChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  impactBox: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  impactItem: {
    alignItems: 'center',
    flex: 1,
  },
  impactDivider: {
    width: 1,
    height: 32,
  },
});
