import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../../core/theme/ThemeProvider';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import { useAppStore } from '../../store/useAppStore';
import {
  ShieldAlert,
  FileCheck,
  Percent,
  CheckCircle2,
  Building,
} from 'lucide-react-native';

export const ForemanDashboardScreen = () => {
  const { theme, typography } = useTheme();
  const { switchRole } = useAppStore();

  const registrarFilings = [
    {
      form: 'Form I',
      title: 'Prior Sanction Application',
      group: 'Kaveti Smart Wealth Series-I',
      status: 'APPROVED',
      orderNo: 'PSO/TS/2025/0892',
    },
    {
      form: 'Form II',
      title: 'Chit Agreement Bye-Laws',
      group: 'Kakatiya Premium Gold Chit',
      status: 'APPROVED',
      orderNo: 'AGR/TS/2026/0114',
    },
    {
      form: 'Form XIV',
      title: 'Auction Minutes Filing (48h)',
      group: 'Kaveti Series-I (Month 3)',
      status: 'PENDING_SIGNATURE',
      orderNo: 'DUE IN 22 HOURS',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: theme.maroon.primary + '20' }]}>
          <Building size={14} color={theme.maroon.primary} />
          <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700', marginLeft: 6 }]}>
            Foreman Regulatory Portal
          </Text>
        </View>
        <Text style={[typography.h1, { color: theme.text.primary, marginTop: 8 }]}>
          Compliance & Foreman Console
        </Text>
        <Text style={[typography.bodyMedium, { color: theme.text.secondary }]}>
          Registrar Filings, Form I/II/XIV, GST Invoicing & PMLA Directives
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <Text style={[typography.caption, { color: theme.text.secondary }]}>Active Chits Supervised</Text>
          <Text style={[typography.displayLarge, { color: theme.maroon.primary, marginTop: 4 }]}>
            3
          </Text>
          <Text style={[typography.caption, { color: theme.text.muted }]}>100% FDR Pledged</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={[typography.caption, { color: theme.text.secondary }]}>Monthly GST Liability</Text>
          <Text style={[typography.displayLarge, { color: theme.gold.accent, marginTop: 4 }]}>
            ₹4,500
          </Text>
          <Text style={[typography.caption, { color: theme.text.muted }]}>18% on Foreman Comm.</Text>
        </Card>
      </View>

      <Card variant="elevated" style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Percent size={20} color={theme.maroon.primary} />
          <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 8 }]}>
            GST Computation Schedule
          </Text>
        </View>
        <Text style={[typography.bodySmall, { color: theme.text.secondary, marginTop: 6 }]}>
          Under GST Law Notification No. 11/2017, GST is levied only on the 5% Foreman Commission, never on subscriber chit contributions.
        </Text>

        <View style={[styles.gstTable, { backgroundColor: theme.surface.cardSubtle }]}>
          <View style={styles.gstRow}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>Aggregate Chit Value (Monthly)</Text>
            <Text style={[typography.numericMedium, { color: theme.text.primary, fontWeight: '700' }]}>
              ₹5,00,000.00
            </Text>
          </View>
          <View style={styles.gstRow}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>Foreman Commission (5%)</Text>
            <Text style={[typography.numericMedium, { color: theme.text.primary, fontWeight: '700' }]}>
              ₹25,000.00
            </Text>
          </View>
          <View style={styles.gstRow}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>CGST (9%)</Text>
            <Text style={[typography.numericMedium, { color: theme.maroon.primary, fontWeight: '700' }]}>
              ₹2,250.00
            </Text>
          </View>
          <View style={styles.gstRow}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>SGST (9%)</Text>
            <Text style={[typography.numericMedium, { color: theme.maroon.primary, fontWeight: '700' }]}>
              ₹2,250.00
            </Text>
          </View>
          <View style={[styles.gstRow, { borderTopWidth: 1, borderTopColor: theme.surface.border, paddingTop: 8 }]}>
            <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700' }]}>
              Total Tax Invoice
            </Text>
            <Text style={[typography.numericLarge, { color: theme.semantic.success, fontWeight: '700' }]}>
              ₹29,500.00
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <FileCheck size={20} color={theme.gold.accent} />
          <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 8 }]}>
            Registrar of Chits Filings
          </Text>
        </View>

        {registrarFilings.map((filing, idx) => (
          <View
            key={idx}
            style={[
              styles.filingItem,
              {
                borderColor: filing.status === 'PENDING_SIGNATURE' ? theme.semantic.warning : theme.surface.border,
                backgroundColor: filing.status === 'PENDING_SIGNATURE' ? theme.semantic.warningBg : theme.surface.cardSubtle,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[typography.h3, { color: theme.text.primary }]}>{filing.form}</Text>
                <Text style={[typography.caption, { color: theme.text.secondary, marginLeft: 8 }]}>
                  {filing.title}
                </Text>
              </View>
              <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2 }]}>
                {filing.group} · {filing.orderNo}
              </Text>
            </View>

            {filing.status === 'APPROVED' ? (
              <View style={[styles.statusChip, { backgroundColor: theme.semantic.successBg }]}>
                <CheckCircle2 size={13} color={theme.semantic.success} />
                <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700', marginLeft: 4 }]}>
                  Lodged
                </Text>
              </View>
            ) : (
              <Button
                title="Sign & Submit"
                size="sm"
                variant="primary"
                onPress={() => Alert.alert('Minutes Lodged', 'Form XIV auction minutes submitted with DSC e-Sign to Registrar portal.')}
              />
            )}
          </View>
        ))}
      </Card>

      <Card style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <ShieldAlert size={20} color={theme.semantic.info} />
          <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 8 }]}>
            PMLA / FIU-IND Reporting
          </Text>
        </View>
        <Text style={[typography.caption, { color: theme.text.secondary, marginBottom: 12 }]}>
          Automated monitoring under Prevention of Money Laundering Act guidelines.
        </Text>

        <View style={styles.pmlaGrid}>
          <View style={[styles.pmlaCell, { backgroundColor: theme.surface.cardSubtle }]}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>Cash Transaction Report (CTR)</Text>
            <Text style={[typography.h3, { color: theme.semantic.success, marginTop: 4 }]}>
              NIL CASH
            </Text>
            <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10 }]}>
              100% digital bank / UPI settlement
            </Text>
          </View>

          <View style={[styles.pmlaCell, { backgroundColor: theme.surface.cardSubtle }]}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>Suspicious Transactions (STR)</Text>
            <Text style={[typography.h3, { color: theme.semantic.success, marginTop: 4 }]}>
              0 Flagged
            </Text>
            <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10 }]}>
              All subscribers Aadhaar verified
            </Text>
          </View>
        </View>
      </Card>

      <Button
        title="Switch Back to Subscriber Mode"
        variant="outline"
        onPress={() => switchRole('user')}
        style={{ marginTop: 10 }}
      />
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
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
  },
  sectionCard: {
    marginBottom: 16,
  },
  gstTable: {
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  gstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pmlaGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  pmlaCell: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
  },
});
