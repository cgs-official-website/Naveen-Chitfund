import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../core/theme/ThemeProvider';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import { Input } from '../../core/components/Input';
import { TransparencyBadge } from '../../core/components/TransparencyBadge';
import { useAppStore } from '../../store/useAppStore';
import {
  Search,
  Calendar,
  CheckCircle,
  X,
  RefreshCw,
  FolderOpen,
  Coins,
  ShieldCheck,
  TrendingUp,
  Award,
  ChevronRight,
  Clock,
  Building,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const ChitDiscoveryScreen = ({
  onSelectGroup,
  onOpenDocs,
}) => {
  const { theme, typography, isDark } = useTheme();
  const { availableGroups, availableGroupsLoading, fetchAvailableGroups, joinChitGroup } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedTenure, setSelectedTenure] = useState('ALL');
  const [onlyVacant, setOnlyVacant] = useState(false);

  const [selectedGroupToJoin, setSelectedGroupToJoin] = useState(null);
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    fetchAvailableGroups();
  }, []);

  const filteredGroups = (availableGroups || []).filter((g) => {
    const nameStr = (g.name || '').toLowerCase();
    const stateStr = (g.registrar_state_code || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || nameStr.includes(q) || stateStr.includes(q);
    const matchesState =
      selectedState === 'ALL' || (g.registrar_state_code || '').includes(selectedState);
    const matchesTenure =
      selectedTenure === 'ALL' || String(g.duration_months) === selectedTenure;
    const matchesVacant = !onlyVacant || (g.vacant_slots === undefined ? true : g.vacant_slots > 0);

    return matchesSearch && matchesState && matchesTenure && matchesVacant;
  });

  const handleConfirmJoin = async (group) => {
    setJoinLoading(true);
    const res = await joinChitGroup(group);
    setJoinLoading(false);
    if (res.success) {
      setJoinedSuccess(true);
      setTimeout(() => {
        setJoinedSuccess(false);
        setSelectedGroupToJoin(null);
      }, 1200);
    } else {
      Alert.alert('Unable to Join', res.error || 'Failed to join chit group. Please check KYC status.');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={availableGroupsLoading}
          onRefresh={fetchAvailableGroups}
          colors={[theme.maroon.primary]}
          tintColor={theme.maroon.primary}
        />
      }
    >
      {/* ── Screen Hero Banner ── */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: isDark ? '#26020A' : '#3E000F',
            borderColor: 'rgba(212, 175, 55, 0.4)',
          },
        ]}
      >
        <View style={styles.heroDecorTop} />
        <View style={styles.heroDecorBottom} />

        <View style={styles.heroHeaderRow}>
          <View style={styles.regBadge}>
            <Coins size={13} color="#D4AF37" />
            <Text style={styles.heroPreTitle}>GOVT. REGULATED CHITS</Text>
          </View>
          <View style={styles.safeBadge}>
            <ShieldCheck size={12} color="#D4AF37" />
            <Text style={styles.safeBadgeText}>100% Secured</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Explore Chit Groups</Text>
        <Text style={styles.heroSubtitle}>
          Compare chit funds, review registrar security deposits, and subscribe directly with instant digital allocation.
        </Text>

        <View style={styles.heroFeatureRow}>
          <View style={styles.heroFeatureCapsule}>
            <Award size={12} color="#D4AF37" />
            <Text style={styles.heroFeatureText} numberOfLines={1}>Sec 4 PSO</Text>
          </View>
          <View style={styles.heroFeatureCapsule}>
            <TrendingUp size={12} color="#4ADE80" />
            <Text style={styles.heroFeatureText} numberOfLines={1}>12-18% Yield</Text>
          </View>
          <View style={styles.heroFeatureCapsule}>
            <Clock size={12} color="#E8D48B" />
            <Text style={styles.heroFeatureText} numberOfLines={1}>Monthly Bids</Text>
          </View>
        </View>
      </View>

      {/* ── Search Bar with Input Component ── */}
      <Input
        placeholder="Search series, PSO number, or registrar..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftIcon={Search}
        clearable
        containerStyle={{ marginBottom: 12 }}
      />

      {/* ── Filter Pills Bar ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        <TouchableOpacity
          onPress={() => setOnlyVacant(!onlyVacant)}
          activeOpacity={0.7}
          style={[
            styles.filterPill,
            {
              backgroundColor: onlyVacant ? theme.gold.accent : theme.surface.cardSubtle,
              borderColor: onlyVacant ? theme.gold.accent : theme.surface.border,
            },
          ]}
        >
          <Coins size={13} color={onlyVacant ? '#1A000A' : theme.gold.accent} />
          <Text
            style={[
              typography.caption,
              {
                color: onlyVacant ? '#1A000A' : theme.text.primary,
                fontWeight: '700',
                marginLeft: 5,
              },
            ]}
          >
            Vacant Slots Only
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedState(selectedState === 'Telangana' ? 'ALL' : 'Telangana')}
          activeOpacity={0.7}
          style={[
            styles.filterPill,
            {
              backgroundColor: selectedState === 'Telangana' ? theme.maroon.primary : theme.surface.cardSubtle,
              borderColor: selectedState === 'Telangana' ? theme.maroon.primary : theme.surface.border,
            },
          ]}
        >
          <Building size={13} color={selectedState === 'Telangana' ? '#FFFFFF' : theme.text.secondary} />
          <Text
            style={[
              typography.caption,
              {
                color: selectedState === 'Telangana' ? '#FFFFFF' : theme.text.primary,
                fontWeight: '600',
                marginLeft: 5,
              },
            ]}
          >
            Telangana (T-Chits)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedState(selectedState === 'Andhra' ? 'ALL' : 'Andhra')}
          activeOpacity={0.7}
          style={[
            styles.filterPill,
            {
              backgroundColor: selectedState === 'Andhra' ? theme.maroon.primary : theme.surface.cardSubtle,
              borderColor: selectedState === 'Andhra' ? theme.maroon.primary : theme.surface.border,
            },
          ]}
        >
          <Building size={13} color={selectedState === 'Andhra' ? '#FFFFFF' : theme.text.secondary} />
          <Text
            style={[
              typography.caption,
              {
                color: selectedState === 'Andhra' ? '#FFFFFF' : theme.text.primary,
                fontWeight: '600',
                marginLeft: 5,
              },
            ]}
          >
            Andhra Pradesh
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedTenure(selectedTenure === '20' ? 'ALL' : '20')}
          activeOpacity={0.7}
          style={[
            styles.filterPill,
            {
              backgroundColor: selectedTenure === '20' ? theme.maroon.primary : theme.surface.cardSubtle,
              borderColor: selectedTenure === '20' ? theme.maroon.primary : theme.surface.border,
            },
          ]}
        >
          <Calendar size={13} color={selectedTenure === '20' ? '#FFFFFF' : theme.text.secondary} />
          <Text
            style={[
              typography.caption,
              {
                color: selectedTenure === '20' ? '#FFFFFF' : theme.text.primary,
                fontWeight: '600',
                marginLeft: 5,
              },
            ]}
          >
            20 Months
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedTenure(selectedTenure === '25' ? 'ALL' : '25')}
          activeOpacity={0.7}
          style={[
            styles.filterPill,
            {
              backgroundColor: selectedTenure === '25' ? theme.maroon.primary : theme.surface.cardSubtle,
              borderColor: selectedTenure === '25' ? theme.maroon.primary : theme.surface.border,
            },
          ]}
        >
          <Calendar size={13} color={selectedTenure === '25' ? '#FFFFFF' : theme.text.secondary} />
          <Text
            style={[
              typography.caption,
              {
                color: selectedTenure === '25' ? '#FFFFFF' : theme.text.primary,
                fontWeight: '600',
                marginLeft: 5,
              },
            ]}
          >
            25 Months
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Results Header ── */}
      <View style={styles.resultsHeader}>
        <Text style={[typography.caption, { color: theme.text.secondary, fontWeight: '600' }]}>
          Showing {filteredGroups.length} Verified {filteredGroups.length === 1 ? 'Group' : 'Groups'}
        </Text>
        {(selectedState !== 'ALL' || selectedTenure !== 'ALL' || onlyVacant || searchQuery) && (
          <TouchableOpacity
            onPress={() => {
              setSelectedState('ALL');
              setSelectedTenure('ALL');
              setOnlyVacant(false);
              setSearchQuery('');
            }}
          >
            <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
              Clear Filters
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Chit Group Cards ── */}
      <View style={{ marginTop: 8 }}>
        {filteredGroups.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
              <Coins size={32} color="#D4AF37" />
            </View>
            <Text style={[typography.h3, { color: theme.text.primary, marginTop: 14 }]}>
              No Chit Groups Found
            </Text>
            <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 6, textAlign: 'center', lineHeight: 18 }]}>
              Try adjusting your search query or reset filter options to view all available government-registered groups.
            </Text>
            <Button
              title="Reset All Filters"
              variant="outline"
              size="sm"
              onPress={() => {
                setSelectedState('ALL');
                setSelectedTenure('ALL');
                setOnlyVacant(false);
                setSearchQuery('');
              }}
              style={{ marginTop: 16 }}
            />
          </Card>
        ) : (
          filteredGroups.map((group) => (
            <Card key={group.id} style={styles.groupCard}>
              {/* Vacant Slot Gold Ribbon */}
              {group.vacant_slots > 0 && (
                <View
                  style={[
                    styles.vacantHeader,
                    {
                      backgroundColor: 'rgba(212, 175, 55, 0.15)',
                      borderColor: 'rgba(212, 175, 55, 0.45)',
                    },
                  ]}
                >
                  <Coins size={12} color="#D4AF37" />
                  <Text style={styles.vacantHeaderText}>
                    {group.vacant_slots} VACANT SLOT{group.vacant_slots > 1 ? 'S' : ''} · IMMEDIATE BIDDING
                  </Text>
                </View>
              )}

              {/* Title & Valuation */}
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h3, { color: theme.text.primary, fontWeight: '700', fontSize: 17 }]}>
                    {group.name}
                  </Text>
                  <Text style={[typography.displayLarge, { color: theme.maroon.primary, marginTop: 4, fontSize: 24 }]}>
                    ₹{group.chit_amount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.tenureBadge,
                    {
                      backgroundColor: 'rgba(212, 175, 55, 0.12)',
                      borderColor: 'rgba(212, 175, 55, 0.35)',
                    },
                  ]}
                >
                  <Calendar size={13} color="#D4AF37" />
                  <Text style={styles.tenureBadgeText}>
                    {group.duration_months} Months
                  </Text>
                </View>
              </View>

              {/* Stats Grid */}
              <View style={[styles.statsGrid, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.surface.border }]}>
                <View style={styles.statCell}>
                  <Text style={[typography.caption, { color: theme.text.secondary, fontSize: 10.5 }]}>Monthly Due</Text>
                  <Text style={[typography.numericMedium, { color: theme.text.primary, fontWeight: '700', fontSize: 15, marginTop: 2 }]}>
                    ₹{group.installment_amount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={[typography.caption, { color: theme.text.secondary, fontSize: 10.5 }]}>Dividend Policy</Text>
                  <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700', marginTop: 2 }]}>
                    {group.dividend_distribution_policy === 'NON_PRIZED_ONLY' ? 'Non-Prized' : 'All Members'}
                  </Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={[typography.caption, { color: theme.text.secondary, fontSize: 10.5 }]}>Security</Text>
                  <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700', marginTop: 2 }]}>
                    {group.security_instrument}
                  </Text>
                </View>
              </View>

              {/* State Transparency Badge */}
              <TransparencyBadge
                registrarState={group.registrar_state_code}
                onPressDocs={() => onOpenDocs(group.name)}
                style={{ marginTop: 12 }}
              />

              {/* Past Dividends Chips */}
              {group.past_dividends && group.past_dividends.length > 0 && (
                <View style={[styles.dividendBox, { borderColor: theme.surface.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TrendingUp size={12} color={theme.semantic.success} />
                    <Text style={[typography.caption, { color: theme.text.secondary, marginLeft: 5, fontSize: 11 }]}>
                      Past Auction Dividends:
                    </Text>
                  </View>
                  <View style={styles.dividendChipsRow}>
                    {group.past_dividends.map((div, i) => (
                      <View
                        key={i}
                        style={[
                          styles.divChip,
                          {
                            backgroundColor: theme.surface.base,
                            borderColor: theme.surface.border,
                          },
                        ]}
                      >
                        <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '600', fontSize: 11 }]}>
                          M{i + 1}: ₹{div.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.cardActionsRow}>
                <Button
                  title="Details"
                  variant="outline"
                  size="sm"
                  onPress={() => onSelectGroup(group.id)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title="Subscribe"
                  variant="primary"
                  size="sm"
                  onPress={() => setSelectedGroupToJoin(group)}
                  style={{ flex: 1.2, marginLeft: 8 }}
                />
              </View>
            </Card>
          ))
        )}
      </View>

      {/* ── Join Group Confirmation Modal ── */}
      {selectedGroupToJoin && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}>
              {joinedSuccess ? (
                <View style={styles.successContainer}>
                  <CheckCircle size={54} color={theme.semantic.success} />
                  <Text style={[typography.h2, { color: theme.text.primary, marginTop: 14 }]}>
                    Ticket Allocated!
                  </Text>
                  <Text style={[typography.bodyMedium, { color: theme.text.secondary, textAlign: 'center', marginTop: 6 }]}>
                    You have officially joined {selectedGroupToJoin.name}. First installment schedule is generated.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.modalHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Coins size={18} color={theme.gold.accent} />
                      <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 8 }]}>
                        Confirm Subscription
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedGroupToJoin(null)}>
                      <X size={20} color={theme.text.muted} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[typography.bodyMedium, { color: theme.text.secondary, marginTop: 6 }]}>
                    {selectedGroupToJoin.name}
                  </Text>

                  <View style={[styles.modalSummaryBox, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.surface.border }]}>
                    <View style={styles.modalRow}>
                      <Text style={[typography.caption, { color: theme.text.secondary }]}>Chit Value:</Text>
                      <Text style={[typography.numericMedium, { color: theme.text.primary, fontWeight: '700' }]}>
                        ₹{selectedGroupToJoin.chit_amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={[typography.caption, { color: theme.text.secondary }]}>Monthly Due:</Text>
                      <Text style={[typography.numericMedium, { color: theme.maroon.primary, fontWeight: '700' }]}>
                        ₹{selectedGroupToJoin.installment_amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={[typography.caption, { color: theme.text.secondary }]}>Tenure:</Text>
                      <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '600' }]}>
                        {selectedGroupToJoin.duration_months} Months
                      </Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={[typography.caption, { color: theme.text.secondary }]}>Registrar State:</Text>
                      <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '600' }]}>
                        {selectedGroupToJoin.registrar_state_code}
                      </Text>
                    </View>
                  </View>

                  <Text style={[typography.caption, { color: theme.text.muted, marginVertical: 14, lineHeight: 17 }]}>
                    By subscribing, you agree to the Chit Agreement filed with the Registrar under Section 6 of the Chit Funds Act 1982.
                  </Text>

                  <Button
                    title="Confirm & Generate Ticket"
                    variant="primary"
                    loading={joinLoading}
                    onPress={() => handleConfirmJoin(selectedGroupToJoin)}
                  />
                </>
              )}
            </View>
          </View>
        </Modal>
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

  // ── Hero Banner ──
  heroCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  heroDecorTop: {
    position: 'absolute',
    top: -35,
    right: -35,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  heroDecorBottom: {
    position: 'absolute',
    bottom: -35,
    left: -25,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  heroPreTitle: {
    color: '#F3E5AB',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginLeft: 5,
  },
  safeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.45)',
  },
  safeBadgeText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 10,
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: 6,
    lineHeight: 18,
  },
  heroFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroFeatureCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  heroFeatureText: {
    color: '#F5E8CE',
    fontSize: 10.5,
    fontWeight: '700',
    marginLeft: 4,
  },

  // ── Filter Pills ──
  filtersContainer: {
    paddingRight: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },

  // ── Results Header ──
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
    paddingHorizontal: 2,
  },

  // ── Group Cards ──
  groupCard: {
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  vacantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  vacantHeaderText: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
    marginLeft: 5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tenureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tenureBadgeText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  statCell: {
    flex: 1,
  },
  dividendBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  dividendChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  divChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    marginTop: 14,
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

  // ── Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSummaryBox: {
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    gap: 10,
    borderWidth: 1,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successContainer: {
    alignItems: 'center',
    padding: 24,
  },
});
