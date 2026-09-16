import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../core/theme/ThemeProvider';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import { TransparencyBadge } from '../../core/components/TransparencyBadge';
import { OfflineBanner } from '../../core/components/OfflineBanner';
import { useAppStore } from '../../store/useAppStore';
import {
  TrendingUp,
  AlertCircle,
  Gavel,
  UserCheck,
  ChevronRight,
  ArrowUpRight,
  Coins,
  ShieldCheck,
  CreditCard,
  Compass,
  FileText,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const HomeScreen = ({
  onNavigateToAuction,
  onNavigateToChitDetail,
  onNavigateToPayments,
  onNavigateToDiscovery,
  onOpenDocs,
}) => {
  const { theme, typography, isDark } = useTheme();
  const {
    user,
    activeChits,
    activeChitsLoading,
    fetchActiveChits,
    currentAuction,
    isOffline,
    lastSynced,
    setOffline,
    switchRole,
  } = useAppStore();

  useEffect(() => {
    fetchActiveChits();
  }, [user?.id]);

  const totalPortfolioValue = activeChits.reduce((acc, c) => acc + (c.chit_amount || 0), 0);
  const totalDividendEarned = activeChits.reduce((acc, c) => acc + (c.total_dividend_earned || 0), 0);
  const nextChitDue = activeChits[0];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={activeChitsLoading}
          onRefresh={fetchActiveChits}
          colors={[theme.maroon.primary]}
          tintColor={theme.maroon.primary}
        />
      }
    >
      <OfflineBanner
        isOffline={isOffline}
        lastUpdated={lastSynced}
        onRetry={() => setOffline(false)}
      />

      {/* Top Header & Role Switcher */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.headerLogoWrapper, { borderColor: theme.gold.accent }]}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
          <View style={{ marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[typography.caption, { color: theme.text.secondary }]}>Welcome back</Text>
              <Coins size={12} color={theme.gold.accent} style={{ marginLeft: 5 }} />
            </View>
            <Text style={[typography.h1, { color: theme.text.primary, fontSize: 22 }]}>
              {user?.full_name || 'Subscriber'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => switchRole(user?.role === 'admin' ? 'user' : 'admin')}
          activeOpacity={0.7}
          style={[
            styles.roleBadge,
            {
              backgroundColor: user?.role === 'admin' ? theme.maroon.primary : 'rgba(212, 175, 55, 0.12)',
              borderColor: user?.role === 'admin' ? theme.maroon.deep : 'rgba(212, 175, 55, 0.4)',
            },
          ]}
        >
          <UserCheck
            size={13}
            color={user?.role === 'admin' ? '#FFFFFF' : theme.gold.accent}
          />
          <Text
            style={[
              typography.caption,
              {
                color: user?.role === 'admin' ? '#FFFFFF' : isDark ? theme.gold.accent : '#997300',
                fontWeight: '700',
                fontSize: 11,
                marginLeft: 5,
              },
            ]}
          >
            {user?.role === 'admin' ? 'Foreman' : 'Subscriber'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Premium Wealth Portfolio Hero Card */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: isDark ? '#2D0A14' : '#38000C',
            borderColor: 'rgba(212, 175, 55, 0.35)',
          },
        ]}
      >
        <View style={styles.heroDecorTop} />
        <View style={styles.heroDecorBottom} />

        <View style={styles.heroHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Coins size={16} color="#D4AF37" />
            <Text style={styles.heroSubtitle}>TOTAL CHIT PORTFOLIO</Text>
          </View>
          <View style={styles.verifiedPill}>
            <ShieldCheck size={12} color="#D4AF37" />
            <Text style={styles.verifiedText}>PSO Registered</Text>
          </View>
        </View>

        <Text style={styles.heroAmount}>
          ₹{totalPortfolioValue.toLocaleString('en-IN')}
        </Text>

        <View style={styles.heroMetricsGrid}>
          <View style={styles.heroMetricItem}>
            <Text style={styles.heroMetricLabel}>Total Dividend</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
              <TrendingUp size={13} color="#4ADE80" />
              <Text style={styles.heroDividendValue}>
                +₹{totalDividendEarned.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroMetricItem}>
            <Text style={styles.heroMetricLabel}>Active Groups</Text>
            <Text style={styles.heroMetricValue}>
              {activeChits.length} {activeChits.length === 1 ? 'Chit' : 'Chits'}
            </Text>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroMetricItem}>
            <Text style={styles.heroMetricLabel}>Avg Returns</Text>
            <Text style={[styles.heroMetricValue, { color: '#D4AF37' }]}>
              {totalDividendEarned > 0 ? '+14.2%' : '12-18%'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Action Navigation Grid */}
      <View style={styles.quickActionRow}>
        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}
          onPress={onNavigateToPayments}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(56, 0, 12, 0.1)' }]}>
            <CreditCard size={18} color={theme.maroon.primary} />
          </View>
          <Text style={[styles.quickActionLabel, { color: theme.text.primary }]}>Pay Due</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}
          onPress={onNavigateToAuction}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
            <Gavel size={18} color="#C9A227" />
          </View>
          <Text style={[styles.quickActionLabel, { color: theme.text.primary }]}>Auction</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}
          onPress={onNavigateToDiscovery}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(56, 0, 12, 0.1)' }]}>
            <Compass size={18} color={theme.maroon.primary} />
          </View>
          <Text style={[styles.quickActionLabel, { color: theme.text.primary }]}>Explore</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}
          onPress={() => onOpenDocs?.()}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
            <FileText size={18} color="#C9A227" />
          </View>
          <Text style={[styles.quickActionLabel, { color: theme.text.primary }]}>Passbook</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Pay Overdue / Due Banner */}
      {nextChitDue && (
        <Card
          variant="goldAccent"
          style={[styles.dueBanner, { borderColor: 'rgba(212, 175, 55, 0.45)' }]}
        >
          <View style={styles.dueRow}>
            <View style={[styles.dueIconWrapper, { backgroundColor: 'rgba(212, 175, 55, 0.18)' }]}>
              <Coins size={22} color="#D4AF37" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700', fontSize: 11 }]}>
                  NEXT INSTALLMENT DUE
                </Text>
              </View>
              <Text style={[typography.numericLarge, { color: theme.text.primary, fontSize: 18, marginTop: 1 }]}>
                ₹{nextChitDue.installment_amount.toLocaleString('en-IN')}
              </Text>
              <Text style={[typography.caption, { color: theme.text.secondary, fontSize: 11 }]}>
                Due on {nextChitDue.next_due_date} · {nextChitDue.chit_group_name}
              </Text>
            </View>
            <Button
              title="Pay Now"
              size="sm"
              variant="primary"
              onPress={onNavigateToPayments}
            />
          </View>
        </Card>
      )}

      {/* Live Auction Banner */}
      {currentAuction && (
        <Card variant="elevated" style={[styles.auctionCard, { borderColor: theme.gold.accent }]}>
          <View style={styles.auctionHeader}>
            <View style={[styles.liveChip, { backgroundColor: theme.semantic.errorBg }]}>
              <View style={[styles.liveDot, { backgroundColor: theme.semantic.error }]} />
              <Text style={[typography.caption, { color: theme.semantic.error, fontWeight: '700', fontSize: 10 }]}>
                LIVE REVERSE AUCTION
              </Text>
            </View>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>
              Month {currentAuction.month_number} of 20
            </Text>
          </View>

          <Text style={[typography.h2, { color: theme.text.primary, marginTop: 10, fontSize: 17 }]}>
            {currentAuction.chit_group_name}
          </Text>

          <View style={styles.auctionDetailsRow}>
            <View>
              <Text style={[typography.caption, { color: theme.text.secondary }]}>Current Best Bid</Text>
              <Text style={[typography.numericLarge, { color: theme.maroon.primary, fontSize: 20 }]}>
                {currentAuction.current_lowest_bid_pct.toFixed(1)}% Discount
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[typography.caption, { color: theme.text.secondary }]}>Subscribers in Room</Text>
              <Text style={[typography.numericMedium, { color: theme.text.primary, fontWeight: '700' }]}>
                {currentAuction.present_subscribers} of {currentAuction.total_subscribers}
              </Text>
            </View>
          </View>

          <Button
            title="Enter Live Auction Room"
            variant="gold"
            icon={<Gavel size={18} color={theme.maroon.deep} />}
            onPress={onNavigateToAuction}
            style={{ marginTop: 14 }}
          />
        </Card>
      )}

      {/* Active Subscriptions Section */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[typography.h2, { color: theme.text.primary, fontSize: 18 }]}>
            Your Subscriptions
          </Text>
          <View style={[styles.badgeCount, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#D4AF37' }}>
              {activeChits.length}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onNavigateToDiscovery}
          style={{ flexDirection: 'row', alignItems: 'center' }}
          activeOpacity={0.7}
        >
          <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
            Explore Chits
          </Text>
          <ChevronRight size={14} color={theme.maroon.primary} />
        </TouchableOpacity>
      </View>

      {activeChits.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
            <Coins size={32} color="#D4AF37" />
          </View>
          <Text style={[typography.h3, { color: theme.text.primary, marginTop: 12 }]}>
            No Active Subscriptions
          </Text>
          <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 4, textAlign: 'center', lineHeight: 18 }]}>
            Start your journey with government-approved chit schemes to build savings and earn monthly dividends.
          </Text>
          <Button
            title="Explore Available Chits"
            variant="primary"
            size="sm"
            onPress={onNavigateToDiscovery}
            style={{ marginTop: 14 }}
          />
        </Card>
      ) : (
        activeChits.map((chit) => (
          <Card key={chit.id} style={styles.chitCard}>
            <View style={styles.chitCardTop}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[typography.h3, { color: theme.text.primary, fontWeight: '700' }]}>
                    {chit.chit_group_name}
                  </Text>
                  <View style={[styles.chitTypeBadge, { backgroundColor: 'rgba(56, 0, 12, 0.08)' }]}>
                    <Text style={{ fontSize: 9.5, color: theme.maroon.primary, fontWeight: '700' }}>
                      {chit.category || 'Standard'}
                    </Text>
                  </View>
                </View>
                <Text style={[typography.numericLarge, { color: theme.maroon.primary, marginTop: 4, fontSize: 20 }]}>
                  ₹{chit.chit_amount.toLocaleString('en-IN')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => onNavigateToChitDetail(chit.chit_group_id)}
                style={[styles.arrowCircle, { backgroundColor: theme.surface.cardSubtle }]}
                activeOpacity={0.7}
              >
                <ArrowUpRight size={18} color={theme.maroon.primary} />
              </TouchableOpacity>
            </View>

            <TransparencyBadge
              status={chit.subscriber_status}
              ticketNumber={chit.ticket_number}
              registrarState="Registered — Telangana T-Chits"
              onPressDocs={() => onOpenDocs(chit.chit_group_name)}
              style={{ marginTop: 12 }}
            />

            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={[typography.caption, { color: theme.text.secondary, fontSize: 11 }]}>
                  Installment Progress
                </Text>
                <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '600', fontSize: 11 }]}>
                  {chit.installments_paid} of {chit.total_installments} Months ({Math.round((chit.installments_paid / chit.total_installments) * 100)}%)
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.surface.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.gold.accent,
                      width: `${(chit.installments_paid / chit.total_installments) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Clearance for floating tab bar
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  headerLogoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLogo: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },

  // ── Hero Portfolio Card ──
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#38000C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  heroDecorTop: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  heroDecorBottom: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSubtitle: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginLeft: 6,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  verifiedText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroMetricLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 10.5,
    fontWeight: '500',
  },
  heroMetricValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },
  heroDividendValue: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 3,
  },
  heroDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  // ── Quick Action Row ──
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Due Banner ──
  dueBanner: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueIconWrapper: {
    padding: 10,
    borderRadius: 12,
  },

  // ── Live Auction Card ──
  auctionCard: {
    borderWidth: 1.5,
    marginBottom: 20,
    borderRadius: 16,
  },
  auctionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  auctionDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  // ── Section Headers ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  badgeCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },

  // ── Chit Cards ──
  chitCard: {
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  chitCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chitTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // ── Empty State ──
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 16,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
