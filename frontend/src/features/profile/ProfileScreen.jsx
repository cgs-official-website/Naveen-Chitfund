import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../../core/theme/ThemeProvider';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import { useAppStore } from '../../store/useAppStore';
import {
  ShieldCheck,
  Lock,
  Fingerprint,
  Moon,
  Sun,
  LogOut,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react-native';

export const ProfileScreen = ({ onLogout }) => {
  const { theme, typography, isDark, toggleTheme } = useTheme();
  const {
    user,
    dpdpConsents,
    updateDPDPConsent,
    toggleBiometric,
    logout,
  } = useAppStore();

  const handleDataExport = () => {
    Alert.alert(
      'DPDP Data Export Ready',
      'Under Section 11 of DPDP Act 2023, your full data audit package (identity, bidding transactions, KYC hashes) is generated in encrypted JSON format.'
    );
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
            <Text style={[typography.h2, { color: theme.text.primary }]}>
              {user?.full_name || 'Subscriber'}
            </Text>
            <Text style={[typography.bodyMedium, { color: theme.text.secondary }]}>
              {user?.phone}
            </Text>
            <View style={[styles.verifiedBadge, { backgroundColor: theme.semantic.successBg }]}>
              <ShieldCheck size={13} color={theme.semantic.success} />
              <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700', marginLeft: 4 }]}>
                Aadhaar & PAN eKYC Verified
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

        <Button
          title="Sign Out"
          variant="ghost"
          icon={<LogOut size={16} color={theme.semantic.error} />}
          textStyle={{ color: theme.semantic.error }}
          onPress={() => {
            logout();
            if (onLogout) onLogout();
          }}
        />
      </View>
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
});
