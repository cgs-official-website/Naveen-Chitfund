import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
} from 'lucide-react-native';

export const HomeScreen = ({
  onNavigateToAuction,
  onNavigateToChitDetail,
  onNavigateToPayments,
  onNavigateToDiscovery,
  onOpenDocs,
}) => {
  const { theme, typography } = useTheme();
  const {
    user,
    activeChits,
    currentAuction,
    isOffline,
    lastSynced,
    setOffline,
    switchRole,
  } = useAppStore();

  const totalPortfolioValue = activeChits.reduce((acc, c) => acc + c.chit_amount, 0);
  const totalDividendEarned = activeChits.reduce((acc, c) => acc + c.total_dividend_earned, 0);
  const nextChitDue = activeChits[0];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
    >
      <OfflineBanner
        isOffline={isOffline}
        lastUpdated={lastSynced}
        onRetry={() => setOffline(false)}
      />

      {/* Top Header & Role Switcher */}
      <View style={styles.topBar}>
        <View>
          <Text style={[typography.caption, { color: theme.text.secondary }]}>Welcome back,</Text>
          <Text style={[typography.h1, { color: theme.text.primary }]}>
            {user?.full_name || 'Subscriber'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => switchRole(user?.role === 'admin' ? 'user' : 'admin')}
          activeOpacity={0.7}
          style={[
            styles.roleBadge,
            {
              backgroundColor: user?.role === 'admin' ? theme.maroon.primary : theme.gold.accent + '25',
              borderColor: user?.role === 'admin' ? theme.maroon.deep : theme.gold.accent,
            },
          ]}
        >
          <UserCheck
            size={14}
            color={user?.role === 'admin' ? '#FFFFFF' : theme.isDark ? theme.gold.accent : '#997300'}
          />
          <Text
            style={[
              typography.caption,
              {
                color: user?.role === 'admin' ? '#FFFFFF' : theme.isDark ? theme.gold.accent : '#997300',
                fontWeight: '700',
                marginLeft: 4,
              },
            ]}
          >
            {user?.role === 'admin' ? 'Foreman Mode' : 'Subscriber Mode'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Pay Overdue / Due Banner */}
      {nextChitDue && (
        <Card
          variant="goldAccent"
          style={[styles.dueBanner, { borderColor: theme.gold.accent + '60' }]}
        >
          <View style={styles.dueRow}>
            <View style={styles.dueIconWrapper}>
              <AlertCircle size={22} color={theme.maroon.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
                NEXT INSTALLMENT DUE
              </Text>
              <Text style={[typography.numericLarge, { color: theme.text.primary }]}>
                ₹{nextChitDue.installment_amount.toLocaleString('en-IN')}
              </Text>
              <Text style={[typography.caption, { color: theme.text.secondary }]}>
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

      {/* Financial Portfolio Summary */}
      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <Text style={[typography.caption, { color: theme.text.secondary }]}>Total Chit Value</Text>
          <Text style={[typography.displayMedium, { color: theme.maroon.primary, marginTop: 4 }]}>
            ₹{totalPortfolioValue.toLocaleString('en-IN')}
          </Text>
          <Text style={[typography.caption, { color: theme.text.muted, marginTop: 2 }]}>
            {activeChits.length} Active Subscription{activeChits.length > 1 ? 's' : ''}
          </Text>
        </Card>

        <Card style={styles.metricCard}>
          <Text style={[typography.caption, { color: theme.text.secondary }]}>Dividend Earned</Text>
          <Text style={[typography.displayMedium, { color: theme.semantic.success, marginTop: 4 }]}>
            ₹{totalDividendEarned.toLocaleString('en-IN')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <TrendingUp size={12} color={theme.semantic.success} />
            <Text style={[typography.caption, { color: theme.semantic.success, marginLeft: 4, fontWeight: '600' }]}>
              +14.2% Yield
            </Text>
          </View>
        </Card>
      </View>

      {/* Live Auction Banner */}
      {currentAuction && (
        <Card variant="elevated" style={[styles.auctionCard, { borderColor: theme.gold.accent }]}>
          <View style={styles.auctionHeader}>
            <View style={[styles.liveChip, { backgroundColor: theme.semantic.errorBg }]}>
              <View style={[styles.liveDot, { backgroundColor: theme.semantic.error }]} />
              <Text style={[typography.caption, { color: theme.semantic.error, fontWeight: '700' }]}>
                LIVE REVERSE AUCTION
              </Text>
            </View>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>
              Month {currentAuction.month_number} of 20
            </Text>
          </View>

          <Text style={[typography.h2, { color: theme.text.primary, marginTop: 8 }]}>
            {currentAuction.chit_group_name}
          </Text>

          <View style={styles.auctionDetailsRow}>
            <View>
              <Text style={[typography.caption, { color: theme.text.secondary }]}>Current Best Bid</Text>
              <Text style={[typography.numericLarge, { color: theme.maroon.primary }]}>
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
        <Text style={[typography.h2, { color: theme.text.primary }]}>Your Subscriptions</Text>
        <TouchableOpacity onPress={onNavigateToDiscovery} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
            Explore Chits
          </Text>
          <ChevronRight size={14} color={theme.maroon.primary} />
        </TouchableOpacity>
      </View>

      {activeChits.map((chit) => (
        <Card key={chit.id} style={styles.chitCard}>
          <View style={styles.chitCardTop}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h3, { color: theme.text.primary }]}>
                {chit.chit_group_name}
              </Text>
              <Text style={[typography.numericLarge, { color: theme.maroon.primary, marginTop: 2 }]}>
                ₹{chit.chit_amount.toLocaleString('en-IN')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => onNavigateToChitDetail(chit.chit_group_id)}
              style={[styles.arrowCircle, { backgroundColor: theme.surface.cardSubtle }]}
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={[typography.caption, { color: theme.text.secondary }]}>
                Installment Progress
              </Text>
              <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '600' }]}>
                {chit.installments_paid} of {chit.total_installments} Months
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
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  dueBanner: {
    marginBottom: 16,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueIconWrapper: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FAF3DC',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
  },
  auctionCard: {
    borderWidth: 1.5,
    marginBottom: 20,
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
    paddingVertical: 3,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  chitCard: {
    marginBottom: 14,
  },
  chitCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
});
