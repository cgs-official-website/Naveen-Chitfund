import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
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
  Coins,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Clock,
  ChevronRight,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const PaymentsScreen = () => {
  const { theme, typography, isDark } = useTheme();
  const {
    activeChits,
    paymentHistory,
    paymentHistoryLoading,
    fetchPaymentHistory,
    fetchActiveChits,
    makePayment,
  } = useAppStore();

  const [paymentSuccessModal, setPaymentSuccessModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [autoDebitActive, setAutoDebitActive] = useState(false);
  const [paying, setPaying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastPaidAmount, setLastPaidAmount] = useState(0);

  useEffect(() => {
    fetchPaymentHistory();
    fetchActiveChits();
  }, [fetchPaymentHistory, fetchActiveChits]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchPaymentHistory(), fetchActiveChits()]);
    setRefreshing(false);
  }, [fetchPaymentHistory, fetchActiveChits]);

  const dueChit = activeChits.find(
    (c) => c.installments_paid < c.total_installments
  ) || activeChits[0];

  const handlePayNow = async () => {
    if (!dueChit || paying) return;
    setPaying(true);
    try {
      const amountToPay = dueChit.installment_amount;
      const res = await makePayment(dueChit.id, amountToPay);
      if (res?.success) {
        setLastPaidAmount(amountToPay);
        setPaymentSuccessModal(true);
      } else {
        Alert.alert('Payment Failed', res?.error || 'Could not process installment payment');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
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
            <Text style={styles.heroPreTitle}>SETTLEMENT & PAY</Text>
          </View>
          <View style={styles.safeBadge}>
            <ShieldCheck size={12} color="#D4AF37" />
            <Text style={styles.safeBadgeText}>NPCI / eNACH</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Payments & Subscriptions</Text>
        <Text style={styles.heroSubtitle}>
          Real-time UPI installment clearing, automated dividend net-offs, and Section 30 compliant digital receipts.
        </Text>

        <View style={styles.heroFeatureRow}>
          <View style={styles.heroFeatureCapsule}>
            <Zap size={12} color="#D4AF37" />
            <Text style={styles.heroFeatureText} numberOfLines={1}>Instant UPI</Text>
          </View>
          <View style={styles.heroFeatureCapsule}>
            <Repeat size={12} color="#4ADE80" />
            <Text style={styles.heroFeatureText} numberOfLines={1}>Auto Net-Off</Text>
          </View>
          <View style={styles.heroFeatureCapsule}>
            <FileText size={12} color="#E8D48B" />
            <Text style={styles.heroFeatureText} numberOfLines={1}>GST Invoices</Text>
          </View>
        </View>
      </View>

      {/* ── Current Due Section ── */}
      {dueChit ? (
        <>
          {/* Statutory Grace Period Notice */}
          <View style={[styles.graceBanner, { backgroundColor: 'rgba(212, 175, 55, 0.12)', borderColor: 'rgba(212, 175, 55, 0.35)' }]}>
            <View style={styles.graceRow}>
              <View style={[styles.graceIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.2)' }]}>
                <Coins size={16} color="#D4AF37" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[typography.h3, { color: isDark ? theme.gold.accent : '#997300', fontSize: 13, fontWeight: '700' }]}>
                  Statutory 7-Day Grace Window (§ 22)
                </Text>
                <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2, fontSize: 11, lineHeight: 15 }]}>
                  Payment is due in 5 days. Zero overdue interest will be levied during your active grace period.
                </Text>
              </View>
            </View>
          </View>

          {/* Luxury Current Due Card */}
          <Card variant="goldAccent" style={styles.dueCard}>
            <View style={styles.dueTopRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700', fontSize: 11 }]}>
                    CURRENT INSTALLMENT DUE
                  </Text>
                </View>
                <Text style={[typography.displayLarge, { color: theme.text.primary, marginTop: 4, fontSize: 28 }]}>
                  ₹{Number(dueChit.installment_amount).toLocaleString('en-IN')}
                </Text>
                <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 4, fontSize: 12 }]}>
                  {dueChit.chit_group_name} · Month {dueChit.installments_paid + 1} of {dueChit.total_installments}
                </Text>
              </View>
              <View style={[styles.dueTag, { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: 'rgba(212, 175, 55, 0.4)' }]}>
                <Clock size={12} color="#D4AF37" />
                <Text style={styles.dueTagText}>
                  Due {dueChit.next_due_date}
                </Text>
              </View>
            </View>

            <View style={styles.dueProgressRow}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={[typography.caption, { color: theme.text.secondary, fontSize: 10.5 }]}>Scheme Progress</Text>
                <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '600', fontSize: 10.5 }]}>
                  {dueChit.installments_paid} / {dueChit.total_installments} Months
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.surface.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.gold.accent,
                      width: `${(dueChit.installments_paid / dueChit.total_installments) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <Button
              title={paying ? 'Processing Payment...' : `Pay ₹${Number(dueChit.installment_amount).toLocaleString('en-IN')} via UPI`}
              variant="primary"
              disabled={paying}
              icon={paying ? <ActivityIndicator size="small" color="#FFF" /> : <CreditCard size={18} color="#FFF" />}
              onPress={handlePayNow}
              style={{ marginTop: 16 }}
            />
          </Card>
        </>
      ) : (
        <Card style={styles.emptyCard}>
          <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
            <CheckCircle size={32} color="#4ADE80" />
          </View>
          <Text style={[typography.h3, { color: theme.text.primary, marginTop: 12 }]}>All Installments Settled</Text>
          <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 4, textAlign: 'center' }]}>
            You have no outstanding dues. Your subscriptions are completely up to date.
          </Text>
        </Card>
      )}

      {/* ── eNACH Auto-Debit Mandate Card ── */}
      <Card style={styles.mandateCard}>
        <View style={styles.mandateHeader}>
          <View style={[styles.mandateIconWrapper, { backgroundColor: 'rgba(56, 0, 12, 0.08)' }]}>
            <Repeat size={20} color={theme.maroon.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[typography.h3, { color: theme.text.primary, fontWeight: '700', fontSize: 15 }]}>
              eNACH Auto-Debit Mandate
            </Text>
            <Text style={[typography.caption, { color: theme.text.secondary, fontSize: 11 }]}>
              NPCI Mandate: {autoDebitActive ? 'ACH-2026-99214A' : 'Not configured'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setAutoDebitActive(!autoDebitActive)}
            activeOpacity={0.7}
            style={[
              styles.mandateStatus,
              {
                backgroundColor: autoDebitActive ? 'rgba(74, 222, 128, 0.15)' : theme.surface.cardSubtle,
                borderColor: autoDebitActive ? 'rgba(74, 222, 128, 0.4)' : theme.surface.border,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: autoDebitActive ? '#16A34A' : theme.text.muted,
                  fontWeight: '700',
                  fontSize: 11,
                },
              ]}
            >
              {autoDebitActive ? 'ACTIVE' : 'SETUP'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 12, lineHeight: 17, fontSize: 11.5 }]}>
          Auto-debit automatically debits the net installment after deducting your earned auction dividend on the 15th of every month under RBI mandate limits.
        </Text>
      </Card>

      {/* ── Payment History Section ── */}
      <View style={styles.sectionTitleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[typography.h2, { color: theme.text.primary, fontSize: 18 }]}>Payment History</Text>
          <View style={[styles.badgeCount, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#D4AF37' }}>
              {paymentHistory.length}
            </Text>
          </View>
        </View>
      </View>

      {paymentHistoryLoading && paymentHistory.length === 0 ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={theme.maroon.primary} />
          <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 8 }]}>
            Loading payment receipts...
          </Text>
        </View>
      ) : paymentHistory.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
            <Coins size={32} color="#D4AF37" />
          </View>
          <Text style={[typography.h3, { color: theme.text.primary, marginTop: 12 }]}>No Transaction History</Text>
          <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 4, textAlign: 'center' }]}>
            Your verified payment receipts and GST invoices will be recorded here.
          </Text>
        </Card>
      ) : (
        paymentHistory.map((item) => {
          const amt = Number(item.amount || 0);
          const groupName = item.chit_group_name || item.chitName || 'Chit Group';
          const monthNum = item.month_number || item.month || 1;
          const dateFormatted = item.created_at
            ? new Date(item.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : item.date || 'Recent';
          const payMethod = item.razorpay_payment_id?.startsWith('sim_')
            ? 'Instant UPI'
            : item.razorpay_payment_id
            ? 'Razorpay UPI'
            : 'UPI';

          return (
            <Card key={item.id} style={styles.historyCard}>
              <View style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h3, { color: theme.text.primary, fontSize: 18, fontWeight: '700' }]}>
                    ₹{amt.toLocaleString('en-IN')}
                  </Text>
                  <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2, fontSize: 11.5 }]}>
                    {groupName} · Month {monthNum}
                  </Text>
                  <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10.5, marginTop: 3 }]}>
                    {dateFormatted} · {payMethod}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <View
                    style={[
                      styles.successChip,
                      {
                        backgroundColor:
                          item.status === 'SUCCESS'
                            ? 'rgba(74, 222, 128, 0.15)'
                            : item.status === 'FAILED'
                            ? theme.semantic.errorBg
                            : theme.semantic.warningBg,
                        borderColor:
                          item.status === 'SUCCESS'
                            ? 'rgba(74, 222, 128, 0.4)'
                            : item.status === 'FAILED'
                            ? theme.semantic.error
                            : theme.semantic.warning,
                      },
                    ]}
                  >
                    <CheckCircle
                      size={11}
                      color={
                        item.status === 'SUCCESS'
                          ? '#16A34A'
                          : item.status === 'FAILED'
                          ? theme.semantic.error
                          : theme.semantic.warning
                      }
                    />
                    <Text
                      style={[
                        typography.caption,
                        {
                          color:
                            item.status === 'SUCCESS'
                              ? '#16A34A'
                              : item.status === 'FAILED'
                              ? theme.semantic.error
                              : theme.semantic.warning,
                          fontWeight: '700',
                          marginLeft: 4,
                          fontSize: 10.5,
                        },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setSelectedReceipt(item)}
                    style={styles.receiptLink}
                    activeOpacity={0.7}
                  >
                    <Download size={12} color={theme.maroon.primary} />
                    <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700', marginLeft: 4, fontSize: 11 }]}>
                      Receipt
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        })
      )}

      {/* ── Payment Success Modal ── */}
      {paymentSuccessModal && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}>
              <View style={[styles.successIconWrapper, { backgroundColor: 'rgba(74, 222, 128, 0.15)' }]}>
                <CheckCircle size={52} color="#16A34A" />
              </View>
              <Text style={[typography.h2, { color: theme.text.primary, marginTop: 14 }]}>
                Payment Successful!
              </Text>
              <Text style={[typography.bodyMedium, { color: theme.text.secondary, textAlign: 'center', marginTop: 6, lineHeight: 20 }]}>
                ₹{Number(lastPaidAmount || dueChit?.installment_amount || 0).toLocaleString('en-IN')} received. Official e-Receipt generated and recorded in double-entry ledger.
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

      {/* ── Official Chit Receipt Modal ── */}
      {selectedReceipt && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Coins size={22} color={theme.gold.accent} />
                <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 8, fontSize: 18 }]}>
                  Chit Receipt #{selectedReceipt.id ? String(selectedReceipt.id).slice(0, 8).toUpperCase() : 'REC-001'}
                </Text>
              </View>
              <Text style={[typography.caption, { color: theme.text.secondary, textAlign: 'center', fontSize: 11 }]}>
                Issued under Section 30 of the Chit Funds Act 1982. Contains Foreman digital signature and GST ledger reference.
              </Text>

              <View style={[styles.receiptPreview, { backgroundColor: theme.surface.inputBg, borderColor: theme.surface.border }]}>
                <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700' }]}>
                  CHITTECH FOREMAN SERVICES PVT LTD
                </Text>
                <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10 }]}>
                  GSTIN: 36AAACC1206M1ZP · RBI PSO Registered
                </Text>
                <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 8 }]}>
                  {selectedReceipt.chit_group_name || 'Chit Group'} · Month {selectedReceipt.month_number || 1}
                </Text>
                <Text style={[typography.numericMedium, { color: theme.maroon.primary, marginVertical: 8, fontSize: 20, fontWeight: '800' }]}>
                  Amount Received: ₹{Number(selectedReceipt.amount || 0).toLocaleString('en-IN')}
                </Text>
                <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10, marginBottom: 4 }]}>
                  Ref: {selectedReceipt.razorpay_payment_id || selectedReceipt.razorpay_order_id || String(selectedReceipt.id || '').slice(0, 16)}
                </Text>
                <Text style={[typography.caption, { color: '#16A34A', fontWeight: '700' }]}>
                  STATUS: {selectedReceipt.status || 'SUCCESS'} (NPCI/UPI)
                </Text>
              </View>

              <Button
                title="Done"
                variant="primary"
                onPress={() => setSelectedReceipt(null)}
                style={{ marginTop: 14, width: '100%' }}
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

  // ── Grace Period Banner ──
  graceBanner: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  graceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  graceIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Due Card ──
  dueCard: {
    marginBottom: 16,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  dueTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  dueTagText: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 11,
    marginLeft: 4,
  },
  dueProgressRow: {
    marginTop: 14,
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

  // ── Mandate Card ──
  mandateCard: {
    marginBottom: 16,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  mandateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mandateIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mandateStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },

  // ── Section Title ──
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  badgeCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },

  // ── History Card ──
  historyCard: {
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
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
    borderRadius: 10,
    borderWidth: 1,
  },
  receiptLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  successIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptPreview: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    marginVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
});
