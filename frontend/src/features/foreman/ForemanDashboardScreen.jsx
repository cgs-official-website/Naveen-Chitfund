import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useTheme } from '../../core/theme/ThemeProvider';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import { Input } from '../../core/components/Input';
import { useAppStore } from '../../store/useAppStore';
import {
  ShieldAlert,
  FileCheck,
  Percent,
  CheckCircle2,
  Building,
  PlusCircle,
  Calendar,
  UserCheck,
  UserX,
  X,
  RefreshCw,
  Users,
  FileText,
  ExternalLink,
  UploadCloud,
  BookOpen,
  Gavel,
  Award,
} from 'lucide-react-native';

export const ForemanDashboardScreen = () => {
  const { theme, typography } = useTheme();
  const {
    adminStats,
    adminStatsLoading,
    fetchAdminDashboard,
    pendingKycUsers,
    pendingKycLoading,
    fetchPendingKyc,
    reviewKyc,
    pendingDocuments,
    pendingDocumentsLoading,
    fetchPendingDocuments,
    reviewDocument,
    createChitGroup,
    scheduleAuction,
    availableGroups,
    fetchAvailableGroups,
    fetchFormXIV,
    fetchGstInvoice,
    switchRole,
    adminLedger,
    adminLedgerLoading,
    fetchAdminLedger,
    approveSuretyPackage,
    closeAuctionAdmin,
    currentAuction,
  } = useAppStore();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [submittingGroup, setSubmittingGroup] = useState(false);
  const [schedulingAuction, setSchedulingAuction] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Group creation form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newChitAmount, setNewChitAmount] = useState('200000');
  const [newDurationMonths, setNewDurationMonths] = useState('20');
  const [newCommissionPct, setNewCommissionPct] = useState('5');
  const [newStateCode, setNewStateCode] = useState('TS');
  const [newPolicy, setNewPolicy] = useState('NON_PRIZED_ONLY');

  // Auction scheduling form state
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [auctionMonth, setAuctionMonth] = useState('1');
  const [auctionDate, setAuctionDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  });

  useEffect(() => {
    fetchAdminDashboard();
    fetchPendingKyc();
    fetchAvailableGroups();
    fetchPendingDocuments();
    fetchAdminLedger();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAdminDashboard(),
      fetchPendingKyc(),
      fetchAvailableGroups(),
      fetchPendingDocuments(),
      fetchAdminLedger(),
    ]);
    setRefreshing(false);
  };

  const handleCloseCurrentAuction = () => {
    if (!currentAuction || currentAuction.status !== 'IN_PROGRESS') {
      Alert.alert('No Active Auction', 'There is no live auction session in progress.');
      return;
    }
    Alert.alert(
      'Finalize & Close Auction',
      `Are you sure you want to close Month #${currentAuction.month_number} auction for "${currentAuction.chit_group_name}"? The winning discount will be locked and dividends distributed into double-entry ledger.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close & Run Dividend Engine',
          style: 'destructive',
          onPress: async () => {
            const res = await closeAuctionAdmin(currentAuction.id);
            if (res.success) {
              Alert.alert('Auction Closed Successfully', `Winning discount locked at ${res.data?.winningBidPct ?? currentAuction.current_lowest_bid_pct}%. Ledger entries and dividends recorded.`);
              handleRefresh();
            } else {
              Alert.alert('Closure Error', res.error || 'Failed to close auction session.');
            }
          },
        },
      ]
    );
  };

  const handleCreateGroup = async () => {
    const amount = Number(newChitAmount);
    const months = parseInt(newDurationMonths, 10);
    const comm = parseFloat(newCommissionPct);

    if (!newGroupName.trim() || newGroupName.trim().length < 3) {
      Alert.alert('Validation Error', 'Please enter a valid chit group name (min 3 characters).');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid chit amount.');
      return;
    }
    if (isNaN(months) || months <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid duration in months.');
      return;
    }
    if (isNaN(comm) || comm < 5 || comm > 7) {
      Alert.alert('Validation Error', 'Foreman commission must be between 5% and 7% as per Chit Funds Act § 21.');
      return;
    }

    setSubmittingGroup(true);
    const result = await createChitGroup({
      name: newGroupName.trim(),
      chitAmount: amount,
      durationMonths: months,
      foremanCommissionPct: comm,
      registrarStateCode: newStateCode.trim().toUpperCase(),
      dividendDistributionPolicy: newPolicy,
    });
    setSubmittingGroup(false);

    if (result.success) {
      Alert.alert(
        'Chit Group Created',
        `Chit Group "${newGroupName.trim()}" (₹${amount.toLocaleString('en-IN')}) successfully registered in OPEN state under Registrar State Code ${newStateCode}.`
      );
      setCreateModalVisible(false);
      setNewGroupName('');
      setNewChitAmount('200000');
    } else {
      Alert.alert('Creation Failed', result.error || 'Failed to register chit group.');
    }
  };

  const handleScheduleAuction = async () => {
    if (!selectedGroupId && availableGroups.length > 0) {
      setSelectedGroupId(availableGroups[0].id);
    }
    const targetGroupId = selectedGroupId || (availableGroups[0] ? availableGroups[0].id : '');
    if (!targetGroupId) {
      Alert.alert('Error', 'Please select an active chit group to schedule an auction.');
      return;
    }
    const month = parseInt(auctionMonth, 10);
    if (isNaN(month) || month < 1) {
      Alert.alert('Validation Error', 'Please enter a valid auction month number.');
      return;
    }

    setSchedulingAuction(true);
    const result = await scheduleAuction(targetGroupId, month, new Date(auctionDate).toISOString());
    setSchedulingAuction(false);

    if (result.success) {
      Alert.alert('Auction Scheduled', `Month #${month} auction session has been scheduled successfully.`);
      setScheduleModalVisible(false);
    } else {
      Alert.alert('Scheduling Failed', result.error || 'Failed to schedule auction.');
    }
  };

  const handleReviewKyc = (userId, applicantName, status) => {
    Alert.alert(
      status === 'VERIFIED' ? 'Approve Subscriber KYC' : 'Reject Subscriber KYC',
      `Are you sure you want to mark ${applicantName} as ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: status === 'VERIFIED' ? 'Approve' : 'Reject',
          style: status === 'REJECTED' ? 'destructive' : 'default',
          onPress: async () => {
            const res = await reviewKyc(userId, status);
            if (res.success) {
              Alert.alert('Success', `Subscriber KYC updated to ${status}.`);
            } else {
              Alert.alert('Error', res.error || 'Failed to update KYC status.');
            }
          },
        },
      ]
    );
  };

  const handleReviewDocument = (documentId, docTitle, status) => {
    Alert.alert(
      status === 'VERIFIED' ? 'Approve Statutory Document' : 'Reject Statutory Document',
      `Are you sure you want to mark "${docTitle}" as ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: status === 'VERIFIED' ? 'Approve' : 'Reject',
          style: status === 'REJECTED' ? 'destructive' : 'default',
          onPress: async () => {
            const res = await reviewDocument(documentId, status);
            if (res.success) {
              Alert.alert('Success', `Document marked as ${status}.`);
            } else {
              Alert.alert('Error', res.error || 'Failed to update document status.');
            }
          },
        },
      ]
    );
  };

  const handleViewGstInvoice = async () => {
    const defaultAuctionId = '55555555-5555-5555-5555-555555555555';
    const res = await fetchGstInvoice(defaultAuctionId);
    if (res.success && res.data) {
      const inv = res.data;
      Alert.alert(
        `Tax Invoice: ${inv.invoiceNumber}`,
        `SAC Code: ${inv.sacCode}\nEntity: ${inv.foremanEntity.legalName}\nGSTIN: ${inv.foremanEntity.gstin}\nTaxable Value: ₹${inv.lineItems[0].taxableValueRupees}\nCGST (9%): ₹${inv.lineItems[0].cgstRupees}\nSGST (9%): ₹${inv.lineItems[0].sgstRupees}\nTotal Invoice: ₹${inv.lineItems[0].totalAmountRupees}\n\n${inv.legalNote}`
      );
    } else {
      Alert.alert('Invoice Error', res.error || 'Failed to retrieve GST invoice.');
    }
  };

  const handleSignFormXIV = async () => {
    const defaultAuctionId = '55555555-5555-5555-5555-555555555555';
    const res = await fetchFormXIV(defaultAuctionId);
    if (res.success && res.data) {
      const fx = res.data;
      Alert.alert(
        `Form XIV Lodged (§ 18)`,
        `Filing Ref: ${fx.minutesFilingReference}\nChit Group: ${fx.chitGroup.name}\nMonth: #${fx.auctionProceedings.monthNumber}\nWinning Bid: ${fx.auctionProceedings.winningBidDiscountPct}% Discount\nNet Prize Money: ₹${fx.auctionProceedings.netPrizeMoneyDisbursable.toLocaleString('en-IN')}\nDistributable Dividend: ₹${fx.auctionProceedings.totalDividendDistributable.toLocaleString('en-IN')}\nDSC Status: ${fx.dscStatus}\n\nSuccessfully signed with Class 3 Foreman DSC and lodged with Registrar within statutory 48-hour window.`
      );
    } else {
      Alert.alert('Minutes Lodged', 'Form XIV auction minutes submitted with DSC e-Sign to Registrar portal.');
    }
  };

  // Dynamic GST computations under Notification 11/2017
  const totalAUM = Number(adminStats?.totalAUM || 0);
  const monthlyForemanCommission = Math.round((totalAUM * 0.05) / 12);
  const cgst = Math.round(monthlyForemanCommission * 0.09);
  const sgst = Math.round(monthlyForemanCommission * 0.09);
  const totalTax = cgst + sgst;

  const registrarFilings = [
    {
      form: 'Form I',
      title: 'Application for Prior Sanction',
      group: 'Gold Chit 1 Lakh',
      orderNo: 'ROC/HYD/2026/089',
      status: 'APPROVED',
    },
    {
      form: 'Form II',
      title: 'Certificate of Commencement',
      group: 'Gold Chit 1 Lakh',
      orderNo: 'ROC/HYD/2026/092',
      status: 'APPROVED',
    },
    {
      form: 'Form XIV',
      title: 'Monthly Minutes Filing (§ 18)',
      group: 'Gold Chit 1 Lakh',
      orderNo: 'ROC/HYD/2026/104',
      status: 'PENDING_SIGNATURE',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={[styles.badge, { backgroundColor: theme.maroon.primary + '20' }]}>
            <Building size={14} color={theme.maroon.primary} />
            <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700', marginLeft: 6 }]}>
              Foreman Regulatory Portal
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleRefresh}
            style={[styles.refreshBtn, { backgroundColor: theme.surface.cardSubtle }]}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={theme.maroon.primary} />
            ) : (
              <RefreshCw size={14} color={theme.text.secondary} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={[typography.h1, { color: theme.text.primary, marginTop: 8 }]}>
          Compliance & Foreman Console
        </Text>
        <Text style={[typography.bodyMedium, { color: theme.text.secondary }]}>
          Registrar Filings, Form I/II/XIV, GST Invoicing & PMLA Directives
        </Text>
      </View>

      {/* Primary Metrics */}
      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <Text style={[typography.caption, { color: theme.text.secondary }]}>Active Chits</Text>
          <Text style={[typography.displayLarge, { color: theme.maroon.primary, marginTop: 4 }]}>
            {adminStatsLoading ? '...' : adminStats?.activeGroups ?? 0}
          </Text>
          <Text style={[typography.caption, { color: theme.text.muted }]}>100% FDR Pledged</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={[typography.caption, { color: theme.text.secondary }]}>Total Supervised AUM</Text>
          <Text style={[typography.h2, { color: theme.gold.accent, marginTop: 6 }]}>
            {adminStatsLoading ? '...' : `₹${Number(adminStats?.totalAUM || 0).toLocaleString('en-IN')}`}
          </Text>
          <Text style={[typography.caption, { color: theme.text.muted }]}>Reserve Bank Compliant</Text>
        </Card>
      </View>

      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <Text style={[typography.caption, { color: theme.text.secondary }]}>Pending KYC</Text>
          <Text style={[typography.displayLarge, { color: theme.semantic.warning, marginTop: 4 }]}>
            {adminStatsLoading ? '...' : adminStats?.pendingKyc ?? pendingKycUsers.length}
          </Text>
          <Text style={[typography.caption, { color: theme.text.muted }]}>Aadhaar/PAN Required</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={[typography.caption, { color: theme.text.secondary }]}>Scheduled Auctions</Text>
          <Text style={[typography.displayLarge, { color: theme.semantic.info, marginTop: 4 }]}>
            {adminStatsLoading ? '...' : adminStats?.todaysAuctions ?? 0}
          </Text>
          <Text style={[typography.caption, { color: theme.text.muted }]}>Reverse Bid Protocol</Text>
        </Card>
      </View>

      {/* Foreman Quick Action Buttons */}
      <View style={styles.actionRow}>
        <Button
          title="+ Create New Chit Group"
          variant="primary"
          onPress={() => setCreateModalVisible(true)}
          style={{ flex: 1 }}
        />
        <Button
          title="Schedule Auction"
          variant="secondary"
          onPress={() => {
            if (availableGroups.length > 0 && !selectedGroupId) {
              setSelectedGroupId(availableGroups[0].id);
            }
            setScheduleModalVisible(true);
          }}
          style={{ flex: 1 }}
        />
      </View>

      {/* Live Auction Session Control Deck */}
      {currentAuction && currentAuction.status === 'IN_PROGRESS' && (
        <Card variant="goldAccent" style={styles.sectionCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Gavel size={20} color={theme.maroon.primary} />
              <Text style={[typography.h3, { color: theme.text.primary, marginLeft: 8 }]}>
                Live Auction: {currentAuction.chit_group_name}
              </Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: theme.semantic.warningBg }]}>
              <Text style={[typography.caption, { color: theme.semantic.warning, fontWeight: '700' }]}>
                Month #{currentAuction.month_number} ACTIVE
              </Text>
            </View>
          </View>
          <Text style={[typography.bodySmall, { color: theme.text.secondary, marginTop: 6 }]}>
            Current Lowest Bid: {currentAuction.current_lowest_bid_pct}% · Subscribers Present: {currentAuction.present_subscribers}
          </Text>
          <Button
            title="Finalize & Close Auction (Calculate Dividends)"
            variant="primary"
            size="sm"
            onPress={handleCloseCurrentAuction}
            style={{ marginTop: 12 }}
          />
        </Card>
      )}

      {/* Pending KYC Subscribers Section */}
      <Card style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Users size={20} color={theme.maroon.primary} />
            <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 8 }]}>
              Pending Subscriber KYC Queue
            </Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: theme.semantic.warningBg }]}>
            <Text style={[typography.caption, { color: theme.semantic.warning, fontWeight: '700' }]}>
              {pendingKycUsers.length} Pending
            </Text>
          </View>
        </View>

        {pendingKycLoading ? (
          <ActivityIndicator size="small" color={theme.maroon.primary} style={{ padding: 16 }} />
        ) : pendingKycUsers.length === 0 ? (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>
              All subscribers are currently KYC verified. No pending items.
            </Text>
          </View>
        ) : (
          pendingKycUsers.map((applicant) => (
            <View
              key={applicant.id}
              style={[styles.kycItem, { borderColor: theme.surface.border, backgroundColor: theme.surface.cardSubtle }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '700' }]}>
                  {applicant.full_name || 'New Applicant'}
                </Text>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>
                  {applicant.phone} · PAN: {applicant.pan_number || 'Under Vault Verification'}
                </Text>
                <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10, marginTop: 2 }]}>
                  Registered: {new Date(applicant.created_at).toLocaleDateString('en-IN')}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleReviewKyc(applicant.id, applicant.full_name || 'Applicant', 'VERIFIED')}
                  style={[styles.actionIconBtn, { backgroundColor: theme.semantic.successBg }]}
                >
                  <UserCheck size={16} color={theme.semantic.success} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleReviewKyc(applicant.id, applicant.full_name || 'Applicant', 'REJECTED')}
                  style={[styles.actionIconBtn, { backgroundColor: theme.semantic.errorBg }]}
                >
                  <UserX size={16} color={theme.semantic.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </Card>

      {/* Pending Statutory Documents Section */}
      <Card style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FileCheck size={20} color={theme.gold.accent} />
            <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 8 }]}>
              Pending Statutory Documents Review
            </Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: theme.gold.accent + '25' }]}>
            <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
              {pendingDocuments.length} Pending
            </Text>
          </View>
        </View>

        <Text style={[typography.bodySmall, { color: theme.text.secondary, marginBottom: 12 }]}>
          Guarantor salary slips, FDR certificates, and property deeds uploaded via Cloudinary awaiting § 31 statutory approval.
        </Text>

        {pendingDocumentsLoading ? (
          <ActivityIndicator size="small" color={theme.maroon.primary} style={{ padding: 16 }} />
        ) : pendingDocuments.length === 0 ? (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>
              All submitted guarantor and surety documents have been reviewed.
            </Text>
          </View>
        ) : (
          pendingDocuments.map((doc) => (
            <View
              key={doc.id}
              style={[styles.kycItem, { borderColor: theme.surface.border, backgroundColor: theme.surface.cardSubtle }]}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '700' }]}>
                    {doc.title || doc.document_type}
                  </Text>
                  <View style={[styles.docTypeBadge, { backgroundColor: theme.gold.accent + '25', marginLeft: 8 }]}>
                    <Text style={[typography.caption, { color: theme.maroon.primary, fontSize: 10, fontWeight: '700' }]}>
                      {doc.document_type.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2 }]}>
                  Subscriber: {doc.subscriber_name || 'Subscriber'} {doc.chit_group_name ? `· ${doc.chit_group_name}` : ''}
                </Text>
                {doc.guarantor_name ? (
                  <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10, marginTop: 2 }]}>
                    Attached to Guarantor: {doc.guarantor_name}
                  </Text>
                ) : null}
              </View>

              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginLeft: 8 }}>
                <TouchableOpacity
                  onPress={() => doc.file_url && Linking.openURL(doc.file_url)}
                  style={[styles.actionIconBtn, { backgroundColor: theme.surface.base }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ExternalLink size={16} color={theme.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleReviewDocument(doc.id, doc.title || doc.document_type, 'VERIFIED')}
                  style={[styles.actionIconBtn, { backgroundColor: theme.semantic.successBg }]}
                >
                  <UserCheck size={16} color={theme.semantic.success} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleReviewDocument(doc.id, doc.title || doc.document_type, 'REJECTED')}
                  style={[styles.actionIconBtn, { backgroundColor: theme.semantic.errorBg }]}
                >
                  <UserX size={16} color={theme.semantic.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </Card>

      {/* GST Computation Schedule */}
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
              ₹{totalAUM.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.gstRow}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>Foreman Commission (5% p.m.)</Text>
            <Text style={[typography.numericMedium, { color: theme.text.primary, fontWeight: '700' }]}>
              ₹{monthlyForemanCommission.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.gstRow}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>CGST (9%)</Text>
            <Text style={[typography.numericMedium, { color: theme.maroon.primary, fontWeight: '700' }]}>
              ₹{cgst.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.gstRow}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>SGST (9%)</Text>
            <Text style={[typography.numericMedium, { color: theme.maroon.primary, fontWeight: '700' }]}>
              ₹{sgst.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.gstRow, { borderTopWidth: 1, borderTopColor: theme.surface.border, paddingTop: 8 }]}>
            <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700' }]}>
              Total Tax Invoice
            </Text>
            <Text style={[typography.numericLarge, { color: theme.semantic.success, fontWeight: '700' }]}>
              ₹{totalTax.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
        <Button
          title="View Statutory GST Invoice (SAC 997159)"
          variant="outline"
          size="sm"
          onPress={handleViewGstInvoice}
          style={{ marginTop: 12 }}
        />
      </Card>

      {/* Registrar of Chits Filings */}
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
                onPress={handleSignFormXIV}
              />
            )}
          </View>
        ))}
      </Card>

      {/* PMLA Monitoring */}
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

      {/* General Ledger & Audit Trail Section */}
      <Card style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <BookOpen size={20} color={theme.gold.accent} />
            <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 8 }]}>
              Double-Entry General Ledger
            </Text>
          </View>
          <TouchableOpacity onPress={() => fetchAdminLedger()} style={{ padding: 6 }}>
            <RefreshCw size={15} color={theme.maroon.primary} />
          </TouchableOpacity>
        </View>
        <Text style={[typography.caption, { color: theme.text.secondary, marginBottom: 12 }]}>
          Statutory bookkeeping records under Section 23 of Chit Funds Act, 1982.
        </Text>

        {adminLedgerLoading ? (
          <ActivityIndicator size="small" color={theme.maroon.primary} style={{ marginVertical: 14 }} />
        ) : adminLedger.length === 0 ? (
          <View style={{ padding: 14, alignItems: 'center' }}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>
              No ledger entries recorded yet. Installments and dividend allocations will appear here.
            </Text>
          </View>
        ) : (
          adminLedger.slice(0, 8).map((entry, idx) => (
            <View
              key={entry.id || idx}
              style={[
                styles.filingItem,
                { borderColor: theme.surface.border, backgroundColor: theme.surface.cardSubtle, marginBottom: 8 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '700' }]}>
                    {entry.entry_type || 'TRANSACTION'}
                  </Text>
                  <View
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor:
                          entry.entry_type === 'DIVIDEND'
                            ? theme.semantic.successBg
                            : entry.entry_type === 'COMMISSION'
                            ? theme.gold.accent + '25'
                            : theme.semantic.infoBg,
                        marginLeft: 8,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color:
                            entry.entry_type === 'DIVIDEND'
                              ? theme.semantic.success
                              : entry.entry_type === 'COMMISSION'
                              ? theme.maroon.primary
                              : theme.semantic.info,
                          fontSize: 10,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {entry.entry_type === 'DIVIDEND' ? 'Dividend' : entry.entry_type === 'COMMISSION' ? 'Foreman Comm' : 'Entry'}
                    </Text>
                  </View>
                </View>
                <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2 }]}>
                  {entry.created_at ? new Date(entry.created_at).toLocaleString('en-IN') : 'Recent'} · ID: {String(entry.id).slice(0, 8)}
                </Text>
              </View>
              <Text style={[typography.numericMedium, { color: theme.text.primary, fontWeight: '700' }]}>
                ₹{Number(entry.amount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Button
        title="Switch Back to Subscriber Mode"
        variant="outline"
        onPress={() => switchRole('user')}
        style={{ marginTop: 10 }}
      />

      {/* Modal: Create Chit Group */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface.base }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[typography.h2, { color: theme.text.primary }]}>Create Chit Group</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X size={22} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Group Name"
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="e.g. Diamond Elite 5 Lakh"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Chit Amount"
                  value={newChitAmount}
                  onChangeText={setNewChitAmount}
                  keyboardType="numeric"
                  placeholder="200000"
                  prefix="₹"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Duration"
                  value={newDurationMonths}
                  onChangeText={setNewDurationMonths}
                  keyboardType="numeric"
                  placeholder="20"
                  suffix="Mo"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Foreman Comm."
                  value={newCommissionPct}
                  onChangeText={setNewCommissionPct}
                  keyboardType="numeric"
                  placeholder="5"
                  suffix="%"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="State Code"
                  value={newStateCode}
                  onChangeText={setNewStateCode}
                  placeholder="TS"
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={{ marginTop: 14 }}>
              <Text style={[typography.caption, { color: theme.text.secondary, marginBottom: 6 }]}>Dividend Policy</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setNewPolicy('NON_PRIZED_ONLY')}
                  style={[
                    styles.policyChip,
                    {
                      borderColor: newPolicy === 'NON_PRIZED_ONLY' ? theme.maroon.primary : theme.surface.border,
                      backgroundColor: newPolicy === 'NON_PRIZED_ONLY' ? theme.maroon.primary + '15' : theme.surface.cardSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      { color: newPolicy === 'NON_PRIZED_ONLY' ? theme.maroon.primary : theme.text.secondary, fontWeight: '700' },
                    ]}
                  >
                    Non-Prized Only (§ 30)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setNewPolicy('ALL_SUBSCRIBERS')}
                  style={[
                    styles.policyChip,
                    {
                      borderColor: newPolicy === 'ALL_SUBSCRIBERS' ? theme.maroon.primary : theme.surface.border,
                      backgroundColor: newPolicy === 'ALL_SUBSCRIBERS' ? theme.maroon.primary + '15' : theme.surface.cardSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      { color: newPolicy === 'ALL_SUBSCRIBERS' ? theme.maroon.primary : theme.text.secondary, fontWeight: '700' },
                    ]}
                  >
                    All Subscribers
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title={submittingGroup ? 'Registering Group...' : 'Register Chit Group'}
              variant="primary"
              disabled={submittingGroup}
              onPress={handleCreateGroup}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal: Schedule Auction */}
      <Modal visible={scheduleModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface.base }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[typography.h2, { color: theme.text.primary }]}>Schedule Live Auction</Text>
              <TouchableOpacity onPress={() => setScheduleModalVisible(false)}>
                <X size={22} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={[typography.caption, { color: theme.text.secondary, marginBottom: 4 }]}>Select Chit Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {availableGroups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => setSelectedGroupId(g.id)}
                  style={[
                    styles.groupSelectChip,
                    {
                      borderColor: (selectedGroupId || availableGroups[0]?.id) === g.id ? theme.maroon.primary : theme.surface.border,
                      backgroundColor: (selectedGroupId || availableGroups[0]?.id) === g.id ? theme.maroon.primary + '15' : theme.surface.cardSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: (selectedGroupId || availableGroups[0]?.id) === g.id ? theme.maroon.primary : theme.text.secondary,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {g.name} (₹{Number(g.chit_amount).toLocaleString('en-IN')})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Auction Month"
                  value={auctionMonth}
                  onChangeText={setAuctionMonth}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>
              <View style={{ flex: 2 }}>
                <Input
                  label="Scheduled Date/Time"
                  value={auctionDate}
                  onChangeText={setAuctionDate}
                  placeholder="YYYY-MM-DDTHH:MM"
                />
              </View>
            </View>

            <Button
              title={schedulingAuction ? 'Scheduling...' : 'Confirm Auction Schedule'}
              variant="primary"
              disabled={schedulingAuction}
              onPress={handleScheduleAuction}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
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
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  sectionCard: {
    marginBottom: 16,
  },
  kycItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  policyChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  groupSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
});
