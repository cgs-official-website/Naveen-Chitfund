import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../core/theme/ThemeProvider';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import { useAppStore } from '../../store/useAppStore';
import {
  ShieldCheck,
  Smartphone,
  CreditCard,
  Camera,
  CheckCircle2,
  Lock,
  Globe,
  FileCheck,
} from 'lucide-react-native';

export const AuthScreen = ({ onComplete }) => {
  const { theme, typography } = useTheme();
  const { login, updateDPDPConsent, dpdpConsents } = useAppStore();

  const [step, setStep] = useState(1);
  const [isNRI, setIsNRI] = useState(false);
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('123456');
  const [aadhaar, setAadhaar] = useState('7482 9102 3841');
  const [pan, setPan] = useState('ABCDE1234F');
  const [nriLocalGuarantor, setNriLocalGuarantor] = useState('K. Srinivas Rao');
  const [nreAccount, setNreAccount] = useState('NRO-9948123019');
  const [loading, setLoading] = useState(false);

  const totalSteps = isNRI ? 6 : 5;

  const handleNextStep = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        login(
          {
            id: `usr-${Date.now()}`,
            phone: `+91 ${phone}`,
            full_name: 'Verified Subscriber',
            role: 'user',
            kyc_status: 'VERIFIED',
            is_nri: isNRI,
            biometric_enabled: true,
          },
          'token_verified_subscriber_2026'
        );
        if (onComplete) onComplete();
      }
    }, 400);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
    >
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: theme.maroon.primary + '18' }]}>
          <ShieldCheck size={16} color={theme.maroon.primary} />
          <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700', marginLeft: 6 }]}>
            Chit Funds Act 1982 / 2019 Regulated
          </Text>
        </View>
        <Text style={[typography.displayHero, { color: theme.text.primary, marginTop: 8 }]}>
          ChitTech
        </Text>
        <Text style={[typography.bodyMedium, { color: theme.text.secondary }]}>
          Institutional-Grade Digital ROSCA Platform
        </Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTextRow}>
          <Text style={[typography.caption, { color: theme.text.secondary }]}>
            Step {step} of {totalSteps}
          </Text>
          <Text style={[typography.caption, { color: theme.gold.accent, fontWeight: '700' }]}>
            {step === 1 && 'Mobile Authentication'}
            {step === 2 && 'DPDP 2023 Consent'}
            {step === 3 && 'Aadhaar eKYC'}
            {step === 4 && 'PAN Verification'}
            {step === 5 && 'DigiLocker & Liveness'}
            {step === 6 && 'NRI & Co-Signatory'}
          </Text>
        </View>
        <View style={[styles.progressBarTrack, { backgroundColor: theme.surface.border }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: theme.maroon.primary,
                width: `${(step / totalSteps) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* STEP 1: Phone OTP */}
      {step === 1 && (
        <Card variant="elevated" style={styles.stepCard}>
          <View style={styles.stepTitleRow}>
            <Smartphone size={22} color={theme.maroon.primary} />
            <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 10 }]}>
              Enter Mobile Number
            </Text>
          </View>
          <Text style={[typography.bodyMedium, { color: theme.text.secondary, marginVertical: 8 }]}>
            We will send a 6-digit OTP to verify your identity.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>Mobile Number</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.surface.border, backgroundColor: theme.surface.inputBg }]}>
              <Text style={[typography.bodyLarge, { color: theme.text.primary, marginRight: 8, fontWeight: '600' }]}>+91</Text>
              <TextInput
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                style={[typography.bodyLarge, styles.input, { color: theme.text.primary }]}
                placeholder="9876543210"
                placeholderTextColor={theme.text.muted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>One-Time Password (OTP)</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.surface.border, backgroundColor: theme.surface.inputBg }]}>
              <TextInput
                keyboardType="numeric"
                value={otp}
                onChangeText={setOtp}
                maxLength={6}
                style={[typography.bodyLarge, styles.input, { color: theme.text.primary, letterSpacing: 4 }]}
                placeholder="123456"
                placeholderTextColor={theme.text.muted}
              />
            </View>
          </View>

          {/* NRI Toggle */}
          <View style={[styles.toggleCard, { backgroundColor: theme.surface.cardSubtle }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Globe size={16} color={theme.maroon.primary} />
                <Text style={[typography.h3, { color: theme.text.primary, marginLeft: 6 }]}>
                  Are you an NRI Subscriber?
                </Text>
              </View>
              <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 4 }]}>
                Enables non-repatriable NRO linkage and resident co-signatory verification.
              </Text>
            </View>
            <Switch
              value={isNRI}
              onValueChange={setIsNRI}
              trackColor={{ false: theme.surface.border, true: theme.maroon.primary }}
              thumbColor={isNRI ? theme.gold.accent : '#f4f3f4'}
            />
          </View>

          <Button
            title="Verify & Proceed"
            onPress={handleNextStep}
            loading={loading}
            style={{ marginTop: 20 }}
          />
        </Card>
      )}

      {/* STEP 2: Granular DPDP Consent Screen */}
      {step === 2 && (
        <Card variant="elevated" style={styles.stepCard}>
          <View style={styles.stepTitleRow}>
            <Lock size={22} color={theme.gold.accent} />
            <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 10 }]}>
              DPDP Act 2023 Consent
            </Text>
          </View>
          <Text style={[typography.bodySmall, { color: theme.text.secondary, marginTop: 6, marginBottom: 16 }]}>
            Under India's Digital Personal Data Protection Act 2023, you have full granular control over what information is collected, why, and how long it is retained.
          </Text>

          <View style={[styles.consentItem, { borderBottomColor: theme.surface.border }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[typography.h3, { color: theme.text.primary }]}>Identity & Address (eKYC)</Text>
              <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2 }]}>
                Mandatory under Chit Funds Act § 16. Used strictly for subscriber registry and PSO filing.
              </Text>
            </View>
            <Switch
              value={dpdpConsents.identity_verification}
              disabled={true}
              trackColor={{ false: theme.surface.border, true: theme.maroon.primary }}
              thumbColor={theme.gold.accent}
            />
          </View>

          <View style={[styles.consentItem, { borderBottomColor: theme.surface.border }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[typography.h3, { color: theme.text.primary }]}>Credit Bureau Verification</Text>
              <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2 }]}>
                Checks CIBIL/Experian score for surety eligibility upon winning a prized bid.
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
              <Text style={[typography.h3, { color: theme.text.primary }]}>Live Auction Records</Text>
              <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2 }]}>
                Timestamped bid ledger recording for double-entry transparency and audit trails.
              </Text>
            </View>
            <Switch
              value={dpdpConsents.auction_participation_records}
              onValueChange={(val) => updateDPDPConsent('auction_participation_records', val)}
              trackColor={{ false: theme.surface.border, true: theme.maroon.primary }}
              thumbColor={dpdpConsents.auction_participation_records ? theme.gold.accent : '#eee'}
            />
          </View>

          <View style={[styles.consentItem, { borderBottomColor: theme.surface.border }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[typography.h3, { color: theme.text.primary }]}>Regulatory Filing (PMLA/CTR)</Text>
              <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2 }]}>
                Compliance reporting for Cash/Suspicious Transactions under FIU-IND directives.
              </Text>
            </View>
            <Switch
              value={dpdpConsents.regulatory_reporting_pmla}
              disabled={true}
              trackColor={{ false: theme.surface.border, true: theme.maroon.primary }}
              thumbColor={theme.gold.accent}
            />
          </View>

          <View style={[styles.consentItem, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[typography.h3, { color: theme.text.primary }]}>SMS & WhatsApp Reminders</Text>
              <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2 }]}>
                Optional auction start countdowns and dividend credit notifications.
              </Text>
            </View>
            <Switch
              value={dpdpConsents.marketing_communications}
              onValueChange={(val) => updateDPDPConsent('marketing_communications', val)}
              trackColor={{ false: theme.surface.border, true: theme.maroon.primary }}
              thumbColor={dpdpConsents.marketing_communications ? theme.gold.accent : '#eee'}
            />
          </View>

          <Button
            title="Accept Selected & Continue"
            onPress={handleNextStep}
            loading={loading}
            style={{ marginTop: 20 }}
          />
        </Card>
      )}

      {/* STEP 3: Aadhaar OTP */}
      {step === 3 && (
        <Card variant="elevated" style={styles.stepCard}>
          <View style={styles.stepTitleRow}>
            <CreditCard size={22} color={theme.maroon.primary} />
            <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 10 }]}>
              Aadhaar Paperless eKYC
            </Text>
          </View>
          <Text style={[typography.bodyMedium, { color: theme.text.secondary, marginVertical: 8 }]}>
            We fetch your UIDAI verified demographic details via OTP. Raw numbers are masked and never stored unencrypted.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>12-Digit Aadhaar Number</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.surface.border, backgroundColor: theme.surface.inputBg }]}>
              <TextInput
                keyboardType="numeric"
                value={aadhaar}
                onChangeText={setAadhaar}
                style={[typography.bodyLarge, styles.input, { color: theme.text.primary, letterSpacing: 2 }]}
              />
            </View>
          </View>

          <View style={[styles.secureNote, { backgroundColor: theme.semantic.successBg }]}>
            <CheckCircle2 size={16} color={theme.semantic.success} />
            <Text style={[typography.caption, { color: theme.semantic.success, marginLeft: 6, fontWeight: '600' }]}>
              UIDAI Vault Tokenized · 256-bit Encrypted
            </Text>
          </View>

          <Button
            title="Verify Aadhaar OTP"
            onPress={handleNextStep}
            loading={loading}
            style={{ marginTop: 20 }}
          />
        </Card>
      )}

      {/* STEP 4: PAN Card Verification */}
      {step === 4 && (
        <Card variant="elevated" style={styles.stepCard}>
          <View style={styles.stepTitleRow}>
            <FileCheck size={22} color={theme.gold.accent} />
            <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 10 }]}>
              Permanent Account Number (PAN)
            </Text>
          </View>
          <Text style={[typography.bodyMedium, { color: theme.text.secondary, marginVertical: 8 }]}>
            Required for TDS deduction on chit dividends and Prize Money disbursals exceeding ₹10,000.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>10-Digit PAN</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.surface.border, backgroundColor: theme.surface.inputBg }]}>
              <TextInput
                autoCapitalize="characters"
                value={pan}
                onChangeText={setPan}
                maxLength={10}
                style={[typography.bodyLarge, styles.input, { color: theme.text.primary, letterSpacing: 2 }]}
              />
            </View>
          </View>

          <Button
            title="Verify with NSDL"
            onPress={handleNextStep}
            loading={loading}
            style={{ marginTop: 20 }}
          />
        </Card>
      )}

      {/* STEP 5: DigiLocker / Selfie Liveness */}
      {step === 5 && (
        <Card variant="elevated" style={styles.stepCard}>
          <View style={styles.stepTitleRow}>
            <Camera size={22} color={theme.maroon.primary} />
            <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 10 }]}>
              Selfie Liveness Verification
            </Text>
          </View>
          <Text style={[typography.bodyMedium, { color: theme.text.secondary, marginVertical: 8 }]}>
            Capture a live photograph to ensure match with your Aadhaar photo and fulfill RBI Master Directions on digital onboarding.
          </Text>

          <View style={[styles.selfiePlaceholder, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.gold.accent }]}>
            <Camera size={44} color={theme.maroon.primary} />
            <Text style={[typography.h3, { color: theme.text.primary, marginTop: 8 }]}>
              Face Match: 98.4% Match
            </Text>
            <Text style={[typography.caption, { color: theme.semantic.success, fontWeight: '700' }]}>
              ✓ Liveness Confirmed
            </Text>
          </View>

          <Button
            title={isNRI ? 'Proceed to NRI Details' : 'Complete Registration'}
            onPress={handleNextStep}
            loading={loading}
            style={{ marginTop: 20 }}
          />
        </Card>
      )}

      {/* STEP 6: NRI Specific Flow */}
      {step === 6 && isNRI && (
        <Card variant="elevated" style={styles.stepCard}>
          <View style={styles.stepTitleRow}>
            <Globe size={22} color={theme.gold.accent} />
            <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 10 }]}>
              NRI Regulatory Compliance
            </Text>
          </View>
          <Text style={[typography.bodyMedium, { color: theme.text.secondary, marginVertical: 8 }]}>
            Under RBI Foreign Exchange Management Act (FEMA) regulations, chit subscription must be through Non-Resident Ordinary (NRO) accounts with a resident co-signatory.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>NRO Account Reference</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.surface.border, backgroundColor: theme.surface.inputBg }]}>
              <TextInput
                value={nreAccount}
                onChangeText={setNreAccount}
                style={[typography.bodyLarge, styles.input, { color: theme.text.primary }]}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[typography.caption, { color: theme.text.secondary }]}>Resident Local Co-Signatory</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.surface.border, backgroundColor: theme.surface.inputBg }]}>
              <TextInput
                value={nriLocalGuarantor}
                onChangeText={setNriLocalGuarantor}
                style={[typography.bodyLarge, styles.input, { color: theme.text.primary }]}
              />
            </View>
          </View>

          <Button
            title="Complete NRI Onboarding"
            onPress={handleNextStep}
            loading={loading}
            style={{ marginTop: 20 }}
          />
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepCard: {
    padding: 20,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputGroup: {
    marginTop: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 6,
  },
  input: {
    flex: 1,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginTop: 18,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 14,
  },
  selfiePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginVertical: 16,
  },
});
