import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../core/theme/ThemeProvider';
import { useBreakpoint } from '../../core/responsive/useBreakpoint';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import { Alert } from '../../core/components/CustomAlertModal';
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
  History as HistoryIcon,
  Ticket as TicketIcon,
  X,
  Calendar,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const LiveAuctionScreen = () => {
  const { theme, typography, isDark } = useTheme();
  const { isTablet } = useBreakpoint();
  const {
    currentAuction,
    activeTicket,
    activeTicketLoading,
    applyForAuctionTicket,
    claimAuctionTicket,
    fetchMyAuctionTicket,
    submitBid,
    applyIncomingBid,
    closeCurrentAuction,
    fetchAuctionState,
    fetchCurrentAuction,
    userAuctionHistory,
    userAuctionHistoryLoading,
    fetchUserAuctionHistory,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'history'
  const [socketStatus, setSocketStatus] = useState('connected');
  const [ticketError, setTicketError] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(
    currentAuction ? currentAuction.remaining_seconds : 120
  );
  const [selectedBidPct, setSelectedBidPct] = useState(
    currentAuction ? Math.min(40, Number((currentAuction.current_lowest_bid_pct + 0.5).toFixed(1))) : 23.0
  );
  const [bidSuccessMessage, setBidSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCurrentAuction();
  }, [fetchCurrentAuction]);

  useEffect(() => {
    if (currentAuction?.id) {
      fetchMyAuctionTicket(currentAuction.id);
    }
  }, [currentAuction?.id, fetchMyAuctionTicket]);

  useEffect(() => {
    if (currentAuction) {
      if (currentAuction.remaining_seconds !== undefined) {
        setRemainingSeconds(currentAuction.remaining_seconds);
      }
      if (currentAuction.current_lowest_bid_pct !== undefined) {
        setSelectedBidPct(
          Math.min(40, Number((currentAuction.current_lowest_bid_pct + 0.5).toFixed(1)))
        );
      }
    }
  }, [currentAuction?.id]);

  useEffect(() => {
    const unsubscribe = subscribeSocketStatus((status) => {
      setSocketStatus(status);
    });

    const s = getAuctionSocket();
    const handleGlobalStart = () => {
      fetchCurrentAuction();
    };

    s.on('auction_started', handleGlobalStart);
    s.on('auction:started', handleGlobalStart);

    return () => {
      unsubscribe();
      s.off('auction_started', handleGlobalStart);
      s.off('auction:started', handleGlobalStart);
    };
  }, [fetchCurrentAuction]);

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

    const handleStartEvent = () => {
      fetchCurrentAuction();
      fetchAuctionState(currentAuction.id);
    };

    const handleTicketApproved = (data) => {
      if (data && data.auctionId === currentAuction.id) {
        fetchMyAuctionTicket(currentAuction.id);
      }
    };
    const handleTicketRejected = (data) => {
      if (data && data.auctionId === currentAuction.id) {
        fetchMyAuctionTicket(currentAuction.id);
      }
    };

    s.on('bid_placed', handleBidEvent);
    s.on('auction:bid', handleBidEvent);
    s.on('auction_closed', handleCloseEvent);
    s.on('auction:closed', handleCloseEvent);
    s.on('auction_started', handleStartEvent);
    s.on('auction:started', handleStartEvent);
    s.on('auction:ticket_approved', handleTicketApproved);
    s.on('auction:ticket_rejected', handleTicketRejected);

    return () => {
      s.off('bid_placed', handleBidEvent);
      s.off('auction:bid', handleBidEvent);
      s.off('auction_closed', handleCloseEvent);
      s.off('auction:closed', handleCloseEvent);
      s.off('auction_started', handleStartEvent);
      s.off('auction:started', handleStartEvent);
      s.off('auction:ticket_approved', handleTicketApproved);
      s.off('auction:ticket_rejected', handleTicketRejected);
      leaveAuctionRoom(currentAuction.id);
    };
  }, [currentAuction?.id, fetchMyAuctionTicket]);

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

  if (!currentAuction && activeTab !== 'history') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.surface.base }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.tabBarContainer, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('live')}
            style={[styles.tabButton, activeTab === 'live' && { backgroundColor: theme.maroon.primary }]}
          >
            <Gavel size={14} color={activeTab === 'live' ? '#FFFFFF' : theme.text.secondary} />
            <Text style={[typography.caption, { color: activeTab === 'live' ? '#FFFFFF' : theme.text.secondary, fontWeight: '700', marginLeft: 6 }]}>
              Live Auction
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('history');
              fetchUserAuctionHistory();
            }}
            style={[styles.tabButton, activeTab === 'history' && { backgroundColor: theme.maroon.primary }]}
          >
            <HistoryIcon size={14} color={activeTab === 'history' ? '#FFFFFF' : theme.text.secondary} />
            <Text style={[typography.caption, { color: activeTab === 'history' ? '#FFFFFF' : theme.text.secondary, fontWeight: '700', marginLeft: 6 }]}>
              My Ticket History
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.emptyContainer, { backgroundColor: theme.surface.base }]}>
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
      </ScrollView>
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

        {/* Active Ticket Status Badge / Application Banner */}
        {activeTicket?.status === 'ACTIVE' ? (
          <View style={{ marginHorizontal: 16, marginTop: 10, padding: 8, borderRadius: 10, backgroundColor: 'rgba(212, 175, 55, 0.12)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.35)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ShieldCheck size={14} color="#D4AF37" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#D4AF37', marginLeft: 6 }}>
                Active Bidding Ticket: {activeTicket.ticket_code}
              </Text>
            </View>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981', textTransform: 'uppercase' }}>
              AUTHORIZED
            </Text>
          </View>
        ) : activeTicket?.status === 'APPLIED' || activeTicket?.status === 'PENDING' ? (
          <View style={{ marginHorizontal: 16, marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: 'rgba(245, 158, 11, 0.12)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)', flexDirection: 'row', alignItems: 'center' }}>
            <Clock size={16} color="#F59E0B" />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#F59E0B' }}>
                Application Under Review by Superadmin
              </Text>
              <Text style={{ fontSize: 10, color: theme.text.secondary, marginTop: 2 }}>
                Your request is submitted. Ticket & bidding access will unlock automatically upon Foreman approval.
              </Text>
            </View>
          </View>
        ) : activeTicket?.status === 'REJECTED' ? (
          <View style={{ marginHorizontal: 16, marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.12)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#EF4444' }}>
              ⛔ Participation Access Denied
            </Text>
            <Text style={{ fontSize: 10, color: theme.text.secondary, marginTop: 2 }}>
              {activeTicket.revocation_reason || 'Application was not approved for this auction session.'}
            </Text>
          </View>
        ) : (
          <View style={{ marginHorizontal: 16, marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: 'rgba(212, 175, 55, 0.08)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#D4AF37' }}>
                Auction Participation Permit Required
              </Text>
              <Text style={{ fontSize: 10, color: theme.text.secondary, marginTop: 1 }}>
                Submit an application to receive an authorized bidding ticket.
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                setTicketError(null);
                const res = await applyForAuctionTicket(currentAuction.id);
                if (!res.success) {
                  Alert.alert('Application Failed', res.error || 'Could not apply');
                }
              }}
              disabled={activeTicketLoading}
              style={{ backgroundColor: '#D4AF37', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#1B0813' }}>
                {activeTicketLoading ? 'Applying...' : 'Apply Now'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {ticketError ? (
          <View style={{ marginHorizontal: 16, marginTop: 8, padding: 8, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.12)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.35)' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#EF4444' }}>
              ⚠️ {ticketError}
            </Text>
          </View>
        ) : null}

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
        activeTicket?.status === 'ACTIVE' ? (
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
            <View style={[styles.closedIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
              <ShieldCheck size={28} color="#D4AF37" />
            </View>
            <Text style={[typography.h3, { color: theme.text.primary, marginTop: 8, fontWeight: '700' }]}>
              {activeTicket?.status === 'APPLIED' || activeTicket?.status === 'PENDING'
                ? 'Awaiting Superadmin Authorization'
                : 'Ticket Required to Place Bids'}
            </Text>
            <Text style={[typography.caption, { color: theme.text.secondary, textAlign: 'center', marginTop: 4, lineHeight: 18, maxWidth: 300 }]}>
              {activeTicket?.status === 'APPLIED' || activeTicket?.status === 'PENDING'
                ? 'Your ticket application is pending Foreman verification. Bidding sliders will unlock as soon as your access is approved.'
                : 'Under platform security protocol, only subscribers approved by the Superadmin are granted bidding access.'}
            </Text>
          </Card>
        )
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

  const renderHistoryFeed = () => (
    <Card style={[styles.feedCard, { marginTop: 12 }]}>
      <View style={styles.feedHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <HistoryIcon size={18} color={theme.maroon.primary} />
          <Text style={[typography.h3, { color: theme.text.primary, marginLeft: 8, fontWeight: '700' }]}>
            My Auction & Ticket History
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => fetchUserAuctionHistory()}
          disabled={userAuctionHistoryLoading}
          style={{ padding: 4 }}
        >
          <RefreshCw size={15} color={theme.text.secondary} />
        </TouchableOpacity>
      </View>

      {userAuctionHistoryLoading ? (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <Text style={[typography.caption, { color: theme.text.secondary }]}>Loading your auction history...</Text>
        </View>
      ) : userAuctionHistory.length === 0 ? (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <TicketIcon size={32} color={theme.text.muted} />
          <Text style={[typography.bodyMedium, { color: theme.text.primary, marginTop: 10, fontWeight: '600' }]}>
            No Participation History Yet
          </Text>
          <Text style={[typography.caption, { color: theme.text.secondary, textAlign: 'center', marginTop: 4, maxWidth: 280 }]}>
            Tickets issued to you for auctions will appear here with participation and winning status.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.feedList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {userAuctionHistory.map((item) => {
            const isWinner = item.is_winner;
            const statusColor =
              item.ticket_status === 'ACTIVE'
                ? '#10B981'
                : item.ticket_status === 'USED'
                ? '#D4AF37'
                : item.ticket_status === 'EXPIRED'
                ? '#64748B'
                : '#EF4444';

            return (
              <View
                key={item.ticket_id}
                style={[
                  styles.historyRow,
                  {
                    backgroundColor: isWinner ? 'rgba(212, 175, 55, 0.08)' : theme.surface.cardSubtle,
                    borderColor: isWinner ? 'rgba(212, 175, 55, 0.4)' : theme.surface.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '700' }]}>
                      {item.group_name}
                    </Text>
                    {isWinner && (
                      <View style={[styles.winnerBadge, { backgroundColor: '#D4AF37' }]}>
                        <Award size={10} color="#000" />
                        <Text style={{ fontSize: 9, fontWeight: '800', color: '#000', marginLeft: 3 }}>
                          WINNER
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <TicketIcon size={12} color={theme.text.muted} />
                    <Text style={[typography.caption, { color: theme.text.secondary, marginLeft: 4, fontSize: 11, fontFamily: 'monospace' }]}>
                      {item.ticket_code}
                    </Text>
                    <Text style={[typography.caption, { color: theme.text.muted, marginLeft: 8, fontSize: 11 }]}>
                      Month {item.month_number}
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[styles.ticketStatusTag, { borderColor: statusColor, backgroundColor: `${statusColor}15` }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor }}>
                      {item.ticket_status}
                    </Text>
                  </View>
                  {item.winning_bid_pct !== null && (
                    <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10.5, marginTop: 4 }]}>
                      Winning: {Number(item.winning_bid_pct).toFixed(1)}%
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </Card>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Segment Tab Switcher ── */}
      <View style={[styles.tabBarContainer, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('live')}
          style={[
            styles.tabButton,
            activeTab === 'live' && { backgroundColor: theme.maroon.primary },
          ]}
        >
          <Gavel size={14} color={activeTab === 'live' ? '#FFFFFF' : theme.text.secondary} />
          <Text
            style={[
              typography.caption,
              {
                color: activeTab === 'live' ? '#FFFFFF' : theme.text.secondary,
                fontWeight: '700',
                marginLeft: 6,
              },
            ]}
          >
            Live Auction
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('history');
            fetchUserAuctionHistory();
          }}
          style={[
            styles.tabButton,
            activeTab === 'history' && { backgroundColor: theme.maroon.primary },
          ]}
        >
          <HistoryIcon size={14} color={activeTab === 'history' ? '#FFFFFF' : theme.text.secondary} />
          <Text
            style={[
              typography.caption,
              {
                color: activeTab === 'history' ? '#FFFFFF' : theme.text.secondary,
                fontWeight: '700',
                marginLeft: 6,
              },
            ]}
          >
            My Ticket History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'history' ? (
        renderHistoryFeed()
      ) : (
        <>
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
        </>
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

  // ── Segment Tab Switcher ──
  tabBarContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },

  // ── Ticket History Feed ──
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  ticketStatusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
});

