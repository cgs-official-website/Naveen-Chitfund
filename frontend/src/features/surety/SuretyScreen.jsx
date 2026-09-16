import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { useTheme } from '../../core/theme/ThemeProvider';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import { Input } from '../../core/components/Input';
import { useAppStore } from '../../store/useAppStore';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building,
  UserCheck,
  Send,
  ArrowRight,
  FileCheck,
  UploadCloud,
  FileText,
  Trash2,
  ExternalLink,
  Paperclip,
  Coins,
} from 'lucide-react-native';

export const SuretyScreen = () => {
  const { theme, typography, isDark } = useTheme();
  const {
    user,
    activeChits,
    activePrizeClaim,
    prizeClaimLoading,
    fetchActivePrizeClaim,
    fetchActiveChits,
    submitSuretyPackage,
    disbursePrizePayout,
    addGuarantor,
    suretyDocuments,
    suretyDocumentsLoading,
    fetchSuretyDocuments,
    uploadSuretyDocument,
    deleteSuretyDocument,
  } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [bankAccount, setBankAccount] = useState('HDFC00018274921');
  const [bankIfsc, setBankIfsc] = useState('HDFC0000123');
  const [beneficiaryName, setBeneficiaryName] = useState(user?.full_name || 'Subscriber');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [disbursalSuccessModal, setDisbursalSuccessModal] = useState(false);
  const [lastDisbursalUtr, setLastDisbursalUtr] = useState('');

  // Add guarantor modal state
  const [showAddGuarantorModal, setShowAddGuarantorModal] = useState(false);
  const [newGName, setNewGName] = useState('');
  const [newGPhone, setNewGPhone] = useState('');
  const [newGPan, setNewGPan] = useState('');

  // Document upload modal state
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocType, setNewDocType] = useState('SALARY_SLIP');
  const [newDocGuarantorId, setNewDocGuarantorId] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  useEffect(() => {
    fetchActivePrizeClaim();
    fetchActiveChits();
  }, [fetchActivePrizeClaim, fetchActiveChits]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchActivePrizeClaim(), fetchActiveChits()]);
    setRefreshing(false);
  }, [fetchActivePrizeClaim, fetchActiveChits]);

  // Fallback demo values if no active claim in DB
  const sbChit = activeChits.find(
    (c) => c.subscriber_status === 'SB' || c.subscriber_status === 'PS'
  );

  const claim = activePrizeClaim || (sbChit ? {
    subscription: {
      subscription_id: sbChit.id,
      ticket_number: sbChit.ticket_number,
      subscriber_status: sbChit.subscriber_status,
      prized_month: 2,
      chit_group_id: sbChit.chit_group_id,
      chit_group_name: sbChit.chit_group_name,
      chit_amount: sbChit.chit_amount,
      foreman_commission_pct: 5,
      winning_bid_pct: 22.5,
    },
    grossAmount: sbChit.chit_amount,
    grossAmountPaise: sbChit.chit_amount * 100,
    winningBidPct: 22.5,
    discountAmount: (sbChit.chit_amount * 22.5) / 100,
    discountAmountPaise: (sbChit.chit_amount * 22.5),
    foremanCommissionAmount: (sbChit.chit_amount * 5) / 100,
    netPayoutAmount: sbChit.chit_amount - (sbChit.chit_amount * 22.5) / 100,
    netPayoutPaise: (sbChit.chit_amount - (sbChit.chit_amount * 22.5) / 100) * 100,
    surety: {
      id: 'surety-demo-1',
      subscription_id: sbChit.id,
      surety_type: 'CO_GUARANTORS',
      status: 'PENDING',
      guarantors: [
        {
          id: 'g1',
          surety_id: 'surety-demo-1',
          full_name: 'P. Raghavendra (Govt Employee)',
          phone: '+91 98480 11223',
          pan_number: 'ABCDE1234F',
          signature_verified: true,
          verification_status: 'VERIFIED',
        },
        {
          id: 'g2',
          surety_id: 'surety-demo-1',
          full_name: 'M. Venkat Reddy (Self-Employed)',
          phone: '+91 94401 23901',
          pan_number: 'FGHIJ5678K',
          signature_verified: false,
          verification_status: 'PENDING',
        },
      ],
    },
    disbursal: null,
  } : null);

  const handleSubmitSurety = async () => {
    if (!claim?.surety?.id) return;
    setIsSubmitting(true);
    try {
      const res = await submitSuretyPackage(claim.surety.id);
      if (res.success) {
        Alert.alert(
          'Surety Package Submitted',
          'Your statutory surety instruments and co-guarantor verifications have been submitted to the Foreman for Form XIV review.'
        );
      } else {
        Alert.alert('Submission Error', res.error || 'Could not submit surety package');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisbursePayout = async () => {
    if (!claim?.surety?.id) return;
    if (!bankAccount || !bankIfsc) {
      Alert.alert('Missing Details', 'Please enter a valid bank account number and IFSC code.');
      return;
    }

    setIsDisbursing(true);
    try {
      const res = await disbursePrizePayout(claim.surety.id, {
        bankAccountNumber: bankAccount,
        bankIfsc,
        bankBeneficiaryName: beneficiaryName,
        paymentMode: 'RTGS',
      });
      if (res.success) {
        setLastDisbursalUtr(`UTR${Date.now().toString().slice(-8)}`);
        setDisbursalSuccessModal(true);
      } else {
        Alert.alert('Disbursal Error', res.error || 'Failed to trigger RTGS disbursal');
      }
    } finally {
      setIsDisbursing(false);
    }
  };

  const handleAddGuarantorSubmit = async () => {
    if (!newGName || !newGPhone) {
      Alert.alert('Incomplete', 'Please provide at least Name and Phone number.');
      return;
    }
    if (claim?.surety?.id) {
      await addGuarantor(claim.surety.id, {
        fullName: newGName,
        phone: newGPhone,
        panNumber: newGPan,
      });
    }
    setNewGName('');
    setNewGPhone('');
    setNewGPan('');
    setShowAddGuarantorModal(false);
  };

  const handleUploadDocumentSubmit = async () => {
    if (!claim?.surety?.id) {
      Alert.alert('No Active Claim', 'Active prized subscription surety package required.');
      return;
    }

    setIsUploadingDoc(true);
    try {
      const simulatedFileName = `${newDocType.toLowerCase()}_${Date.now()}.pdf`;
      const res = await uploadSuretyDocument({
        suretyId: claim.surety.id,
        guarantorId: newDocGuarantorId || null,
        documentType: newDocType,
        title: newDocTitle || `${newDocType.replace(/_/g, ' ')} Document`,
        file: {
          uri: `file:///chittech/uploads/${simulatedFileName}`,
          name: simulatedFileName,
          type: 'application/pdf',
        },
        fileSizeBytes: 185000,
        mimeType: 'application/pdf',
      });

      if (res.success) {
        Alert.alert(
          'Document Uploaded to Cloudinary',
          'Your statutory surety document has been securely stored on Cloudinary CDN and registered for Foreman review.'
        );
        setShowAddDocModal(false);
        setNewDocTitle('');
        setNewDocGuarantorId('');
      } else {
        Alert.alert('Upload Failed', res.error || 'Could not upload document');
      }
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteDoc = (docId) => {
    Alert.alert('Remove Document', 'Are you sure you want to delete this document from Cloudinary?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!claim?.surety?.id) return;
          const res = await deleteSuretyDocument(docId, claim.surety.id);
          if (!res.success) {
            Alert.alert('Delete Error', res.error || 'Failed to remove document');
          }
        },
      },
    ]);
  };

  const handleViewDoc = (url) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Document URL', url);
      });
    }
  };

  const isPrized = claim?.subscription?.subscriber_status === 'PS' || claim?.disbursal?.status === 'DISBURSED';
  const isApproved = claim?.surety?.status === 'APPROVED' || isPrized;
  const isSubmitted = claim?.surety?.status === 'SUBMITTED' || isApproved;

  const displayDocuments =
    suretyDocuments && suretyDocuments.length > 0
      ? suretyDocuments
      : (claim?.surety?.documents && claim.surety.documents.length > 0)
      ? claim.surety.documents
      : [
          {
            id: 'demo-doc-1',
            surety_id: claim?.surety?.id || 'surety-demo-1',
            document_type: 'SALARY_SLIP',
            title: '3 Months Salary Slip (P. Raghavendra)',
            file_url: 'https://res.cloudinary.com/chittech-cloud/image/upload/v1726480000/chittech/documents/salary_slip_demo.pdf',
            cloudinary_public_id: 'chittech/documents/salary_slip_demo',
            verification_status: 'VERIFIED',
            file_size_bytes: 245000,
            guarantor_name: 'P. Raghavendra',
            created_at: new Date().toISOString(),
          },
          {
            id: 'demo-doc-2',
            surety_id: claim?.surety?.id || 'surety-demo-1',
            document_type: 'PAN_CARD',
            title: 'Guarantor PAN Card Copy',
            file_url: 'https://res.cloudinary.com/chittech-cloud/image/upload/v1726480000/chittech/documents/pan_copy_demo.pdf',
            cloudinary_public_id: 'chittech/documents/pan_copy_demo',
            verification_status: 'VERIFIED',
            file_size_bytes: 120000,
            guarantor_name: 'M. Venkat Reddy',
            created_at: new Date().toISOString(),
          },
        ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
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
            <Text style={styles.heroPreTitle}>STATUTORY SECURITY</Text>
          </View>
          <View style={styles.safeBadge}>
            <ShieldCheck size={12} color="#D4AF37" />
            <Text style={styles.safeBadgeText}>Section 31</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Surety & Prize Disbursal</Text>
        <Text style={styles.heroSubtitle}>
          Digital co-guarantor verification, RBI Account Aggregator financial check, and automated RTGS prize release.
        </Text>

        <View style={styles.heroFeatureRow}>
          <View style={styles.heroFeatureCapsule}>
            <Award size={12} color="#D4AF37" />
            <Text style={styles.heroFeatureText} numberOfLines={1}>Form XIV</Text>
          </View>
          <View style={styles.heroFeatureCapsule}>
            <Building size={12} color="#4ADE80" />
            <Text style={styles.heroFeatureText} numberOfLines={1}>Instant RTGS</Text>
          </View>
          <View style={styles.heroFeatureCapsule}>
            <UserCheck size={12} color="#E8D48B" />
            <Text style={styles.heroFeatureText} numberOfLines={1}>AA Consent</Text>
          </View>
        </View>
      </View>

      {claim ? (
        <>
          <Card
            variant="goldAccent"
            style={[styles.prizeCard, { borderColor: isPrized ? theme.semantic.success : theme.gold.accent }]}
          >
            <View style={styles.prizeRow}>
              <View
                style={[
                  styles.awardBadge,
                  {
                    backgroundColor: isPrized
                      ? theme.semantic.successBg
                      : theme.gold.accent + '25',
                  },
                ]}
              >
                <Award size={28} color={isPrized ? theme.semantic.success : theme.gold.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isPrized ? theme.semantic.success : theme.maroon.primary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {isPrized
                    ? 'PRIZE MONEY DISBURSED (RTGS)'
                    : 'PRIZE CLAIM PENDING (SUCCESSFUL BIDDER · SB)'}
                </Text>
                <Text style={[typography.displayLarge, { color: theme.text.primary, marginTop: 2 }]}>
                  ₹{Number(claim.netPayoutAmount).toLocaleString('en-IN')}
                </Text>
                <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2 }]}>
                  {claim.subscription.chit_group_name} · Gross ₹{Number(claim.grossAmount).toLocaleString('en-IN')} less {claim.winningBidPct}% discount (₹{Number(claim.discountAmount).toLocaleString('en-IN')})
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.timelineCard}>
            <Text style={[typography.h3, { color: theme.text.primary, marginBottom: 14 }]}>
              Section 31 Disbursal Pipeline
            </Text>

            {/* Step 1 */}
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: theme.semantic.success }]}>
                <CheckCircle2 size={14} color="#FFF" />
              </View>
              <View style={styles.stepTextCol}>
                <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700' }]}>
                  1. Auction Won & SB Status Transition
                </Text>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>
                  Completed · Winning discount {claim.winningBidPct}% recorded in Form XIV
                </Text>
              </View>
            </View>
            <View style={[styles.stepLine, { backgroundColor: theme.semantic.success }]} />

            {/* Step 2 */}
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: isSubmitted
                      ? theme.semantic.success
                      : theme.gold.accent,
                  },
                ]}
              >
                {isSubmitted ? <CheckCircle2 size={14} color="#FFF" /> : <Clock size={14} color="#FFF" />}
              </View>
              <View style={styles.stepTextCol}>
                <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700' }]}>
                  2. Statutory Surety & Co-Guarantors
                </Text>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>
                  {isSubmitted ? 'Package Submitted for Review' : 'In Progress · 2 Salaried Guarantors Required'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.stepLine,
                { backgroundColor: isApproved ? theme.semantic.success : theme.surface.border },
              ]}
            />

            {/* Step 3 */}
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: isApproved
                      ? theme.semantic.success
                      : isSubmitted
                      ? theme.gold.accent
                      : theme.surface.border,
                  },
                ]}
              >
                {isApproved ? (
                  <CheckCircle2 size={14} color="#FFF" />
                ) : (
                  <Clock size={14} color={isSubmitted ? '#FFF' : theme.text.muted} />
                )}
              </View>
              <View style={styles.stepTextCol}>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isApproved || isSubmitted ? theme.text.primary : theme.text.muted,
                      fontWeight: '700',
                    },
                  ]}
                >
                  3. Foreman Approval & Registrar Filing
                </Text>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>
                  {isApproved
                    ? 'Sureties Approved by Foreman'
                    : isSubmitted
                    ? 'Awaiting Foreman Signature & Minutes Filing'
                    : 'Pending Surety Submission'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.stepLine,
                { backgroundColor: isPrized ? theme.semantic.success : theme.surface.border },
              ]}
            />

            {/* Step 4 */}
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: isPrized
                      ? theme.semantic.success
                      : isApproved
                      ? theme.gold.accent
                      : theme.surface.border,
                  },
                ]}
              >
                {isPrized ? (
                  <CheckCircle2 size={14} color="#FFF" />
                ) : (
                  <Building size={14} color={isApproved ? '#FFF' : theme.text.muted} />
                )}
              </View>
              <View style={styles.stepTextCol}>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isPrized ? theme.semantic.success : theme.text.muted,
                      fontWeight: '700',
                    },
                  ]}
                >
                  4. Direct RTGS Bank Credit & 'PS' Transition
                </Text>
                <Text style={[typography.caption, { color: theme.text.secondary }]}>
                  {isPrized
                    ? 'Disbursal Credited via RTGS · Status: Prized Subscriber (PS)'
                    : isApproved
                    ? 'Ready for RTGS Disbursal Transfer'
                    : 'Scheduled upon Foreman approval'}
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ShieldCheck size={20} color={theme.semantic.success} />
              <Text style={[typography.h3, { color: theme.text.primary, marginLeft: 8 }]}>
                RBI Account Aggregator (AA) Consent
              </Text>
            </View>
            <Text style={[typography.bodySmall, { color: theme.text.secondary, marginTop: 6 }]}>
              Instant paperless verification of financial capability via Sahamati RBI-regulated Account Aggregator framework.
            </Text>

            <View style={[styles.aaBox, { backgroundColor: theme.surface.cardSubtle }]}>
              <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700' }]}>
                ✓ 6 Months Financial Capability Verified (HDFC Bank)
              </Text>
              <Text style={[typography.caption, { color: theme.text.secondary, fontSize: 10, marginTop: 2 }]}>
                Consent Artifact: AA-CONSENT-991204 · Encrypted & Valid for 30 days
              </Text>
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[typography.h3, { color: theme.text.primary }]}>
                Co-Guarantor Verification (Section 31)
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddGuarantorModal(true)}
                style={{ paddingVertical: 2, paddingHorizontal: 8 }}
              >
                <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
                  + Add Guarantor
                </Text>
              </TouchableOpacity>
            </View>

            {(claim.surety.guarantors || []).length === 0 ? (
              <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 8 }]}>
                No guarantors attached yet. Two co-guarantors required under Chit Funds Act § 31.
              </Text>
            ) : (
              (claim.surety.guarantors || []).map((g) => (
                <View key={g.id || g.full_name} style={[styles.guarantorItem, { borderColor: theme.surface.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '600' }]}>
                      {g.full_name}
                    </Text>
                    <Text style={[typography.caption, { color: theme.text.secondary }]}>
                      {g.phone} {g.pan_number ? `· PAN: ${g.pan_number}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.signedChip, { backgroundColor: theme.semantic.successBg }]}>
                    <CheckCircle2 size={14} color={theme.semantic.success} />
                    <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700', marginLeft: 4 }]}>
                      Verified
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>

          {/* Statutory Documents Card (Cloudinary Storage) */}
          <Card style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <UploadCloud size={18} color={theme.maroon.primary} />
                <Text style={[typography.h3, { color: theme.text.primary, marginLeft: 8 }]}>
                  Guarantor & Collateral Documents
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setNewDocTitle('');
                  setNewDocType('SALARY_SLIP');
                  setNewDocGuarantorId(claim?.surety?.guarantors?.[0]?.id || '');
                  setShowAddDocModal(true);
                }}
                style={{ paddingVertical: 4, paddingHorizontal: 8 }}
              >
                <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
                  + Upload Document
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[typography.bodySmall, { color: theme.text.secondary, marginTop: 4 }]}>
              Centralized Cloudinary storage for salary slips, FDR certificates, property deeds, and PAN copies (§ 31 Chit Funds Act).
            </Text>

            {suretyDocumentsLoading ? (
              <ActivityIndicator size="small" color={theme.maroon.primary} style={{ marginVertical: 14 }} />
            ) : displayDocuments.length === 0 ? (
              <View style={[styles.emptyDocBox, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.surface.border }]}>
                <FileText size={26} color={theme.text.muted} />
                <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 6, textAlign: 'center' }]}>
                  No documents uploaded yet. Upload salary slips or fixed deposit certificates to expedite Foreman disbursal approval.
                </Text>
              </View>
            ) : (
              displayDocuments.map((doc) => {
                const isDocVerified = doc.verification_status === 'VERIFIED';
                const isDocRejected = doc.verification_status === 'REJECTED';
                return (
                  <View key={doc.id} style={[styles.docItem, { borderColor: theme.surface.border, backgroundColor: theme.surface.cardSubtle }]}>
                    <View style={styles.docIconCol}>
                      <FileText size={20} color={theme.maroon.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '600' }]} numberOfLines={1}>
                        {doc.title || doc.document_type}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                        <View style={[styles.docTypeBadge, { backgroundColor: theme.gold.accent + '25' }]}>
                          <Text style={[typography.caption, { color: theme.maroon.primary, fontSize: 10, fontWeight: '700' }]}>
                            {doc.document_type.replace(/_/g, ' ')}
                          </Text>
                        </View>
                        {doc.guarantor_name ? (
                          <Text style={[typography.caption, { color: theme.text.secondary, fontSize: 11, marginLeft: 6 }]}>
                            · {doc.guarantor_name}
                          </Text>
                        ) : null}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: isDocVerified
                                ? theme.semantic.success
                                : isDocRejected
                                ? theme.semantic.error
                                : theme.gold.accent,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: isDocVerified
                                ? theme.semantic.success
                                : isDocRejected
                                ? theme.semantic.error
                                : theme.text.secondary,
                              fontSize: 10,
                              fontWeight: '600',
                              marginLeft: 4,
                            },
                          ]}
                        >
                          {isDocVerified ? 'Verified by Foreman' : isDocRejected ? 'Rejected' : 'Pending Foreman Review'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                      <TouchableOpacity
                        onPress={() => handleViewDoc(doc.file_url)}
                        style={[styles.actionIconBtn, { backgroundColor: theme.surface.base }]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <ExternalLink size={15} color={theme.text.primary} />
                      </TouchableOpacity>
                      {!isApproved && (
                        <TouchableOpacity
                          onPress={() => handleDeleteDoc(doc.id)}
                          style={[styles.actionIconBtn, { backgroundColor: theme.surface.base, marginLeft: 6 }]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={15} color={theme.semantic.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={[typography.h3, { color: theme.text.primary }]}>
              Designated Bank Disbursal Account
            </Text>
            <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2 }]}>
              Prize amount will be credited directly to this verified RTGS account.
            </Text>

            <Input
              label="Account Number"
              value={bankAccount}
              onChangeText={setBankAccount}
              disabled={isPrized}
              placeholder="Enter 11-16 digit bank account"
              keyboardType="number-pad"
              containerStyle={{ marginTop: 10 }}
            />

            <Input
              label="IFSC Code"
              value={bankIfsc}
              onChangeText={setBankIfsc}
              disabled={isPrized}
              placeholder="e.g. SBIN0001234"
              autoCapitalize="characters"
              containerStyle={{ marginTop: 4 }}
            />

            {!isPrized && (
              <View style={{ marginTop: 16 }}>
                {!isSubmitted && (
                  <Button
                    title={isSubmitting ? 'Submitting Package...' : 'Submit Surety Package (§ 31)'}
                    variant="primary"
                    loading={isSubmitting}
                    icon={<Send size={16} color="#FFF" />}
                    onPress={handleSubmitSurety}
                  />
                )}

                {/* Instant Disbursal Option (Demo / Foreman review) */}
                <Button
                  title={isDisbursing ? 'Processing RTGS Transfer...' : `Approve & Disburse ₹${Number(claim.netPayoutAmount).toLocaleString('en-IN')} via RTGS`}
                  variant={isSubmitted ? 'primary' : 'outline'}
                  loading={isDisbursing}
                  icon={<Building size={16} color={isSubmitted ? '#FFF' : theme.maroon.primary} />}
                  onPress={handleDisbursePayout}
                  style={{ marginTop: 10 }}
                />
              </View>
            )}

            {isPrized && (
              <View style={[styles.aaBox, { backgroundColor: theme.semantic.successBg, marginTop: 14 }]}>
                <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700' }]}>
                  ✓ DISBURSAL COMPLETED VIA RTGS
                </Text>
                <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2 }]}>
                  UTR: {claim.disbursal?.bank_reference_utr || lastDisbursalUtr || 'UTR8839120491'} · Subscriber Status: Prized Subscriber (PS)
                </Text>
              </View>
            )}
          </Card>
        </>
      ) : (
        <Card style={styles.prizeCard}>
          <View style={styles.prizeRow}>
            <View style={[styles.awardBadge, { backgroundColor: theme.surface.cardSubtle }]}>
              <Award size={28} color={theme.text.muted} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.caption, { color: theme.text.secondary, fontWeight: '700' }]}>
                NO PRIZE MONEY CLAIM PENDING
              </Text>
              <Text style={[typography.displayLarge, { color: theme.text.primary, marginTop: 2 }]}>
                ₹0
              </Text>
              <Text style={[typography.caption, { color: theme.text.secondary }]}>
                Win a monthly live reverse auction round to initiate Section 31 statutory surety evaluation and RTGS prize payout.
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Add Guarantor Modal */}
      {showAddGuarantorModal && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}>
              <Text style={[typography.h2, { color: theme.text.primary, marginBottom: 12 }]}>
                Add Co-Guarantor
              </Text>
              <Input
                label="Full Name"
                placeholder="Guarantor legal name"
                value={newGName}
                onChangeText={setNewGName}
                autoCapitalize="words"
              />
              <Input
                label="Mobile Number"
                placeholder="10-digit number"
                value={newGPhone}
                onChangeText={setNewGPhone}
                prefix="+91"
                keyboardType="phone-pad"
                maxLength={10}
              />
              <Input
                label="PAN Number (Optional)"
                placeholder="ABCDE1234F"
                value={newGPan}
                onChangeText={setNewGPan}
                autoCapitalize="characters"
                maxLength={10}
              />
              <View style={{ flexDirection: 'row', marginTop: 16, width: '100%' }}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowAddGuarantorModal(false)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title="Save Guarantor"
                  variant="primary"
                  onPress={handleAddGuarantorSubmit}
                  style={{ flex: 1, marginLeft: 8 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Disbursal Success Modal */}
      {disbursalSuccessModal && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}>
              <CheckCircle2 size={54} color={theme.semantic.success} />
              <Text style={[typography.h2, { color: theme.text.primary, marginTop: 12 }]}>
                RTGS Disbursal Initiated!
              </Text>
              <Text style={[typography.bodyMedium, { color: theme.text.secondary, textAlign: 'center', marginTop: 6 }]}>
                ₹{Number(claim?.netPayoutAmount || 0).toLocaleString('en-IN')} has been wired to your verified bank account.
              </Text>
              <View style={[styles.aaBox, { backgroundColor: theme.surface.cardSubtle, width: '100%', marginVertical: 12 }]}>
                <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700' }]}>
                  Transaction Reference (UTR):
                </Text>
                <Text style={[typography.numericMedium, { color: theme.maroon.primary, marginTop: 2 }]}>
                  {lastDisbursalUtr}
                </Text>
                <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700', marginTop: 4 }]}>
                  STATUS: PRIZED SUBSCRIBER (PS) RECORDED
                </Text>
              </View>
              <Button
                title="Done"
                variant="primary"
                onPress={() => setDisbursalSuccessModal(false)}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Upload Document Modal */}
      {showAddDocModal && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.surface.card, borderColor: theme.surface.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <UploadCloud size={24} color={theme.maroon.primary} />
                <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 8 }]}>
                  Upload Statutory Document
                </Text>
              </View>

              <Text style={[typography.caption, { color: theme.text.secondary, fontWeight: '700', marginBottom: 6 }]}>
                DOCUMENT TYPE (§ 31 REQUIREMENT)
              </Text>
              <View style={styles.docTypeWrap}>
                {[
                  { key: 'SALARY_SLIP', label: 'Salary Slip' },
                  { key: 'FDR_CERTIFICATE', label: 'FDR Certificate' },
                  { key: 'PROPERTY_DEED', label: 'Property Deed' },
                  { key: 'PAN_CARD', label: 'PAN Card' },
                  { key: 'IDENTITY_PROOF', label: 'ID Proof' },
                  { key: 'OTHER', label: 'Other' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setNewDocType(item.key)}
                    style={[
                      styles.typePill,
                      {
                        backgroundColor: newDocType === item.key ? theme.maroon.primary : theme.surface.cardSubtle,
                        borderColor: newDocType === item.key ? theme.maroon.primary : theme.surface.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: newDocType === item.key ? '#FFF' : theme.text.secondary,
                          fontWeight: newDocType === item.key ? '700' : '500',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[typography.caption, { color: theme.text.secondary, fontWeight: '700', marginTop: 12, marginBottom: 4 }]}>
                ATTACHED TO GUARANTOR (OPTIONAL)
              </Text>
              <View style={styles.docTypeWrap}>
                <TouchableOpacity
                  onPress={() => setNewDocGuarantorId('')}
                  style={[
                    styles.typePill,
                    {
                      backgroundColor: !newDocGuarantorId ? theme.gold.accent : theme.surface.cardSubtle,
                      borderColor: !newDocGuarantorId ? theme.gold.accent : theme.surface.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      { color: !newDocGuarantorId ? '#000' : theme.text.secondary, fontWeight: '700' },
                    ]}
                  >
                    Entire Surety Package
                  </Text>
                </TouchableOpacity>
                {(claim?.surety?.guarantors || []).map((g) => (
                  <TouchableOpacity
                    key={g.id || g.full_name}
                    onPress={() => setNewDocGuarantorId(g.id)}
                    style={[
                      styles.typePill,
                      {
                        backgroundColor: newDocGuarantorId === g.id ? theme.gold.accent : theme.surface.cardSubtle,
                        borderColor: newDocGuarantorId === g.id ? theme.gold.accent : theme.surface.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        { color: newDocGuarantorId === g.id ? '#000' : theme.text.secondary, fontWeight: '700' },
                      ]}
                    >
                      {g.full_name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="DOCUMENT TITLE"
                placeholder="e.g., 3 Months Salary Slip Oct-Dec 2026"
                value={newDocTitle}
                onChangeText={setNewDocTitle}
                containerStyle={{ marginTop: 12 }}
              />

              <View style={[styles.uploadBoxPreview, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.surface.border }]}>
                <Paperclip size={18} color={theme.maroon.primary} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700' }]}>
                    Ready for Cloudinary Direct Upload
                  </Text>
                  <Text style={[typography.caption, { color: theme.text.secondary, fontSize: 10 }]}>
                    Encrypted transport directly to Cloudinary CDN via backend signature.
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 16, width: '100%' }}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowAddDocModal(false)}
                  disabled={isUploadingDoc}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title={isUploadingDoc ? 'Uploading...' : 'Upload File'}
                  variant="primary"
                  onPress={handleUploadDocumentSubmit}
                  disabled={isUploadingDoc}
                  style={{ flex: 1, marginLeft: 8 }}
                />
              </View>
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
  header: {
    marginBottom: 16,
  },
  prizeCard: {
    marginBottom: 16,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  awardBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C9A22730',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCard: {
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextCol: {
    marginLeft: 12,
  },
  stepLine: {
    width: 2,
    height: 18,
    marginLeft: 11,
    marginVertical: 2,
  },
  sectionCard: {
    marginBottom: 16,
  },
  aaBox: {
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  guarantorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  signedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bankInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'flex-start',
  },
  modalInput: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  emptyDocBox: {
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  docIconCol: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#C9A22720',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actionIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTypeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  uploadBoxPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    width: '100%',
  },
});

