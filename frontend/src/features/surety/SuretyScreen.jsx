import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '../../core/theme/ThemeProvider';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building,
} from 'lucide-react-native';

export const SuretyScreen = () => {
  const { theme, typography } = useTheme();

  const [guarantor2Signed, setGuarantor2Signed] = useState(false);
  const [bankAccount, setBankAccount] = useState('HDFC0001092 - AC: 5010048291048');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[typography.h1, { color: theme.text.primary }]}>
          Surety & Prize Money
        </Text>
        <Text style={[typography.bodyMedium, { color: theme.text.secondary }]}>
          Statutory Security Evaluation & Automated RTGS Disbursal
        </Text>
      </View>

      <Card variant="goldAccent" style={styles.prizeCard}>
        <View style={styles.prizeRow}>
          <View style={styles.awardBadge}>
            <Award size={28} color={theme.maroon.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
              SUCCESSFUL BIDDER · MONTH 4
            </Text>
            <Text style={[typography.displayLarge, { color: theme.text.primary, marginTop: 2 }]}>
              ₹3,87,500
            </Text>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>
              Net Disbursal Payout (₹5,00,000 chit less 22.5% discount)
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.timelineCard}>
        <Text style={[typography.h3, { color: theme.text.primary, marginBottom: 14 }]}>
          Disbursal Progress Timeline
        </Text>

        <View style={styles.stepRow}>
          <View style={[styles.stepDot, { backgroundColor: theme.semantic.success }]}>
            <CheckCircle2 size={14} color="#FFF" />
          </View>
          <View style={styles.stepTextCol}>
            <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700' }]}>
              1. Auction Won & Minutes Recorded
            </Text>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>
              Completed · Winning discount 22.5%
            </Text>
          </View>
        </View>
        <View style={[styles.stepLine, { backgroundColor: theme.semantic.success }]} />

        <View style={styles.stepRow}>
          <View style={[styles.stepDot, { backgroundColor: theme.gold.accent }]}>
            <Clock size={14} color="#FFF" />
          </View>
          <View style={styles.stepTextCol}>
            <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700' }]}>
              2. Surety Documentation & Co-Guarantors
            </Text>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>
              In Progress · 1 of 2 Guarantors e-Signed
            </Text>
          </View>
        </View>
        <View style={[styles.stepLine, { backgroundColor: theme.surface.border }]} />

        <View style={styles.stepRow}>
          <View style={[styles.stepDot, { backgroundColor: theme.surface.border }]}>
            <Clock size={14} color={theme.text.muted} />
          </View>
          <View style={styles.stepTextCol}>
            <Text style={[typography.caption, { color: theme.text.muted, fontWeight: '700' }]}>
              3. Foreman Review & Form XIV Entry
            </Text>
            <Text style={[typography.caption, { color: theme.text.muted }]}>
              Statutory verification under Section 31
            </Text>
          </View>
        </View>
        <View style={[styles.stepLine, { backgroundColor: theme.surface.border }]} />

        <View style={styles.stepRow}>
          <View style={[styles.stepDot, { backgroundColor: theme.surface.border }]}>
            <Building size={14} color={theme.text.muted} />
          </View>
          <View style={styles.stepTextCol}>
            <Text style={[typography.caption, { color: theme.text.muted, fontWeight: '700' }]}>
              4. Direct Bank Transfer (RTGS / NEFT)
            </Text>
            <Text style={[typography.caption, { color: theme.text.muted }]}>
              Disbursal credited to designated bank account
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
            ✓ 6 Months Bank Statement Fetched (HDFC Bank)
          </Text>
          <Text style={[typography.caption, { color: theme.text.secondary, fontSize: 10, marginTop: 2 }]}>
            Consent Artifact: AA-CONSENT-991204 · Valid for 30 days
          </Text>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[typography.h3, { color: theme.text.primary }]}>
            Co-Guarantor Status (Section 31)
          </Text>
          <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>
            2 Required
          </Text>
        </View>

        <View style={[styles.guarantorItem, { borderColor: theme.surface.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '600' }]}>
              P. Raghavendra (Govt Employee)
            </Text>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>
              Aadhaar e-Signed on 16 Aug 2026
            </Text>
          </View>
          <View style={[styles.signedChip, { backgroundColor: theme.semantic.successBg }]}>
            <CheckCircle2 size={14} color={theme.semantic.success} />
            <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700', marginLeft: 4 }]}>
              Signed
            </Text>
          </View>
        </View>

        <View style={[styles.guarantorItem, { borderColor: theme.surface.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '600' }]}>
              M. Venkat Reddy (Self-Employed)
            </Text>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>
              e-Sign link sent to +91 94401 23901
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setGuarantor2Signed(true)}
            style={[
              styles.signedChip,
              {
                backgroundColor: guarantor2Signed ? theme.semantic.successBg : theme.gold.accent + '25',
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: guarantor2Signed ? theme.semantic.success : theme.isDark ? theme.gold.accent : '#997300',
                  fontWeight: '700',
                },
              ]}
            >
              {guarantor2Signed ? 'Signed' : 'Resend Link'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={[typography.h3, { color: theme.text.primary }]}>
          Designated Disbursal Account
        </Text>
        <TextInput
          value={bankAccount}
          onChangeText={setBankAccount}
          style={[
            typography.bodyMedium,
            styles.bankInput,
            {
              backgroundColor: theme.surface.inputBg,
              borderColor: theme.surface.border,
              color: theme.text.primary,
            },
          ]}
        />
        <Button
          title="Request Foreman Disbursal"
          variant="primary"
          onPress={() =>
            Alert.alert(
              'Disbursal Request Submitted',
              'Foreman has received your completed surety package. Disbursal scheduled within 24 hours under Form XIV ledger.'
            )
          }
          style={{ marginTop: 14 }}
        />
      </Card>
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
});
