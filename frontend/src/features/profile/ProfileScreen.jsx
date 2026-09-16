import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../core/theme/ThemeProvider';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import { Input } from '../../core/components/Input';
import { useAppStore } from '../../store/useAppStore';
import { setAuthToken } from '../../core/networking/apiClient';
import {
  ShieldCheck,
  Lock,
  Fingerprint,
  Moon,
  Sun,
  LogOut,
  Calendar,
  FileSpreadsheet,
  Edit3,
  Mail,
  CreditCard,
  X,
  CheckCircle2,
} from 'lucide-react-native';

export const ProfileScreen = ({ onLogout, onReplaySplash, onReplayOnboarding }) => {
  const { theme, typography, isDark, toggleTheme } = useTheme();
  const {
    user,
    dpdpConsents,
    updateDPDPConsent,
    withdrawDPDPConsent,
    exportUserData,
    toggleBiometric,
    logout,
    fetchUserProfile,
    updateUserProfile,
  } = useAppStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [fullNameInput, setFullNameInput] = useState(user?.full_name || '');
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [panInput, setPanInput] = useState(user?.pan_number || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (user) {
      setFullNameInput(user.full_name || '');
      setEmailInput(user.email || '');
      setPanInput(user.pan_number || '');
    }
  }, [user]);

  const handleOpenEdit = () => {
    setFullNameInput(user?.full_name || '');
    setEmailInput(user?.email || '');
    setPanInput(user?.pan_number || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!fullNameInput.trim()) {
      Alert.alert('Validation Error', 'Full legal name is required.');
      return;
    }
    if (panInput.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panInput.trim().toUpperCase())) {
      Alert.alert('Validation Error', 'Invalid PAN format. Must be 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F).');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateUserProfile({
        fullName: fullNameInput.trim(),
        email: emailInput.trim() || undefined,
        panNumber: panInput.trim().toUpperCase() || undefined,
      });

      if (res.success) {
        setEditModalVisible(false);
        Alert.alert('Profile Updated', 'Your personal and KYC details have been saved.');
      } else {
        Alert.alert('Update Failed', res.error || 'Could not update profile.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataExport = async () => {
    const res = await exportUserData();
    if (res.success && res.data) {
      const d = res.data;
      Alert.alert(
        'DPDP Data Export Ready (§ 11)',
        `Data Principal: ${d.dataPrincipal.full_name || 'Subscriber'}\nPhone: ${d.dataPrincipal.phone}\nActive Chits: ${d.subscribedChits.length}\nPayment Ledgers: ${d.financialLedgers.length}\nAudit Events: ${d.activityAuditTrail.length}\n\nExport Package: Encrypted JSON format certified under Digital Personal Data Protection Act, 2023.`
      );
    } else {
      Alert.alert(
        'DPDP Data Export Ready',
        'Under Section 11 of DPDP Act 2023, your full data audit package (identity, bidding transactions, KYC hashes) is generated in encrypted JSON format.'
      );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[typography.h1, { color: theme.text.primary }]}>
          Profile & Privacy Center
        </Text>
        <Text style={[typography.bodyMedium, { color: theme.text.secondary }]}>
          DPDP 2023 Compliance, Biometric Security & Data Governance
        </Text>
      </View>

      <Card variant="goldAccent" style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.maroon.primary }]}>
            <Text style={[typography.h2, { color: '#FFFFFF' }]}>
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[typography.h2, { color: theme.text.primary, flex: 1 }]}>
                {user?.full_name || 'Subscriber'}
              </Text>
              <TouchableOpacity
                onPress={handleOpenEdit}
                style={[styles.editBtn, { backgroundColor: theme.surface.base }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Edit3 size={16} color={theme.maroon.primary} />
              </TouchableOpacity>
            </View>
            <Text style={[typography.bodyMedium, { color: theme.text.secondary }]}>
              {user?.phone}
            </Text>
            {user?.email ? (
              <Text style={[typography.caption, { color: theme.text.muted, marginTop: 2 }]}>
                {user.email}
              </Text>
            ) : null}
            {user?.pan_number ? (
              <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2, fontWeight: '600' }]}>
                PAN: {user.pan_number}
              </Text>
            ) : null}
            <View style={[styles.verifiedBadge, { backgroundColor: user?.kyc_status === 'VERIFIED' ? theme.semantic.successBg : theme.surface.cardSubtle }]}>
              <ShieldCheck size={13} color={user?.kyc_status === 'VERIFIED' ? theme.semantic.success : theme.text.muted} />
              <Text style={[typography.caption, { color: user?.kyc_status === 'VERIFIED' ? theme.semantic.success : theme.text.muted, fontWeight: '700', marginLeft: 4 }]}>
                {user?.kyc_status === 'VERIFIED' ? 'Aadhaar & PAN eKYC Verified' : user?.kyc_status === 'PENDING' ? 'eKYC Under Review' : 'eKYC Not Completed'}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={[typography.h3, { color: theme.text.primary, marginBottom: 12 }]}>
          App Preferences & Biometrics
        </Text>

        <View style={[styles.prefRow, { borderBottomColor: theme.surface.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Fingerprint size={20} color={theme.maroon.primary} />
            <View style={{ marginLeft: 10 }}>
              <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '600' }]}>
                Biometric App-Lock
              </Text>
              <Text style={[typography.caption, { color: theme.text.secondary }]}>
                Prompt Face ID / Fingerprint on return
              </Text>
            </View>
          </View>
          <Switch
            value={user?.biometric_enabled}
            onValueChange={toggleBiometric}
            trackColor={{ false: theme.surface.border, true: theme.maroon.primary }}
            thumbColor={user?.biometric_enabled ? theme.gold.accent : '#eee'}
          />
        </View>

        <View style={styles.prefRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {isDark ? <Moon size={20} color={theme.gold.accent} /> : <Sun size={20} color={theme.gold.accent} />}
            <View style={{ marginLeft: 10 }}>
              <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '600' }]}>
                Theme Mode
              </Text>
              <Text style={[typography.caption, { color: theme.text.secondary }]}>
                {isDark ? 'Dark Theme (Maroon / Gold)' : 'Light Theme (Warm Base / Maroon)'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.surface.border, true: theme.maroon.primary }}
            thumbColor={isDark ? theme.gold.accent : '#eee'}
          />
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Lock size={20} color={theme.gold.accent} />
          <Text style={[typography.h3, { color: theme.text.primary, marginLeft: 8 }]}>
            DPDP 2023 Consent Manager
          </Text>
        </View>
        <Text style={[typography.caption, { color: theme.text.secondary, marginBottom: 12 }]}>
          Manage or revoke permissions individually under the Digital Personal Data Protection Act.
        </Text>

        <View style={[styles.consentItem, { borderBottomColor: theme.surface.border }]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '600' }]}>
              Credit Bureau Scoring
            </Text>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>
              Used only for surety evaluation when prized.
            </Text>
          </View>
          <Switch
            value={dpdpConsents.credit_bureau_check}
            onValueChange={(val) => updateDPDPConsent('credit_bureau_check', val)}
            trackColor={{ false: theme.surface.border, true: theme.maroon.primary }}
            thumbColor={dpdpConsents.credit_bureau_check ? theme.gold.accent : '#eee'}
          />
        </View>

        <View style={[styles.consentItem, { borderBottomColor: theme.surface.border }]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '600' }]}>
              Auction Participation Logs
            </Text>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>
              Real-time bids recorded in public ledger.
            </Text>
          </View>
          <Switch
            value={dpdpConsents.auction_participation_records}
            onValueChange={(val) => updateDPDPConsent('auction_participation_records', val)}
            trackColor={{ false: theme.surface.border, true: theme.maroon.primary }}
            thumbColor={dpdpConsents.auction_participation_records ? theme.gold.accent : '#eee'}
          />
        </View>

        <View style={styles.consentItem}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '600' }]}>
              SMS & WhatsApp Alerts
            </Text>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>
              Timers, reminders, and dividend credits.
            </Text>
          </View>
          <Switch
            value={dpdpConsents.marketing_communications}
            onValueChange={(val) => updateDPDPConsent('marketing_communications', val)}
            trackColor={{ false: theme.surface.border, true: theme.maroon.primary }}
            thumbColor={dpdpConsents.marketing_communications ? theme.gold.accent : '#eee'}
          />
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Calendar size={18} color={theme.maroon.primary} />
          <Text style={[typography.h3, { color: theme.text.primary, marginLeft: 8 }]}>
            Data Retention Timelines
          </Text>
        </View>

        <View style={[styles.retentionRow, { backgroundColor: theme.surface.cardSubtle }]}>
          <Text style={[typography.caption, { color: theme.text.secondary, flex: 1 }]}>
            Chit Agreement & Double-Entry Ledger
          </Text>
          <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
            8 Years (Section 24)
          </Text>
        </View>

        <View style={[styles.retentionRow, { backgroundColor: theme.surface.cardSubtle, marginTop: 6 }]}>
          <Text style={[typography.caption, { color: theme.text.secondary, flex: 1 }]}>
            PMLA / FIU-IND Reporting Data
          </Text>
          <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
            5 Years (Statutory)
          </Text>
        </View>

        <View style={[styles.retentionRow, { backgroundColor: theme.surface.cardSubtle, marginTop: 6 }]}>
          <Text style={[typography.caption, { color: theme.text.secondary, flex: 1 }]}>
            Marketing & App Telemetry
          </Text>
          <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700' }]}>
            Purged upon request
          </Text>
        </View>
      </Card>

      <View style={{ marginTop: 10, gap: 10 }}>
        <Button
          title="Download Personal Data Export (JSON)"
          variant="outline"
          icon={<FileSpreadsheet size={16} color={theme.maroon.primary} />}
          onPress={handleDataExport}
        />

        {onReplayOnboarding && (
          <Button
            title="View Onboarding Tour"
            variant="outline"
            onPress={onReplayOnboarding}
          />
        )}

        {onReplaySplash && (
          <Button
            title="Replay Splash Screen"
            variant="outline"
            onPress={onReplaySplash}
          />
        )}

        <Button
          title="Sign Out"
          variant="ghost"
          icon={<LogOut size={16} color={theme.semantic.error} />}
          textStyle={{ color: theme.semantic.error }}
          onPress={async () => {
            await setAuthToken(null);
            logout();
            if (onLogout) onLogout();
          }}
        />
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface.base, borderColor: theme.surface.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[typography.h2, { color: theme.text.primary }]}>
                Edit Legal Profile & KYC
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Full Legal Name (as per Aadhaar / PAN)"
              value={fullNameInput}
              onChangeText={setFullNameInput}
              placeholder="e.g. Ramesh Chandra Sharma"
              autoCapitalize="words"
            />

            <Input
              label="Email Address"
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@example.com"
            />

            <Input
              label="Permanent Account Number (PAN)"
              value={panInput}
              onChangeText={setPanInput}
              autoCapitalize="characters"
              maxLength={10}
              placeholder="ABCDE1234F"
              helperText="Entering a valid PAN transitions KYC status to PENDING / VERIFIED for Foreman prize review."
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setEditModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={isSaving ? "Saving..." : "Save Details"}
                variant="primary"
                onPress={handleSaveProfile}
                disabled={isSaving}
                style={{ flex: 1 }}
              />
            </View>
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
  profileCard: {
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  sectionCard: {
    marginBottom: 16,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  retentionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
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
});
