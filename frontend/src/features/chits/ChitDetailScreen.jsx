import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useTheme } from '../../core/theme/ThemeProvider';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import { TransparencyBadge } from '../../core/components/TransparencyBadge';
import { useAppStore } from '../../store/useAppStore';
import {
  ArrowLeft,
  FileCheck,
  ShieldCheck,
  Download,
  Info,
} from 'lucide-react-native';

export const ChitDetailScreen = ({
  groupId,
  onBack,
  onNavigateToAuction,
}) => {
  const { theme, typography } = useTheme();
  const { availableGroups } = useAppStore();

  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedDocPreview, setSelectedDocPreview] = useState(null);

  const group = availableGroups.find((g) => g.id === groupId) || availableGroups[0];

  const subscribersList = Array.from(
    { length: group.duration_months },
    (_, i) => {
      const ticket = i + 1;
      let status = 'NPS';
      if (ticket === 1) status = 'PS';
      else if (ticket === 2) status = 'PS';
      else if (ticket === 3) status = 'PS';
      else if (ticket === 7) status = 'NPS';
      else if (ticket === 14) status = 'SB';
      return {
        ticket,
        name: ticket === 7 ? 'You (Mohamed Asfaque)' : `Subscriber #${ticket}`,
        status,
      };
    }
  );

  const installments = Array.from({ length: group.duration_months }, (_, i) => {
    const month = i + 1;
    const isPaid = month < group.current_month;
    const isCurrent = month === group.current_month;
    const dividend = isPaid ? (group.past_dividends[month - 1] || 3200) : 0;
    const amountDue = group.installment_amount - dividend;

    return {
      month,
      dueDate: `2026-${String((month % 12) + 1).padStart(2, '0')}-15`,
      amountDue,
      dividend,
      status: isPaid ? 'PAID' : isCurrent ? 'PENDING' : 'UPCOMING',
    };
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.topNav}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color={theme.text.primary} />
          <Text style={[typography.h3, { color: theme.text.primary, marginLeft: 8 }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
          {group.registrar_state_code}
        </Text>
      </View>

      <Card variant="goldAccent" style={styles.heroCard}>
        <Text style={[typography.h1, { color: theme.text.primary }]}>{group.name}</Text>
        <Text style={[typography.displayLarge, { color: theme.maroon.primary, marginVertical: 4 }]}>
          ₹{group.chit_amount.toLocaleString('en-IN')}
        </Text>

        <View style={styles.heroMetrics}>
          <View style={styles.metricItem}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>Tenure</Text>
            <Text style={[typography.numericMedium, { color: theme.text.primary, fontWeight: '700' }]}>
              {group.duration_months} Mos
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricItem}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>Monthly Base</Text>
            <Text style={[typography.numericMedium, { color: theme.text.primary, fontWeight: '700' }]}>
              ₹{group.installment_amount.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricItem}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>Commission</Text>
            <Text style={[typography.numericMedium, { color: theme.text.primary, fontWeight: '700' }]}>
              {group.foreman_commission_pct}%
            </Text>
          </View>
        </View>

        <View style={[styles.policyNotice, { backgroundColor: theme.surface.cardSubtle }]}>
          <Info size={16} color={theme.maroon.primary} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
              Dividend Distribution Policy: {group.dividend_distribution_policy === 'NON_PRIZED_ONLY' ? 'Non-Prized Subscribers Only' : 'All Subscribers'}
            </Text>
            <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2 }]}>
              {group.dividend_distribution_policy === 'NON_PRIZED_ONLY'
                ? 'Discount surplus is shared exclusively among non-prized subscribers to maximize your savings yield until you win.'
                : 'All subscribers (both prized and non-prized) share in the monthly auction dividend equally.'}
            </Text>
          </View>
        </View>
      </Card>

      <View style={[styles.tabsRow, { borderBottomColor: theme.surface.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('schedule')}
          style={[styles.tab, activeTab === 'schedule' && { borderBottomColor: theme.maroon.primary }]}
        >
          <Text
            style={[
              typography.caption,
              {
                color: activeTab === 'schedule' ? theme.maroon.primary : theme.text.secondary,
                fontWeight: activeTab === 'schedule' ? '700' : '500',
              },
            ]}
          >
            Installments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('subscribers')}
          style={[styles.tab, activeTab === 'subscribers' && { borderBottomColor: theme.maroon.primary }]}
        >
          <Text
            style={[
              typography.caption,
              {
                color: activeTab === 'subscribers' ? theme.maroon.primary : theme.text.secondary,
                fontWeight: activeTab === 'subscribers' ? '700' : '500',
              },
            ]}
          >
            Subscribers ({group.duration_months})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('documents')}
          style={[styles.tab, activeTab === 'documents' && { borderBottomColor: theme.maroon.primary }]}
        >
          <Text
            style={[
              typography.caption,
              {
                color: activeTab === 'documents' ? theme.maroon.primary : theme.text.secondary,
                fontWeight: activeTab === 'documents' ? '700' : '500',
              },
            ]}
          >
            FDR & Legal Docs
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'schedule' && (
        <View style={{ marginTop: 14 }}>
          {installments.map((item) => (
            <View
              key={item.month}
              style={[
                styles.scheduleRow,
                {
                  backgroundColor: item.status === 'PENDING' ? theme.maroon.primary + '10' : theme.surface.card,
                  borderColor: item.status === 'PENDING' ? theme.maroon.primary + '40' : theme.surface.border,
                },
              ]}
            >
              <View style={styles.monthBadge}>
                <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
                  M{item.month}
                </Text>
              </View>

              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[typography.h3, { color: theme.text.primary }]}>
                  ₹{item.amountDue.toLocaleString('en-IN')}
                </Text>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>
                  Due: {item.dueDate} {item.dividend > 0 ? `(Div: -₹${item.dividend})` : ''}
                </Text>
              </View>

              <View
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      item.status === 'PAID'
                        ? theme.semantic.successBg
                        : item.status === 'PENDING'
                        ? theme.semantic.warningBg
                        : theme.surface.cardSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color:
                        item.status === 'PAID'
                          ? theme.semantic.success
                          : item.status === 'PENDING'
                          ? theme.semantic.warning
                          : theme.text.muted,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'subscribers' && (
        <View style={{ marginTop: 14 }}>
          {subscribersList.map((sub) => (
            <Card key={sub.ticket} style={styles.subscriberCard}>
              <View style={styles.subscriberRow}>
                <View style={styles.ticketBadge}>
                  <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700' }]}>
                    #{sub.ticket}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '600' }]}>
                    {sub.name}
                  </Text>
                </View>
                <TransparencyBadge status={sub.status} />
              </View>
            </Card>
          ))}
        </View>
      )}

      {activeTab === 'documents' && (
        <View style={{ marginTop: 14 }}>
          <Card variant="elevated" style={styles.secCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ShieldCheck size={22} color={theme.semantic.success} />
              <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 8 }]}>
                100% Security Instrument
              </Text>
            </View>
            <Text style={[typography.bodySmall, { color: theme.text.secondary, marginTop: 6 }]}>
              As mandated by Section 20 of Chit Funds Act 1982, the foreman has pledged 100% of the aggregate chit amount in the name of the Registrar before commencing auctions.
            </Text>

            <View style={[styles.secGrid, { backgroundColor: theme.surface.cardSubtle }]}>
              <View>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>Instrument Type</Text>
                <Text style={[typography.h3, { color: theme.maroon.primary, fontWeight: '700' }]}>
                  {group.security_instrument}
                </Text>
              </View>
              <View>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>Pledged Sum</Text>
                <Text style={[typography.numericMedium, { color: theme.semantic.success, fontWeight: '700' }]}>
                  ₹{group.chit_amount.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.docItem}>
            <View style={styles.docRow}>
              <FileCheck size={20} color={theme.gold.accent} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[typography.h3, { color: theme.text.primary }]}>Fixed Deposit Receipt (FDR)</Text>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>
                  Ref: {group.fdr_number} · Lien marked to Registrar
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedDocPreview('FDR Certificate')}
                style={styles.viewDocBtn}
              >
                <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
                  Preview PDF
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          <Card style={styles.docItem}>
            <View style={styles.docRow}>
              <FileCheck size={20} color={theme.gold.accent} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[typography.h3, { color: theme.text.primary }]}>Prior Sanction Order (PSO)</Text>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>
                  Order: {group.pso_order_number} · Registrar of Chits
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedDocPreview('Prior Sanction Order')}
                style={styles.viewDocBtn}
              >
                <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
                  Preview PDF
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          <Card style={styles.docItem}>
            <View style={styles.docRow}>
              <FileCheck size={20} color={theme.gold.accent} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[typography.h3, { color: theme.text.primary }]}>Certificate of Commencement</Text>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>
                  Form VII issued under Rule 28
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedDocPreview('Certificate of Commencement')}
                style={styles.viewDocBtn}
              >
                <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
                  Preview PDF
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          <Card style={styles.docItem}>
            <View style={styles.docRow}>
              <FileCheck size={20} color={theme.gold.accent} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[typography.h3, { color: theme.text.primary }]}>Chit Agreement (Form II)</Text>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>
                  Standard Bye-laws & Double-Entry Ledger rules
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedDocPreview('Chit Agreement')}
                style={styles.viewDocBtn}
              >
                <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
                  Preview PDF
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      )}

      {selectedDocPreview && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalDocCard, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[typography.h2, { color: theme.text.primary }]}>
                  {selectedDocPreview}
                </Text>
                <TouchableOpacity onPress={() => setSelectedDocPreview(null)}>
                  <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>Close</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.pdfViewerSim, { backgroundColor: theme.surface.inputBg }]}>
                <FileCheck size={48} color={theme.gold.accent} />
                <Text style={[typography.h3, { color: theme.text.primary, marginTop: 12 }]}>
                  Digitally Certified Document
                </Text>
                <Text style={[typography.caption, { color: theme.text.secondary, textAlign: 'center', marginTop: 4 }]}>
                  Verified by Registrar of Chits, Government of Telangana. Signed by Assistant Registrar on double-entry seal.
                </Text>
                <View style={[styles.hashBox, { backgroundColor: theme.surface.cardSubtle }]}>
                  <Text style={[typography.caption, { color: theme.text.muted, fontSize: 9 }]}>
                    SHA256: 8f92a10b48c772e091bde49a882cf19028a3819024f
                  </Text>
                </View>
              </View>

              <Button
                title="Download Certified PDF"
                variant="primary"
                icon={<Download size={16} color="#FFF" />}
                onPress={() => setSelectedDocPreview(null)}
                style={{ marginTop: 14 }}
              />
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
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCard: {
    marginBottom: 16,
  },
  heroMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    alignItems: 'center',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#00000015',
  },
  policyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  monthBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#7A1F3D15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subscriberCard: {
    marginBottom: 8,
    padding: 10,
  },
  subscriberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketBadge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#00000010',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secCard: {
    marginBottom: 14,
  },
  secGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  docItem: {
    marginBottom: 8,
    padding: 12,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDocBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalDocCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pdfViewerSim: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 10,
    marginTop: 14,
  },
  hashBox: {
    padding: 6,
    borderRadius: 4,
    marginTop: 12,
  },
});
