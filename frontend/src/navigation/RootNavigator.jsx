import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useTheme } from '../core/theme/ThemeProvider';
import { useBreakpoint } from '../core/responsive/useBreakpoint';
import { useAppStore } from '../store/useAppStore';

// Screens
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
} from 'lucide-react-native';

export const RootNavigator = () => {
  const { theme, typography } = useTheme();
  const { isTablet, isTabletLandscape } = useBreakpoint();
  const { user } = useAppStore();

  const [currentTab, setCurrentTab] = useState('home');
  const [selectedChitGroupId, setSelectedChitGroupId] = useState('grp-tg-101');

  const isForeman = user?.role === 'admin';

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
              setSelectedChitGroupId('grp-tg-101');
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
              setSelectedChitGroupId('grp-tg-101');
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
        return <ProfileScreen onLogout={() => setCurrentTab('auth')} />;
      case 'foreman':
        return <ForemanDashboardScreen />;
      case 'playground':
        return <ComponentPlayground />;
      case 'auth':
        return <AuthScreen onComplete={() => setCurrentTab('home')} />;
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface.base }]}>
      <View style={[styles.topAppHeader, { backgroundColor: theme.surface.card, borderBottomColor: theme.surface.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.logoIcon, { backgroundColor: theme.maroon.primary }]}>
            <ShieldCheck size={18} color={theme.gold.accent} />
          </View>
          <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 10 }]}>
            ChitTech
          </Text>
          <View style={[styles.tagPill, { backgroundColor: theme.gold.accent + '20', borderColor: theme.gold.accent + '50' }]}>
            <Text style={[typography.caption, { color: theme.isDark ? theme.gold.accent : '#997300', fontWeight: '700' }]}>
              {isForeman ? 'Foreman Mode' : 'Subscriber'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setCurrentTab(currentTab === 'auth' ? 'home' : 'auth')}
          style={[styles.authToggleBtn, { borderColor: theme.surface.border }]}
        >
          <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
            {currentTab === 'auth' ? 'Exit eKYC' : 'eKYC Onboarding'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainLayout}>
        {isTablet && (
          <View
            style={[
              styles.navRail,
              {
                backgroundColor: theme.surface.card,
                borderRightColor: theme.surface.border,
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

        <View style={styles.screenContainer}>{renderScreen()}</View>
      </View>

      {!isTablet && (
        <View
          style={[
            styles.bottomTabBar,
            {
              backgroundColor: theme.surface.card,
              borderTopColor: theme.surface.border,
            },
          ]}
        >
          {navItems.slice(0, 5).map((item) => {
            const IconComponent = item.icon;
            const isSelected = currentTab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setCurrentTab(item.key)}
                activeOpacity={0.7}
                style={styles.tabItem}
              >
                <View
                  style={[
                    styles.tabIconWrapper,
                    isSelected && {
                      backgroundColor: item.isSpecial ? theme.maroon.primary : theme.maroon.primary + '15',
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
                </View>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? theme.maroon.primary : theme.text.secondary,
                      fontWeight: isSelected ? '700' : '500',
                      fontSize: 10,
                      marginTop: 2,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topAppHeader: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 10,
  },
  authToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
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
  bottomTabBar: {
    height: 60,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
