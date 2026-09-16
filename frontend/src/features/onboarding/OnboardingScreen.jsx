import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeProvider';
import { Button } from '../../core/components/Button';
import {
  Gavel,
  ShieldCheck,
  Zap,
  ChevronRight,
  TrendingDown,
  Building,
  CheckCircle2,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: 'slide-1',
    badge: 'SMART REVERSE AUCTION',
    title: 'Live Digital Bidding at Your Fingertips',
    description:
      'Participate in transparent monthly reverse auctions directly from your mobile. Win prize money when you need liquidity, or earn handsome dividends by saving.',
    icon: Gavel,
    iconColor: '#D4AF37',
    highlight: 'Up to 25% annual dividend yields for non-prized subscribers',
  },
  {
    id: 'slide-2',
    badge: 'GOVERNMENT REGULATED',
    title: '100% Registrar Protection & PSO Backed',
    description:
      'Strictly compliant with the Central Chit Funds Act 1982. Every chit series is registered with the State Registrar of Chits with 100% Fixed Deposit collateral pledged.',
    icon: ShieldCheck,
    iconColor: '#2E7D32',
    highlight: 'Telangana & Andhra Pradesh T-Chits Registrar Approved',
  },
  {
    id: 'slide-3',
    badge: 'SEAMLESS PAYMENTS',
    title: 'Instant UPI & Automated eNACH Disbursals',
    description:
      'Settle monthly installments seamlessly through UPI and NPCI eNACH mandates. Enjoy automated dividend deduction and direct-to-bank RTGS prize payouts.',
    icon: Zap,
    iconColor: '#800020',
    highlight: 'Instant receipt generation & statutory Form XIV ledger',
  },
];

export const OnboardingScreen = ({ onComplete }) => {
  const { theme, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const topPadding = Math.max(insets.top, StatusBar.currentHeight || 0, 16);
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  const handleScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlideIndex(slide);
  };

  const goToNextSlide = () => {
    if (currentSlideIndex < ONBOARDING_SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentSlideIndex + 1) * width,
        animated: true,
      });
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const isLastSlide = currentSlideIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface.base,
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={{ marginLeft: 8 }}>
            <Text style={[typography.h3, { color: theme.text.primary, fontWeight: '700' }]}>
              Naveen Chit Fund
            </Text>
            <Text style={[typography.caption, { color: theme.gold.accent, fontSize: 9, letterSpacing: 1 }]}>
              GOVT REGULATED
            </Text>
          </View>
        </View>

        {!isLastSlide && (
          <TouchableOpacity onPress={onComplete} style={styles.skipBtn}>
            <Text style={[typography.caption, { color: theme.text.secondary, fontWeight: '600' }]}>
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slide Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.carousel}
      >
        {ONBOARDING_SLIDES.map((slide) => {
          const IconComponent = slide.icon;
          return (
            <View key={slide.id} style={[styles.slide, { width }]}>
              {/* Illustration Hero Icon Box */}
              <View style={[styles.iconBox, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: slide.iconColor + '18' }]}>
                  <IconComponent size={56} color={slide.iconColor} />
                </View>
              </View>

              {/* Text Information */}
              <View style={styles.textContent}>
                <View style={[styles.badge, { backgroundColor: theme.gold.accent + '20', borderColor: theme.gold.accent + '50' }]}>
                  <Text style={[typography.caption, { color: theme.isDark ? theme.gold.accent : '#997300', fontWeight: '700' }]}>
                    {slide.badge}
                  </Text>
                </View>

                <Text style={[typography.h1, styles.slideTitle, { color: theme.text.primary }]}>
                  {slide.title}
                </Text>

                <Text style={[typography.bodyMedium, styles.slideDesc, { color: theme.text.secondary }]}>
                  {slide.description}
                </Text>

                <View style={[styles.highlightBox, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.surface.border }]}>
                  <CheckCircle2 size={16} color={theme.semantic.success} />
                  <Text style={[typography.caption, styles.highlightText, { color: theme.text.primary }]}>
                    {slide.highlight}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {ONBOARDING_SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentSlideIndex
                      ? theme.maroon.primary
                      : theme.surface.border,
                  width: index === currentSlideIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <Button
          title={isLastSlide ? 'Get Started' : 'Continue'}
          variant={isLastSlide ? 'primary' : 'gold'}
          onPress={goToNextSlide}
          icon={!isLastSlide ? <ChevronRight size={18} color="#FFFFFF" /> : undefined}
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  carousel: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBox: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  slideTitle: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 22,
    lineHeight: 30,
  },
  slideDesc: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  highlightText: {
    marginLeft: 8,
    fontWeight: '600',
  },
  bottomControls: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    paddingTop: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionBtn: {
    width: '100%',
  },
});
