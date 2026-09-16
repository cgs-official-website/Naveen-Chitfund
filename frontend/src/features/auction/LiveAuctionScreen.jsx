import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../core/theme/ThemeProvider';
import { useBreakpoint } from '../../core/responsive/useBreakpoint';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import { BidDial } from '../../core/components/BidDial';
import { ReverseBidSlider } from '../../core/components/ReverseBidSlider';
import { useAppStore } from '../../store/useAppStore';
import {
  subscribeSocketStatus,
  getAuctionSocket,
  joinAuctionRoom,
  leaveAuctionRoom,
} from '../../core/networking/socketClient';
import {
  Wifi,
  WifiOff,
  Users,
  Clock,
  Send,
  TrendingDown,
  CheckCircle2,
  RefreshCw,
  Coins,
  Gavel,
  ShieldCheck,
  Award,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const LiveAuctionScreen = () => {
  const { theme, typography, isDark } = useTheme();
  const { isTablet } = useBreakpoint();
  const {
    currentAuction,
    submitBid,
    applyIncomingBid,
    closeCurrentAuction,
    fetchAuctionState,
  } = useAppStore();

  const [socketStatus, setSocketStatus] = useState('connected');
  const [remainingSeconds, setRemainingSeconds] = useState(
    currentAuction ? currentAuction.remaining_seconds : 120
  );
  const [selectedBidPct, setSelectedBidPct] = useState(
    currentAuction ? Math.min(40, Number((currentAuction.current_lowest_bid_pct + 0.5).toFixed(1))) : 23.0
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
    if (!currentAuction?.id) return;
    joinAuctionRoom(currentAuction.id);
    fetchAuctionState(currentAuction.id);

    const s = getAuctionSocket();
    const handleBidEvent = (data) => {
      if (data && (data.auctionId === currentAuction.id || !data.auctionId)) {
        applyIncomingBid(data);
      }
    };
    const handleCloseEvent = (data) => {
      if (data && (data.auctionId === currentAuction.id || !data.auctionId)) {
        closeCurrentAuction(data);
        setRemainingSeconds(0);
      }
    };

    s.on('bid_placed', handleBidEvent);
    s.on('auction:bid', handleBidEvent);
    s.on('auction_closed', handleCloseEvent);
    s.on('auction:closed', handleCloseEvent);

    return () => {
      s.off('bid_placed', handleBidEvent);
      s.off('auction:bid', handleBidEvent);
      s.off('auction_closed', handleCloseEvent);
      s.off('auction:closed', handleCloseEvent);
      leaveAuctionRoom(currentAuction.id);
    };
  }, [currentAuction?.id]);

  useEffect(() => {
    if (currentAuction?.current_lowest_bid_pct !== undefined) {
      setSelectedBidPct((prev) =>
        prev <= currentAuction.current_lowest_bid_pct
          ? Math.min(40, Number((currentAuction.current_lowest_bid_pct + 0.5).toFixed(1)))
          : prev
      );
    }
  }, [currentAuction?.current_lowest_bid_pct]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentAuction) {
    return (
      <View style={[styles.container, styles.emptyContainer, { backgroundColor: theme.surface.base }]}>
        <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
          <Gavel size={36} color="#D4AF37" />
        </View>
        <Text style={[typography.h2, { color: theme.text.primary, marginTop: 16, fontSize: 20 }]}>
          No Live Auction in Progress
        </Text>
        <Text style={[typography.bodyMedium, { color: theme.text.secondary, textAlign: 'center', marginTop: 6, maxWidth: 300, lineHeight: 20 }]}>
          Scheduled auctions open promptly on the 15th of every month at 05:30 PM for all registered group members.
        </Text>
        <View style={[styles.statutoryNotice, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.surface.border }]}>
          <ShieldCheck size={16} color="#D4AF37" />
          <Text style={[typography.caption, { color: theme.text.secondary, marginLeft: 8, flex: 1 }]}>
            Section 14 of Chit Funds Act 1982: Maximum statutory discount is capped at 40%.
          </Text>
        </View>
      </View>
    );
  }

  const handlePlaceBid = async () => {
    if (selectedBidPct <= currentAuction.current_lowest_bid_pct) {
      Alert.alert(
        'Invalid Bid',
        `Your discount bid must strictly exceed the current highest discount of ${currentAuction.current_lowest_bid_pct}%.`
      );
      return;
    }
    if (selectedBidPct > 40) {
      Alert.alert(
        'Statutory Cap Exceeded',
        'Under § 14 of the Chit Funds Act 1982, discount bids cannot exceed 40% of the chit value.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitBid(selectedBidPct);
      if (res?.success) {
        setBidSuccessMessage(`Bid of ${selectedBidPct.toFixed(1)}% submitted successfully!`);
        setTimeout(() => setBidSuccessMessage(null), 3000);
        setSelectedBidPct(Math.min(40, Number((selectedBidPct + 0.5).toFixed(1))));
      } else {
        Alert.alert('Bid Rejected', res?.error || 'Could not place bid');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred while placing bid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAuctionClosed = remainingSeconds === 0 || currentAuction.status === 'CLOSED';

  const renderAuctionControls = () => (
    <View style={styles.controlsCol}>
      {/* Reverse Bid Circular Dial Hero Card */}
      <View
        style={[
          styles.dialCard,
          {
            backgroundColor: theme.surface.card,
            borderColor: 'rgba(212, 175, 55, 0.35)',
            shadowColor: isDark ? '#000000' : '#38000C',
          },
        ]}
      >
        <View style={styles.dialHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Coins size={15} color="#D4AF37" />
            <Text style={[typography.caption, { color: '#D4AF37', fontWeight: '700', marginLeft: 6, letterSpacing: 1 }]}>
              {currentAuction.chit_group_name || 'LIVE REVERSE AUCTION'}
            </Text>
          </View>
          <View style={[styles.timerBadge, { backgroundColor: remainingSeconds <= 30 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(212, 175, 55, 0.15)' }]}>
            <Clock size={12} color={remainingSeconds <= 30 ? '#EF4444' : '#D4AF37'} />
            <Text style={[styles.timerText, { color: remainingSeconds <= 30 ? '#EF4444' : '#D4AF37' }]}>
              {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        </View>

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

        <View style={[styles.dialFooterGrid, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.surface.border }]}>
          <View style={styles.dialFooterItem}>
            <Text style={[typography.caption, { color: theme.text.secondary, fontSize: 10.5 }]}>Chit Value</Text>
            <Text style={[typography.numericMedium, { color: theme.text.primary, fontWeight: '700', marginTop: 2 }]}>
              ₹{currentAuction.chit_amount.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.dialFooterDivider} />
          <View style={styles.dialFooterItem}>
            <Text style={[typography.caption, { color: theme.text.secondary, fontSize: 10.5 }]}>Current Payout</Text>
            <Text style={[typography.numericMedium, { color: theme.maroon.primary, fontWeight: '700', marginTop: 2 }]}>
              ₹{(currentAuction.chit_amount * (1 - currentAuction.current_lowest_bid_pct / 100)).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.dialFooterDivider} />
          <View style={styles.dialFooterItem}>
            <Text style={[typography.caption, { color: theme.text.secondary, fontSize: 10.5 }]}>Per-Head Dividend</Text>
            <Text style={[typography.numericMedium, { color: theme.semantic.success, fontWeight: '700', marginTop: 2 }]}>
              ₹{(Math.floor((currentAuction.chit_amount * (currentAuction.current_lowest_bid_pct / 100) * 0.95) / (currentAuction.total_subscribers || 20))).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {bidSuccessMessage && (
        <View style={[styles.bidSuccessBanner, { backgroundColor: theme.semantic.successBg, borderColor: theme.semantic.success }]}>
          <CheckCircle2 size={16} color={theme.semantic.success} />
          <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700', marginLeft: 8 }]}>
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
            style={{ marginTop: 16 }}
          />
        </View>
      ) : (
        <Card variant="goldAccent" style={[styles.closedCard, { marginTop: 16 }]}>
          <View style={[styles.closedIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.18)' }]}>
            <Award size={32} color="#D4AF37" />
          </View>
          <Text style={[typography.h2, { color: theme.text.primary, marginTop: 10 }]}>
            Auction Concluded
          </Text>
          <Text style={[typography.bodyMedium, { color: theme.text.secondary, textAlign: 'center', marginTop: 4, lineHeight: 19 }]}>
            Winning Bid: {currentAuction.current_lowest_bid_pct}% discount. Winner transitioned to Successful Bidder (SB) awaiting statutory sureties (§ 31).
          </Text>
        </Card>
      )}
    </View>
  );

  const renderBidFeed = () => (
    <Card style={[styles.feedCard, isTablet && { flex: 1, height: '100%' }]}>
      <View style={styles.feedHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TrendingDown size={18} color={theme.maroon.primary} />
          <Text style={[typography.h3, { color: theme.text.primary, marginLeft: 8, fontWeight: '700' }]}>
            Live Bids Activity
          </Text>
        </View>
        <View style={[styles.feedCountBadge, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#D4AF37' }}>
            {currentAuction.bids.length} {currentAuction.bids.length === 1 ? 'Bid' : 'Bids'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.feedList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {currentAuction.bids.length === 0 ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Clock size={24} color={theme.text.muted} />
            <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 8 }]}>
              Waiting for opening bids...
            </Text>
          </View>
        ) : (
          currentAuction.bids.map((bid) => (
            <View
              key={bid.id}
              style={[
                styles.bidRow,
                {
                  backgroundColor: bid.is_self ? 'rgba(56, 0, 12, 0.08)' : theme.surface.cardSubtle,
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
                      <Text style={[typography.caption, { color: '#FFF', fontSize: 9, fontWeight: '800' }]}>YOU</Text>
                    </View>
                  )}
                </View>
                <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2, fontSize: 11 }]}>
                  {bid.timestamp} · Payout ₹{(currentAuction.chit_amount - bid.discount_amount).toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[typography.numericMedium, { color: theme.maroon.primary, fontWeight: '800', fontSize: 16 }]}>
                  {bid.bid_pct.toFixed(1)}%
                </Text>
                <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10.5, marginTop: 1 }]}>
                  -₹{bid.discount_amount.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Card>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top Status Bar ── */}
      <View style={[styles.topBar, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}>
        <View style={styles.statusGroup}>
          {socketStatus === 'connected' ? (
            <View style={styles.statusBadgeLive}>
              <View style={styles.livePulseDot} />
              <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700', marginLeft: 6 }]}>
                WebSocket Live
              </Text>
            </View>
          ) : socketStatus === 'reconnecting' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <RefreshCw size={14} color={theme.semantic.warning} />
              <Text style={[typography.caption, { color: theme.semantic.warning, fontWeight: '700', marginLeft: 5 }]}>
                Reconnecting…
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <WifiOff size={14} color={theme.semantic.error} />
              <Text style={[typography.caption, { color: theme.semantic.error, fontWeight: '700', marginLeft: 5 }]}>
                Disconnected
              </Text>
            </View>
          )}
        </View>

        <View style={styles.quorumBadge}>
          <Users size={14} color={theme.maroon.primary} />
          <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700', marginLeft: 5 }]}>
            {currentAuction.present_subscribers} in Room (Quorum Met)
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
    padding: 16,
    paddingBottom: 100, // Clearance for floating tab bar
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    minHeight: 400,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statutoryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
    maxWidth: 340,
  },

  // ── Top Status Bar ──
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeLive: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  quorumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ── Dial Card ──
  dialCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  dialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  dialWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  dialFooterGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
  },
  dialFooterItem: {
    flex: 1,
    alignItems: 'center',
  },
  dialFooterDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },

  bidSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  controlsCol: {
    width: '100%',
  },
  closedCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
  },
  closedIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Bid Feed ──
  feedCard: {
    padding: 16,
    borderRadius: 16,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  feedCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  feedList: {
    maxHeight: 340,
  },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  selfTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
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
