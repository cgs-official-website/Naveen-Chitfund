import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../../core/theme/ThemeProvider';
import { useBreakpoint } from '../../core/responsive/useBreakpoint';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import { BidDial } from '../../core/components/BidDial';
import { ReverseBidSlider } from '../../core/components/ReverseBidSlider';
import { useAppStore } from '../../store/useAppStore';
import { subscribeSocketStatus } from '../../core/networking/socketClient';
import {
  Wifi,
  WifiOff,
  Users,
  Clock,
  Send,
  TrendingDown,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react-native';

export const LiveAuctionScreen = () => {
  const { theme, typography } = useTheme();
  const { isTablet } = useBreakpoint();
  const { currentAuction, submitBid } = useAppStore();

  const [socketStatus, setSocketStatus] = useState('connected');
  const [remainingSeconds, setRemainingSeconds] = useState(
    currentAuction ? currentAuction.remaining_seconds : 60
  );
  const [selectedBidPct, setSelectedBidPct] = useState(
    currentAuction ? currentAuction.current_lowest_bid_pct + 0.5 : 23.0
  );
  const [bidSuccessMessage, setBidSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeSocketStatus((status) => {
      setSocketStatus(status);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentAuction) {
    return (
      <View style={[styles.container, styles.emptyContainer, { backgroundColor: theme.surface.base }]}>
        <Clock size={48} color={theme.text.muted} />
        <Text style={[typography.h2, { color: theme.text.primary, marginTop: 12 }]}>
          No Live Auction in Progress
        </Text>
        <Text style={[typography.bodyMedium, { color: theme.text.secondary, textAlign: 'center', marginTop: 6 }]}>
          Auctions open promptly on the 15th of every month at 05:30 PM.
        </Text>
      </View>
    );
  }

  const handlePlaceBid = () => {
    if (selectedBidPct <= currentAuction.current_lowest_bid_pct) {
      Alert.alert(
        'Invalid Bid',
        `Your discount bid must exceed the current lowest bid of ${currentAuction.current_lowest_bid_pct}%.`
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const success = submitBid(selectedBidPct);
      if (success) {
        setBidSuccessMessage(`Bid of ${selectedBidPct}% submitted successfully!`);
        setTimeout(() => setBidSuccessMessage(null), 3000);
        setSelectedBidPct(Number((selectedBidPct + 0.5).toFixed(1)));
      }
    }, 300);
  };

  const isAuctionClosed = remainingSeconds === 0;

  const renderAuctionControls = () => (
    <View style={styles.controlsCol}>
      <View style={styles.dialWrapper}>
        <BidDial
          size={isTablet ? 320 : 270}
          totalDurationSeconds={120}
          remainingSeconds={remainingSeconds}
          currentLowestBidPct={currentAuction.current_lowest_bid_pct}
          chitAmount={currentAuction.chit_amount}
          statusText={isAuctionClosed ? 'AUCTION CLOSED' : 'REVERSE BID DIAL'}
        />
      </View>

      {bidSuccessMessage && (
        <View style={[styles.bidSuccessBanner, { backgroundColor: theme.semantic.successBg, borderColor: theme.semantic.success }]}>
          <CheckCircle2 size={16} color={theme.semantic.success} />
          <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700', marginLeft: 6 }]}>
            {bidSuccessMessage}
          </Text>
        </View>
      )}

      {!isAuctionClosed ? (
        <View style={{ marginTop: 16 }}>
          <ReverseBidSlider
            currentLowestBidPct={currentAuction.current_lowest_bid_pct}
            selectedBidPct={selectedBidPct}
            onBidChange={setSelectedBidPct}
            chitAmount={currentAuction.chit_amount}
            totalSubscribers={currentAuction.total_subscribers}
          />

          <Button
            title={`Submit Bid of ${selectedBidPct.toFixed(1)}%`}
            variant="primary"
            icon={<Send size={18} color="#FFFFFF" />}
            onPress={handlePlaceBid}
            loading={isSubmitting}
            style={{ marginTop: 14 }}
          />
        </View>
      ) : (
        <Card variant="goldAccent" style={[styles.closedCard, { marginTop: 16 }]}>
          <CheckCircle2 size={32} color={theme.gold.accent} />
          <Text style={[typography.h2, { color: theme.text.primary, marginTop: 8 }]}>
            Auction Concluded
          </Text>
          <Text style={[typography.bodyMedium, { color: theme.text.secondary, textAlign: 'center', marginTop: 4 }]}>
            Winning Bid: {currentAuction.current_lowest_bid_pct}% discount by Ticket #07. Proceed to Surety & Prize Disbursal.
          </Text>
        </Card>
      )}
    </View>
  );

  const renderBidFeed = () => (
    <Card style={[styles.feedCard, isTablet && { flex: 1, height: '100%' }]}>
      <View style={styles.feedHeader}>
        <TrendingDown size={18} color={theme.maroon.primary} />
        <Text style={[typography.h3, { color: theme.text.primary, marginLeft: 8 }]}>
          Live Bidding Feed ({currentAuction.bids.length})
        </Text>
      </View>

      <ScrollView style={styles.feedList} nestedScrollEnabled>
        {currentAuction.bids.map((bid) => (
          <View
            key={bid.id}
            style={[
              styles.bidRow,
              {
                backgroundColor: bid.is_self ? theme.maroon.primary + '15' : theme.surface.cardSubtle,
                borderColor: bid.is_self ? theme.maroon.primary : theme.surface.border,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '700' }]}>
                  {bid.bidder_name}
                </Text>
                {bid.is_self && (
                  <View style={[styles.selfTag, { backgroundColor: theme.maroon.primary }]}>
                    <Text style={[typography.caption, { color: '#FFF', fontSize: 9, fontWeight: '700' }]}>YOU</Text>
                  </View>
                )}
              </View>
              <Text style={[typography.caption, { color: theme.text.secondary }]}>
                {bid.timestamp} · Payout ₹{(currentAuction.chit_amount - bid.discount_amount).toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[typography.numericMedium, { color: theme.maroon.primary, fontWeight: '700' }]}>
                {bid.bid_pct.toFixed(1)}%
              </Text>
              <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10 }]}>
                -₹{bid.discount_amount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Card>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.topBar, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}>
        <View style={styles.statusGroup}>
          {socketStatus === 'connected' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Wifi size={14} color={theme.semantic.success} />
              <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700', marginLeft: 4 }]}>
                WebSocket Live
              </Text>
            </View>
          ) : socketStatus === 'reconnecting' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <RefreshCw size={14} color={theme.semantic.warning} />
              <Text style={[typography.caption, { color: theme.semantic.warning, fontWeight: '700', marginLeft: 4 }]}>
                Reconnecting…
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <WifiOff size={14} color={theme.semantic.error} />
              <Text style={[typography.caption, { color: theme.semantic.error, fontWeight: '700', marginLeft: 4 }]}>
                Disconnected
              </Text>
            </View>
          )}
        </View>

        <View style={styles.quorumBadge}>
          <Users size={14} color={theme.maroon.primary} />
          <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700', marginLeft: 4 }]}>
            Quorum: {currentAuction.present_subscribers} Present (Min 2 required)
          </Text>
        </View>
      </View>

      {isTablet ? (
        <View style={styles.tabletLayout}>
          <View style={styles.tabletLeftPane}>{renderAuctionControls()}</View>
          <View style={styles.tabletRightPane}>{renderBidFeed()}</View>
        </View>
      ) : (
        <View style={styles.phoneLayout}>
          {renderAuctionControls()}
          <View style={{ marginTop: 20 }}>{renderBidFeed()}</View>
        </View>
      )}
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quorumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dialWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  bidSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  controlsCol: {
    width: '100%',
  },
  closedCard: {
    alignItems: 'center',
    padding: 20,
  },
  feedCard: {
    padding: 14,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedList: {
    maxHeight: 340,
  },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  selfTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  tabletLayout: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  tabletLeftPane: {
    flex: 1.2,
  },
  tabletRightPane: {
    flex: 1,
  },
  phoneLayout: {
    width: '100%',
  },
});
