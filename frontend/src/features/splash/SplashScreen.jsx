import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, Coins } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export const SplashScreen = ({ onFinish }) => {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, StatusBar.currentHeight || 0, 20);
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 20);

  // ── Animation Values ──
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  const outerRingScale = useRef(new Animated.Value(0.5)).current;
  const outerRingOpacity = useRef(new Animated.Value(0)).current;
  const innerRingScale = useRef(new Animated.Value(0.6)).current;
  const innerRingOpacity = useRef(new Animated.Value(0)).current;

  const pulseRing1 = useRef(new Animated.Value(1)).current;
  const pulseRing2 = useRef(new Animated.Value(1)).current;
  const pulseOpacity1 = useRef(new Animated.Value(0.4)).current;
  const pulseOpacity2 = useRef(new Animated.Value(0.3)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;

  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;

  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.8)).current;

  const progressAnim = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  const skipOpacity = useRef(new Animated.Value(0)).current;

  // Decorative particle animations
  const particle1Y = useRef(new Animated.Value(0)).current;
  const particle1Opacity = useRef(new Animated.Value(0)).current;
  const particle2Y = useRef(new Animated.Value(0)).current;
  const particle2Opacity = useRef(new Animated.Value(0)).current;
  const particle3Y = useRef(new Animated.Value(0)).current;
  const particle3Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ── Phase 1: Rings expand outward (0ms) ──
    Animated.parallel([
      Animated.timing(outerRingScale, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(outerRingOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(innerRingScale, {
        toValue: 1,
        duration: 700,
        delay: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(innerRingOpacity, {
        toValue: 1,
        duration: 500,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // ── Phase 2: Logo enters with spring + subtle rotation (300ms) ──
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 800,
        delay: 300,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // ── Phase 3: Title cascade (800ms) ──
    Animated.stagger(180, [
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          delay: 800,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          delay: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // ── Phase 4: Trust badge pops in (1400ms) ──
    Animated.parallel([
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: 400,
        delay: 1400,
        useNativeDriver: true,
      }),
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        delay: 1400,
        useNativeDriver: true,
      }),
    ]).start();

    // ── Phase 5: Footer + Progress bar (1200ms) ──
    Animated.timing(footerOpacity, {
      toValue: 1,
      duration: 400,
      delay: 1200,
      useNativeDriver: true,
    }).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      delay: 1200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();

    // ── Skip button fade in (600ms) ──
    Animated.timing(skipOpacity, {
      toValue: 1,
      duration: 400,
      delay: 600,
      useNativeDriver: true,
    }).start();

    // ── Continuous: Breathing pulse rings ──
    const startPulse = (anim, opacityAnim, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1.35,
              duration: 2000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.4,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    startPulse(pulseRing1, pulseOpacity1, 800);
    startPulse(pulseRing2, pulseOpacity2, 1600);

    // ── Continuous: Floating particle sparkles ──
    const animateParticle = (yAnim, opAnim, delay, duration) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(yAnim, {
              toValue: -60,
              duration,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(opAnim, {
                toValue: 0.8,
                duration: duration * 0.3,
                useNativeDriver: true,
              }),
              Animated.timing(opAnim, {
                toValue: 0,
                duration: duration * 0.7,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.timing(yAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateParticle(particle1Y, particle1Opacity, 1000, 2400);
    animateParticle(particle2Y, particle2Opacity, 1800, 2800);
    animateParticle(particle3Y, particle3Opacity, 2400, 2200);

    // ── Auto transition ──
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 3400);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.55],
  });

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-8deg', '0deg'],
  });

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1A000A" translucent />

      {/* ── Background Gradient Layers ── */}
      <View style={styles.bgGradientTop} />
      <View style={styles.bgGradientBottom} />
      <View style={styles.bgVignette} />

      {/* ── Skip Button ── */}
      <Animated.View style={{ opacity: skipOpacity, alignSelf: 'flex-end', marginRight: 24, marginTop: 8 }}>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={onFinish}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Center Hero Section ── */}
      <View style={styles.centerContent}>

        {/* Outer Pulsing Rings */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: 260,
              height: 260,
              borderRadius: 130,
              transform: [{ scale: pulseRing1 }],
              opacity: pulseOpacity1,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: 240,
              height: 240,
              borderRadius: 120,
              transform: [{ scale: pulseRing2 }],
              opacity: pulseOpacity2,
            },
          ]}
        />

        {/* Outer Decorative Ring */}
        <Animated.View
          style={[
            styles.outerRing,
            {
              opacity: outerRingOpacity,
              transform: [{ scale: outerRingScale }],
            },
          ]}
        />

        {/* Inner Accent Ring */}
        <Animated.View
          style={[
            styles.innerRing,
            {
              opacity: innerRingOpacity,
              transform: [{ scale: innerRingScale }],
            },
          ]}
        />

        {/* Floating Sparkle Particles */}
        <Animated.View
          style={[
            styles.particle,
            {
              left: -50,
              top: -30,
              transform: [{ translateY: particle1Y }],
              opacity: particle1Opacity,
            },
          ]}
        >
          <Coins size={16} color="#D4AF37" />
        </Animated.View>
        <Animated.View
          style={[
            styles.particle,
            {
              right: -45,
              top: 10,
              transform: [{ translateY: particle2Y }],
              opacity: particle2Opacity,
            },
          ]}
        >
          <Coins size={12} color="#E8D48B" />
        </Animated.View>
        <Animated.View
          style={[
            styles.particle,
            {
              left: -30,
              bottom: 20,
              transform: [{ translateY: particle3Y }],
              opacity: particle3Opacity,
            },
          ]}
        >
          <Coins size={14} color="#C9A227" />
        </Animated.View>

        {/* Logo Emblem */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { rotate: logoSpin },
              ],
            },
          ]}
        >
          <View style={styles.logoInner}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Brand Title */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.brandTitle}>Naveen Chit Fund</Text>
        </Animated.View>

        {/* Brand Subtitle */}
        <Animated.View
          style={{
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleTranslateY }],
          }}
        >
          <Text style={styles.brandSubtitle}>GOVERNMENT REGULATED</Text>
          <View style={styles.subtitleDivider}>
            <View style={styles.dividerLine} />
            <Coins size={12} color="#D4AF37" style={{ marginHorizontal: 8 }} />
            <View style={styles.dividerLine} />
          </View>
        </Animated.View>

        {/* Regulatory Trust Badge */}
        <Animated.View
          style={[
            styles.trustBadge,
            {
              opacity: badgeOpacity,
              transform: [{ scale: badgeScale }],
            },
          ]}
        >
          <ShieldCheck size={14} color="#D4AF37" />
          <Text style={styles.trustBadgeText}>
            Government Registered · Section 4 PSO Approved
          </Text>
        </Animated.View>
      </View>

      {/* ── Bottom Progress Section ── */}
      <Animated.View style={[styles.bottomBar, { opacity: footerOpacity }]}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: progressWidth },
            ]}
          />
          <View style={styles.progressShimmer} />
        </View>
        <Text style={styles.footerText}>
          100% Transparent · RBI Regulated eNACH
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A000A',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // ── Layered Background ──
  bgGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.45,
    backgroundColor: 'rgba(122, 31, 61, 0.12)',
    borderBottomLeftRadius: width,
    borderBottomRightRadius: width,
  },
  bgGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
    borderTopLeftRadius: width,
    borderTopRightRadius: width,
  },
  bgVignette: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    right: '15%',
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(122, 31, 61, 0.08)',
  },

  // ── Skip ──
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  skipText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ── Center Hero ──
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Pulse rings (breathing effect)
  pulseRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
  },

  // Outer decorative ring
  outerRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
  },

  // Inner accent ring
  innerRing: {
    position: 'absolute',
    width: 195,
    height: 195,
    borderRadius: 97.5,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },

  // Floating particles
  particle: {
    position: 'absolute',
  },

  // Logo emblem
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 2.5,
    borderColor: '#D4AF37',
  },
  logoInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 135,
    height: 135,
  },

  // Text
  textContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  brandTitle: {
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#D4AF37',
    letterSpacing: 4,
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitleDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    justifyContent: 'center',
  },
  dividerLine: {
    width: 35,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.4)',
  },

  // Trust badge
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    marginTop: 20,
  },
  trustBadgeText: {
    fontSize: 10.5,
    color: '#F0E6D2',
    marginLeft: 7,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Bottom bar
  bottomBar: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 12,
  },
  progressTrack: {
    width: width * 0.55,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
    backgroundColor: '#D4AF37',
  },
  progressShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  footerText: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
    fontWeight: '400',
  },
});
