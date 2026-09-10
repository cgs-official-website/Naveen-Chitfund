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
import { useAppStore } from '../../store/useAppStore';
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Download,
  Repeat,
  FileText,
} from 'lucide-react-native';

export const PaymentsScreen = () => {
  const { theme, typography } = useTheme();
  const { activeChits, makePayment } = useAppStore();

  const [paymentSuccessModal, setPaymentSuccessModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [autoDebitActive, setAutoDebitActive] = useState(true);

  const dueChit = activeChits[0];

  const paymentHistory = [
    {
      id: 'tx-0881',
      date: '15 Aug 2026',
      amount: 21875,
      method: 'UPI · IDFC First Bank',
      status: 'SUCCESS',
      chitName: 'Kaveti Smart Wealth Series-I',
      month: 3,
    },
    {
      id: 'tx-0722',
      date: '15 Jul 2026',
      amount: 20750,
      method: 'eNACH Mandate (NPCI)',
      status: 'SUCCESS',
      chitName: 'Kaveti Smart Wealth Series-I',
      month: 2,
    },
    {
      id: 'tx-0619',
      date: '15 Jun 2026',
      amount: 25000,
      method: 'Net Banking · HDFC',
      status: 'SUCCESS',
      chitName: 'Kaveti Smart Wealth Series-I',
      month: 1,
    },
  ];

  const handlePayNow = () => {
    if (!dueChit) return;
    makePayment(dueChit.id, dueChit.installment_amount);
    setPaymentSuccessModal(true);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[typography.h1, { color: theme.text.primary }]}>Payments & Auto-Debit</Text>
        <Text style={[typography.bodyMedium, { color: theme.text.secondary }]}>
          Instant UPI Settlement & RBI Regulated eNACH Mandates
        </Text>
      </View>

      <Card
        variant="elevated"
        style={[
          styles.graceBanner,
          {
            backgroundColor: theme.semantic.warningBg,
            borderColor: theme.semantic.warning + '60',
          },
        ]}
      >
        <View style={styles.graceRow}>
          <AlertTriangle size={24} color={theme.semantic.warning} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[typography.h3, { color: theme.semantic.warning }]}>
              Payment Due in 5 Days
            </Text>
            <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2 }]}>
              Under Chit Funds Act § 22, a statutory grace period of 7 days applies before 1.5% overdue interest is computed.
            </Text>
          </View>
        </View>
      </Card>

      {dueChit && (
        <Card variant="goldAccent" style={styles.dueCard}>
          <View style={styles.dueTopRow}>
            <View>
              <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
                CURRENT INSTALLMENT DUE
              </Text>
              <Text style={[typography.displayLarge, { color: theme.text.primary, marginTop: 2 }]}>
                ₹{dueChit.installment_amount.toLocaleString('en-IN')}
              </Text>
              <Text style={[typography.caption, { color: theme.text.secondary }]}>
                {dueChit.chit_group_name} · Month {dueChit.installments_paid + 1} of {dueChit.total_installments}
              </Text>
            </View>
            <View style={[styles.dueTag, { backgroundColor: theme.gold.accent + '25' }]}>
              <Text style={[typography.caption, { color: theme.isDark ? theme.gold.accent : '#997300', fontWeight: '700' }]}>
                Due 15 Sep
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 18 }}>
            <Button
              title={`Pay ₹${dueChit.installment_amount.toLocaleString('en-IN')} via UPI`}
              variant="primary"
              icon={<CreditCard size={18} color="#FFF" />}
              onPress={handlePayNow}
            />
          </View>
        </Card>
      )}

      <Card style={styles.mandateCard}>
        <View style={styles.mandateHeader}>
          <Repeat size={20} color={theme.maroon.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[typography.h3, { color: theme.text.primary }]}>
              eNACH Auto-Debit Mandate
            </Text>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>
              NPCI Mandate ID: UMRN-CHIT-9921409
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setAutoDebitActive(!autoDebitActive)}
            style={[
              styles.mandateStatus,
              {
                backgroundColor: autoDebitActive ? theme.semantic.successBg : theme.surface.cardSubtle,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: autoDebitActive ? theme.semantic.success : theme.text.muted,
                  fontWeight: '700',
                },
              ]}
            >
              {autoDebitActive ? 'ACTIVE' : 'PAUSED'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 10 }]}>
          Auto-debit automatically settles the net installment after deducting your earned auction dividend on the 15th of every month.
        </Text>
      </Card>

      <View style={styles.sectionTitleRow}>
        <Text style={[typography.h2, { color: theme.text.primary }]}>Payment History</Text>
      </View>

      {paymentHistory.map((item) => (
        <Card key={item.id} style={styles.historyCard}>
          <View style={styles.historyRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h3, { color: theme.text.primary }]}>
                ₹{item.amount.toLocaleString('en-IN')}
              </Text>
              <Text style={[typography.caption, { color: theme.text.secondary }]}>
                {item.chitName} · Month {item.month}
              </Text>
              <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10, marginTop: 2 }]}>
                {item.date} · {item.method}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.successChip, { backgroundColor: theme.semantic.successBg }]}>
                <CheckCircle size={12} color={theme.semantic.success} />
                <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700', marginLeft: 4 }]}>
                  {item.status}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedReceipt(item.id)}
                style={styles.receiptLink}
              >
                <Download size={13} color={theme.maroon.primary} />
                <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700', marginLeft: 4 }]}>
                  Receipt
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      ))}

      {paymentSuccessModal && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}>
              <CheckCircle size={52} color={theme.semantic.success} />
              <Text style={[typography.h2, { color: theme.text.primary, marginTop: 12 }]}>
                Payment Successful!
              </Text>
              <Text style={[typography.bodyMedium, { color: theme.text.secondary, textAlign: 'center', marginTop: 4 }]}>
                ₹{dueChit.installment_amount.toLocaleString('en-IN')} received. Official e-Receipt generated and recorded in double-entry ledger.
              </Text>
              <Button
                title="Done"
                variant="primary"
                onPress={() => setPaymentSuccessModal(false)}
                style={{ marginTop: 20, width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}

      {selectedReceipt && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <FileText size={24} color={theme.gold.accent} />
                <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 8 }]}>
                  Chit Receipt #{selectedReceipt}
                </Text>
              </View>
              <Text style={[typography.caption, { color: theme.text.secondary }]}>
                Issued under Section 30 of the Chit Funds Act 1982. Contains Foreman digital signature and GST ledger reference.
              </Text>

              <View style={[styles.receiptPreview, { backgroundColor: theme.surface.inputBg }]}>
                <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700' }]}>
                  CHITTECH FOREMAN SERVICES PVT LTD
                </Text>
                <Text style={[typography.caption, { color: theme.text.muted }]}>
                  GSTIN: 36AAACC1206M1ZP
                </Text>
                <Text style={[typography.numericMedium, { color: theme.maroon.primary, marginVertical: 8 }]}>
                  Amount Received: ₹21,875.00
                </Text>
                <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700' }]}>
                  STATUS: CLEARED (NPCI/UPI)
                </Text>
              </View>

              <Button
                title="Download PDF"
                variant="primary"
                icon={<Download size={16} color="#FFF" />}
                onPress={() => setSelectedReceipt(null)}
                style={{ marginTop: 16, width: '100%' }}
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
  header: {
    marginBottom: 16,
  },
  graceBanner: {
    padding: 12,
    marginBottom: 16,
  },
  graceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueCard: {
    marginBottom: 16,
  },
  dueTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dueTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mandateCard: {
    marginBottom: 16,
  },
  mandateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mandateStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sectionTitleRow: {
    marginVertical: 10,
  },
  historyCard: {
    marginBottom: 10,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  receiptLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
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
    alignItems: 'center',
    borderWidth: 1,
  },
  receiptPreview: {
    width: '100%',
    padding: 14,
    borderRadius: 8,
    marginVertical: 14,
    alignItems: 'center',
  },
});
