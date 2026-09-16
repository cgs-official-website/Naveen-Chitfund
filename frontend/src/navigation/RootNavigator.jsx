import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../core/theme/ThemeProvider';
import { useBreakpoint } from '../core/responsive/useBreakpoint';
import { useAppStore } from '../store/useAppStore';
import { apiClient, getStoredToken, setAuthToken } from '../core/networking/apiClient';

// Screens
import { SplashScreen } from '../features/splash/SplashScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { HomeScreen } from '../features/dashboard/HomeScreen';
import { ChitDiscoveryScreen } from '../features/chits/ChitDiscoveryScreen';
import { ChitDetailScreen } from '../features/chits/ChitDetailScreen';
import { LiveAuctionScreen } from '../features/auction/LiveAuctionScreen';
import { PaymentsScreen } from '../features/payments/PaymentsScreen';
import { SuretyScreen } from '../features/surety/SuretyScreen';
import { NotificationsScreen } from '../features/notifications/NotificationsScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { ForemanDashboardScreen } from '../features/foreman/ForemanDashboardScreen';
import { AuthScreen } from '../features/auth/AuthScreen';
import { ComponentPlayground } from '../core/components/Playground';

// Icons
import {
  Home,
  Compass,
  Gavel,
  CreditCard,
  Award,
  Bell,
  User,
  Building,
  Layers,
  ShieldCheck,
  Coins,
  Moon,
  Sun,
} from 'lucide-react-native';

export const RootNavigator = () => {
  const insets = useSafeAreaInsets();
  const { theme, typography, isDark, toggleTheme } = useTheme();
  const { isTablet, isTabletLandscape } = useBreakpoint();
  const { user, login } = useAppStore();

  const [appStage, setAppStage] = useState('splash'); // 'splash' | 'onboarding' | 'auth' | 'app'
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedChitGroupId, setSelectedChitGroupId] = useState('');

  // Silent session restoration on app boot
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await getStoredToken();
        if (storedToken) {
          await setAuthToken(storedToken);
          const res = await apiClient.get('/users/me');
          if (res.data?.data?.id) {
            const u = res.data.data;
            login(
              {
                id: u.id,
                phone: u.phone,
                full_name: u.fullName,
                role: u.role,
                kyc_status:
                  u.kycStatus === 'APPROVED'
                    ? 'VERIFIED'
                    : u.kycStatus === 'PENDING'
                    ? 'PENDING'
                    : 'NOT_STARTED',
                is_nri: false,
                biometric_enabled: true,
              },
              storedToken
            );
          }
        }
      } catch (err) {
        console.log('Session restoration note:', err.message);
        await setAuthToken(null);
      }
    }
    restoreSession();
  }, []);

  const isForeman = user?.role === 'admin';

  // Screen Stage Gates: Splash -> Onboarding -> Auth -> App
  if (appStage === 'splash') {
    return (
      <SplashScreen
        onFinish={() => setAppStage(user?.id ? 'app' : 'onboarding')}
      />
    );
  }

  if (appStage === 'onboarding') {
    return (
      <OnboardingScreen
        onComplete={() => setAppStage(user?.id ? 'app' : 'auth')}
      />
    );
  }

  if (appStage === 'auth') {
    return (
      <AuthScreen
        onComplete={() => {
          setAppStage('app');
          setCurrentTab('home');
        }}
      />
    );
  }

  const navItems = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'discovery', label: 'Explore', icon: Compass },
    { key: 'auction', label: 'Auction', icon: Gavel, isSpecial: true },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'surety', label: 'Surety', icon: Award },
    { key: 'notifications', label: 'Alerts', icon: Bell },
    ...(isForeman ? [{ key: 'foreman', label: 'Foreman', icon: Building }] : []),
    { key: 'playground', label: 'Playground', icon: Layers },
    { key: 'profile', label: 'Profile', icon: User },
  ];

  const topHeaderPadding = Math.max(insets.top, StatusBar.currentHeight || 0, 14);
  const bottomBarPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 10);

  const renderScreen = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeScreen
            onNavigateToAuction={() => setCurrentTab('auction')}
            onNavigateToChitDetail={(id) => {
              setSelectedChitGroupId(id);
              setCurrentTab('chitDetail');
            }}
            onNavigateToPayments={() => setCurrentTab('payments')}
            onNavigateToDiscovery={() => setCurrentTab('discovery')}
            onOpenDocs={() => {
              setSelectedChitGroupId('');
              setCurrentTab('chitDetail');
            }}
          />
        );
      case 'discovery':
        if (isTabletLandscape) {
          return (
            <View style={styles.twoPaneContainer}>
              <View style={styles.masterPane}>
                <ChitDiscoveryScreen
                  onSelectGroup={(id) => setSelectedChitGroupId(id)}
                  onOpenDocs={() => {}}
                />
              </View>
              <View style={[styles.detailPane, { borderLeftColor: theme.surface.border }]}>
                <ChitDetailScreen
                  groupId={selectedChitGroupId}
                  onBack={() => {}}
                  onNavigateToAuction={() => setCurrentTab('auction')}
                />
              </View>
            </View>
          );
        }
        return (
          <ChitDiscoveryScreen
            onSelectGroup={(id) => {
              setSelectedChitGroupId(id);
              setCurrentTab('chitDetail');
            }}
            onOpenDocs={() => {
              setSelectedChitGroupId('');
              setCurrentTab('chitDetail');
            }}
          />
        );
      case 'chitDetail':
        return (
          <ChitDetailScreen
            groupId={selectedChitGroupId}
            onBack={() => setCurrentTab('discovery')}
            onNavigateToAuction={() => setCurrentTab('auction')}
          />
        );
      case 'auction':
        return <LiveAuctionScreen />;
      case 'payments':
        return <PaymentsScreen />;
      case 'surety':
        return <SuretyScreen />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'profile':
        return (
          <ProfileScreen
            onLogout={() => setAppStage('auth')}
            onReplaySplash={() => setAppStage('splash')}
            onReplayOnboarding={() => setAppStage('onboarding')}
          />
        );
      case 'foreman':
        return <ForemanDashboardScreen />;
      case 'playground':
        return <ComponentPlayground />;
      case 'auth':
        return (
          <AuthScreen
            onComplete={() => {
              setAppStage('app');
              setCurrentTab('home');
            }}
          />
        );
      default:
        return (
          <HomeScreen
            onNavigateToAuction={() => setCurrentTab('auction')}
            onNavigateToChitDetail={() => {}}
            onNavigateToPayments={() => {}}
            onNavigateToDiscovery={() => {}}
            onOpenDocs={() => {}}
          />
        );
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.surface.base }]}>
      <View
        style={[
          styles.topAppHeader,
          {
            backgroundColor: isDark ? '#2D0A14' : '#38000C',
            borderBottomColor: 'rgba(212, 175, 55, 0.3)',
            paddingTop: topHeaderPadding,
            height: 56 + topHeaderPadding,
            paddingLeft: 16 + insets.left,
            paddingRight: 16 + insets.right,
            shadowColor: isDark ? '#000000' : '#38000C',
          },
        ]}
      >
        {/* Left: Brand Identity */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
          </View>
          <View style={{ marginLeft: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.topBrandName}>Naveen Chit Fund</Text>
              <Coins size={12} color="#D4AF37" style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.topSubBrand}>
              NAVEEN CHITS · GOVT REG
            </Text>
          </View>
        </View>

        {/* Right: Controls & Account */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Role Mode Pill */}
          <View style={[styles.tagPill, { backgroundColor: isForeman ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.12)' }]}>
            <Text style={styles.tagPillText}>
              {isForeman ? 'Foreman' : 'Subscriber'}
            </Text>
          </View>

          {/* Theme Toggle Button */}
          <TouchableOpacity
            onPress={toggleTheme}
            activeOpacity={0.7}
            style={styles.headerIconBtn}
          >
            {isDark ? (
              <Sun size={15} color="#D4AF37" />
            ) : (
              <Moon size={15} color="#F0E6D2" />
            )}
          </TouchableOpacity>

          {/* Profile Icon Button */}
          <TouchableOpacity
            onPress={() => {
              if (user?.id) {
                setCurrentTab('profile');
              } else {
                setAppStage('auth');
              }
            }}
            activeOpacity={0.7}
            style={styles.profileIconBtn}
          >
            <User size={16} color="#D4AF37" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainLayout}>
        {isTablet && (
          <View
            style={[
              styles.navRail,
              {
                backgroundColor: theme.surface.card,
                borderRightColor: theme.surface.border,
                paddingLeft: insets.left,
                paddingBottom: insets.bottom,
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.railContent}>
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isSelected = currentTab === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setCurrentTab(item.key)}
                    activeOpacity={0.7}
                    style={[
                      styles.railItem,
                      isSelected && {
                        backgroundColor: item.isSpecial ? theme.maroon.primary : theme.maroon.primary + '18',
                      },
                    ]}
                  >
                    <IconComponent
                      size={20}
                      color={
                        isSelected
                          ? item.isSpecial
                            ? '#FFFFFF'
                            : theme.maroon.primary
                          : theme.text.secondary
                      }
                    />
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: isSelected
                            ? item.isSpecial
                              ? '#FFFFFF'
                              : theme.maroon.primary
                            : theme.text.secondary,
                          fontWeight: isSelected ? '700' : '500',
                          marginTop: 4,
                          textAlign: 'center',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View
          style={[
            styles.screenContainer,
            {
              paddingLeft: insets.left,
              paddingRight: insets.right,
            },
          ]}
        >
          {renderScreen()}
        </View>
      </View>

      {!isTablet && (
        <View
          style={[
            styles.floatingTabBar,
            {
              backgroundColor: isDark ? '#1C0D15' : '#FFFFFF',
              bottom: bottomBarPadding + 8,
              marginLeft: 14 + insets.left,
              marginRight: 14 + insets.right,
              shadowColor: isDark ? '#000000' : '#38000C',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.25)' : 'rgba(212, 175, 55, 0.35)',
              elevation: isDark ? 16 : 10,
            },
          ]}
        >
          {navItems.slice(0, 5).map((item) => {
            const IconComponent = item.icon;
            const isSelected = currentTab === item.key;
            const isSpecial = item.isSpecial; // Center Auction Button

            if (isSpecial) {
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setCurrentTab(item.key)}
                  activeOpacity={0.85}
                  style={styles.specialTabItem}
                >
                  <View
                    style={[
                      styles.specialIconCircle,
                      {
                        backgroundColor: '#38000C',
                        borderColor: isSelected ? '#FFD700' : '#D4AF37',
                        shadowColor: '#D4AF37',
                        shadowOpacity: isSelected ? 0.6 : 0.35,
                        shadowRadius: isSelected ? 12 : 8,
                        transform: [{ scale: isSelected ? 1.08 : 1.0 }],
                      },
                    ]}
                  >
                    <IconComponent size={23} color={isSelected ? '#FFD700' : '#D4AF37'} />
                  </View>
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: isSelected ? '#D4AF37' : isDark ? '#E5D4B8' : '#38000C',
                        fontWeight: '800',
                        fontSize: 10,
                        marginTop: 2,
                        letterSpacing: 0.3,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected && <View style={styles.specialActivePill} />}
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setCurrentTab(item.key)}
                activeOpacity={0.7}
                style={[
                  styles.tabItem,
                  isSelected && styles.tabItemSelected,
                ]}
              >
                <View
                  style={[
                    styles.tabIconWrapper,
                    isSelected && {
                      backgroundColor: isDark ? 'rgba(212, 175, 55, 0.22)' : 'rgba(56, 0, 12, 0.08)',
                      borderColor: isDark ? 'rgba(212, 175, 55, 0.4)' : 'rgba(56, 0, 12, 0.15)',
                    },
                  ]}
                >
                  <IconComponent
                    size={20}
                    color={
                      isSelected
                        ? theme.maroon.primary
                        : isDark
                        ? '#A89280'
                        : '#7A6B63'
                    }
                  />
                </View>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected
                        ? theme.maroon.primary
                        : isDark
                        ? '#8A7A70'
                        : '#8A7A70',
                      fontWeight: isSelected ? '800' : '500',
                      fontSize: 10.5,
                      marginTop: 2,
                    },
                  ]}
                >
                  {item.label}
                </Text>
                {isSelected && (
                  <View
                    style={[
                      styles.activeIndicatorLine,
                      { backgroundColor: theme.maroon.primary },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topAppHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoIcon: {
    width: 30,
    height: 30,
  },
  topBrandName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  topSubBrand: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.3,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  navRail: {
    width: 84,
    borderRightWidth: 1,
  },
  railContent: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  railItem: {
    width: 70,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenContainer: {
    flex: 1,
  },
  floatingTabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: 66,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
    paddingBottom: 4,
    borderRadius: 20,
  },
  tabItemSelected: {
    // Subtle elevated feel on select
  },
  tabIconWrapper: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicatorLine: {
    width: 16,
    height: 2.5,
    borderRadius: 1.5,
    marginTop: 3,
  },
  specialActivePill: {
    width: 14,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#D4AF37',
    marginTop: 2,
  },
  specialTabItem: {
    flex: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20, // Elevated float above the bar
  },
  specialIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  twoPaneContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  masterPane: {
    flex: 1.1,
  },
  detailPane: {
    flex: 1.4,
    borderLeftWidth: 1,
  },
});
