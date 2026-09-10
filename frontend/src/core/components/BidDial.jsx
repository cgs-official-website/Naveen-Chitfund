import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

export const BidDial = ({
  size = 280,
  strokeWidth = 14,
  totalDurationSeconds = 120,
  remainingSeconds = 45,
  currentLowestBidPct,
  chitAmount,
  foremanCommissionPct = 5,
  statusText = 'LIVE AUCTION',
}) => {
  const { theme, typography, isDark } = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate progress ratio (0 to 1)
  const progressRatio = Math.max(0, Math.min(1, remainingSeconds / totalDurationSeconds));
  const strokeDashoffset = circumference * (1 - progressRatio);

  const discountAmount = (chitAmount * currentLowestBidPct) / 100;
  const prizeMoney = chitAmount - discountAmount;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const dialGold = theme.gold.accent;
  const dialMaroon = theme.maroon.primary;
  const dialDeep = theme.maroon.deep;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="goldRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={dialGold} stopOpacity="0.9" />
            <Stop offset="50%" stopColor="#FFF2B2" stopOpacity="1" />
            <Stop offset="100%" stopColor={dialGold} stopOpacity="0.8" />
          </LinearGradient>

          <LinearGradient id="maroonArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={dialMaroon} />
            <Stop offset="100%" stopColor={dialDeep} />
          </LinearGradient>
        </Defs>

        {/* Outer bezel */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius + strokeWidth / 3.5}
          stroke="url(#goldRingGrad)"
          strokeWidth={2}
          fill="none"
          opacity={0.7}
        />

        {/* Depleted background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? '#2B1420' : '#EFE3D8'}
          strokeWidth={strokeWidth}
          fill={isDark ? '#1C0D15' : '#FCF8F4'}
        />

        {/* Depleting progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#maroonArcGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />

        {/* Inner gold ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius - strokeWidth / 1.8}
          stroke={dialGold}
          strokeWidth={1}
          fill="none"
          opacity={0.4}
        />
      </Svg>

      {/* Central metrics overlay */}
      <View style={styles.centerContent}>
        <View style={[styles.statusTag, { backgroundColor: theme.maroon.primary + '18', borderColor: theme.maroon.primary + '30' }]}>
          <Animated.View
            style={[
              styles.liveDot,
              {
                backgroundColor: remainingSeconds <= 10 ? theme.semantic.error : theme.gold.accent,
                opacity: pulseAnim,
              },
            ]}
          />
          <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
            {statusText}
          </Text>
        </View>

        <Text style={[typography.displayHero, { color: theme.text.primary, marginVertical: 2 }]}>
          {currentLowestBidPct.toFixed(1)}%
        </Text>
        <Text style={[typography.caption, { color: theme.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }]}>
          Lowest Bid Discount
        </Text>

        <View style={styles.payoutContainer}>
          <Text style={[typography.numericMedium, { color: theme.maroon.primary, fontWeight: '700' }]}>
            ₹{prizeMoney.toLocaleString('en-IN')}
          </Text>
          <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10 }]}>
            Prize Money Payout
          </Text>
        </View>

        <View style={[styles.timerBadge, { backgroundColor: remainingSeconds <= 10 ? theme.semantic.errorBg : theme.surface.cardSubtle }]}>
          <Text
            style={[
              typography.numericSmall,
              {
                color: remainingSeconds <= 10 ? theme.semantic.error : theme.text.primary,
                fontWeight: '700',
              },
            ]}
          >
            ⏱ {timerStr} left
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  payoutContainer: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  timerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
});
