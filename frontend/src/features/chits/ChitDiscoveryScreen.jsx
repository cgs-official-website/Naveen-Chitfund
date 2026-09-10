import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useTheme } from '../../core/theme/ThemeProvider';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import { TransparencyBadge } from '../../core/components/TransparencyBadge';
import { useAppStore } from '../../store/useAppStore';
import {
  Search,
  Calendar,
  Sparkles,
  CheckCircle,
  X,
} from 'lucide-react-native';

export const ChitDiscoveryScreen = ({
  onSelectGroup,
  onOpenDocs,
}) => {
  const { theme, typography } = useTheme();
  const { availableGroups, joinChitGroup } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedTenure, setSelectedTenure] = useState('ALL');
  const [onlyVacant, setOnlyVacant] = useState(false);

  const [selectedGroupToJoin, setSelectedGroupToJoin] = useState(null);
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  const filteredGroups = availableGroups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.registrar_state_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState =
      selectedState === 'ALL' || g.registrar_state_code.includes(selectedState);
    const matchesTenure =
      selectedTenure === 'ALL' || String(g.duration_months) === selectedTenure;
    const matchesVacant = !onlyVacant || g.vacant_slots > 0;

    return matchesSearch && matchesState && matchesTenure && matchesVacant;
  });

  const handleConfirmJoin = (group) => {
    joinChitGroup(group);
    setJoinedSuccess(true);
    setTimeout(() => {
      setJoinedSuccess(false);
      setSelectedGroupToJoin(null);
    }, 1200);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[typography.h1, { color: theme.text.primary }]}>Explore Chit Groups</Text>
        <Text style={[typography.bodyMedium, { color: theme.text.secondary }]}>
          Verified by State Registrars with 100% 1st-Auction Security Deposits
        </Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.surface.inputBg, borderColor: theme.surface.border }]}>
        <Search size={18} color={theme.text.muted} />
        <TextInput
          placeholder="Search by chit series, PSO number, or registrar..."
          placeholderTextColor={theme.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[typography.bodyMedium, styles.searchInput, { color: theme.text.primary }]}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <TouchableOpacity
          onPress={() => setOnlyVacant(!onlyVacant)}
          style={[
            styles.filterChip,
            {
              backgroundColor: onlyVacant ? theme.gold.accent : theme.surface.cardSubtle,
              borderColor: onlyVacant ? theme.gold.accent : theme.surface.border,
            },
          ]}
        >
          <Sparkles size={13} color={onlyVacant ? theme.maroon.deep : theme.text.secondary} />
          <Text
            style={[
              typography.caption,
              {
                color: onlyVacant ? theme.maroon.deep : theme.text.primary,
                fontWeight: '700',
                marginLeft: 4,
              },
            ]}
          >
            Vacant Slots Only
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedState(selectedState === 'Telangana' ? 'ALL' : 'Telangana')}
          style={[
            styles.filterChip,
            {
              backgroundColor: selectedState === 'Telangana' ? theme.maroon.primary : theme.surface.cardSubtle,
              borderColor: selectedState === 'Telangana' ? theme.maroon.primary : theme.surface.border,
            },
          ]}
        >
          <Text
            style={[
              typography.caption,
              {
                color: selectedState === 'Telangana' ? '#FFFFFF' : theme.text.primary,
                fontWeight: '600',
              },
            ]}
          >
            Telangana (T-Chits)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedState(selectedState === 'Andhra' ? 'ALL' : 'Andhra')}
          style={[
            styles.filterChip,
            {
              backgroundColor: selectedState === 'Andhra' ? theme.maroon.primary : theme.surface.cardSubtle,
              borderColor: selectedState === 'Andhra' ? theme.maroon.primary : theme.surface.border,
            },
          ]}
        >
          <Text
            style={[
              typography.caption,
              {
                color: selectedState === 'Andhra' ? '#FFFFFF' : theme.text.primary,
                fontWeight: '600',
              },
            ]}
          >
            Andhra Pradesh
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedTenure(selectedTenure === '20' ? 'ALL' : '20')}
          style={[
            styles.filterChip,
            {
              backgroundColor: selectedTenure === '20' ? theme.maroon.primary : theme.surface.cardSubtle,
              borderColor: selectedTenure === '20' ? theme.maroon.primary : theme.surface.border,
            },
          ]}
        >
          <Text
            style={[
              typography.caption,
              {
                color: selectedTenure === '20' ? '#FFFFFF' : theme.text.primary,
                fontWeight: '600',
              },
            ]}
          >
            20 Months
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedTenure(selectedTenure === '25' ? 'ALL' : '25')}
          style={[
            styles.filterChip,
            {
              backgroundColor: selectedTenure === '25' ? theme.maroon.primary : theme.surface.cardSubtle,
              borderColor: selectedTenure === '25' ? theme.maroon.primary : theme.surface.border,
            },
          ]}
        >
          <Text
            style={[
              typography.caption,
              {
                color: selectedTenure === '25' ? '#FFFFFF' : theme.text.primary,
                fontWeight: '600',
              },
            ]}
          >
            25 Months
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={{ marginTop: 16 }}>
        {filteredGroups.map((group) => (
          <Card key={group.id} style={styles.groupCard}>
            {group.vacant_slots > 0 && (
              <View style={[styles.vacantHeader, { backgroundColor: theme.gold.accent + '25', borderColor: theme.gold.accent + '60' }]}>
                <Sparkles size={12} color={theme.isDark ? theme.gold.accent : '#997300'} />
                <Text style={[typography.caption, { color: theme.isDark ? theme.gold.accent : '#997300', fontWeight: '700', marginLeft: 4 }]}>
                  {group.vacant_slots} VACANT SLOT{group.vacant_slots > 1 ? 'S' : ''} — IMMEDIATE BIDDING ELIGIBLE
                </Text>
              </View>
            )}

            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h3, { color: theme.text.primary }]}>{group.name}</Text>
                <Text style={[typography.displayLarge, { color: theme.maroon.primary, marginTop: 2 }]}>
                  ₹{group.chit_amount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.tenureBadge}>
                <Calendar size={13} color={theme.text.secondary} />
                <Text style={[typography.caption, { color: theme.text.secondary, marginLeft: 4 }]}>
                  {group.duration_months} Months
                </Text>
              </View>
            </View>

            <View style={[styles.statsGrid, { backgroundColor: theme.surface.cardSubtle }]}>
              <View style={styles.statCell}>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>Monthly Due</Text>
                <Text style={[typography.numericMedium, { color: theme.text.primary, fontWeight: '700' }]}>
                  ₹{group.installment_amount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>Dividend Policy</Text>
                <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
                  {group.dividend_distribution_policy === 'NON_PRIZED_ONLY' ? 'Non-Prized Only' : 'All Subscribers'}
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>Security</Text>
                <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700' }]}>
                  {group.security_instrument}
                </Text>
              </View>
            </View>

            <TransparencyBadge
              registrarState={group.registrar_state_code}
              onPressDocs={() => onOpenDocs(group.name)}
              style={{ marginTop: 12 }}
            />

            {group.past_dividends.length > 0 && (
              <View style={[styles.dividendBox, { borderColor: theme.surface.border }]}>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>
                  Past Auction Dividends:
                </Text>
                <View style={styles.dividendChipsRow}>
                  {group.past_dividends.map((div, idx) => (
                    <View key={idx} style={[styles.divChip, { backgroundColor: theme.semantic.successBg }]}>
                      <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700' }]}>
                        M{idx + 1}: +₹{div.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.cardActionsRow}>
              <Button
                title="View Full Detail"
                variant="outline"
                size="sm"
                onPress={() => onSelectGroup(group.id)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Join Group"
                variant="primary"
                size="sm"
                onPress={() => setSelectedGroupToJoin(group)}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </Card>
        ))}
      </View>

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
                    <Text style={[typography.h2, { color: theme.text.primary }]}>
                      Confirm Subscription
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedGroupToJoin(null)}>
                      <X size={20} color={theme.text.muted} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[typography.bodyMedium, { color: theme.text.secondary, marginTop: 4 }]}>
                    {selectedGroupToJoin.name}
                  </Text>

                  <View style={[styles.modalSummaryBox, { backgroundColor: theme.surface.cardSubtle }]}>
                    <View style={styles.modalRow}>
                      <Text style={[typography.caption, { color: theme.text.secondary }]}>Chit Value:</Text>
                      <Text style={[typography.numericMedium, { color: theme.text.primary, fontWeight: '700' }]}>
                        ₹{selectedGroupToJoin.chit_amount.toLocaleString('en-IN')}
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
                      <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
                        {selectedGroupToJoin.registrar_state_code}
                      </Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={[typography.caption, { color: theme.text.secondary }]}>1st Month Due:</Text>
                      <Text style={[typography.numericMedium, { color: theme.maroon.primary, fontWeight: '700' }]}>
                        ₹{selectedGroupToJoin.installment_amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <Text style={[typography.caption, { color: theme.text.muted, marginVertical: 12 }]}>
                    By subscribing, you agree to the Chit Agreement filed with the Registrar under Section 6 of the Chit Funds Act 1982.
                  </Text>

                  <Button
                    title="Confirm & Generate Ticket"
                    variant="primary"
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
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
  },
  filtersScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  groupCard: {
    marginBottom: 16,
  },
  vacantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tenureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    justifyContent: 'space-between',
  },
  statCell: {
    flex: 1,
  },
  dividendBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  dividendChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  divChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSummaryBox: {
    borderRadius: 8,
    padding: 12,
    marginTop: 14,
    gap: 8,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
});
