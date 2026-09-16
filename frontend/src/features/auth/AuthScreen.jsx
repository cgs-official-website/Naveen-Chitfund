import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeProvider';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import { Input } from '../../core/components/Input';
import { useAppStore } from '../../store/useAppStore';
import { apiClient, setAuthToken } from '../../core/networking/apiClient';
import {
  Smartphone,
  KeyRound,
  User,
  ShieldCheck,
  CheckCircle2,
  Building,
  UserCheck,
  ArrowRight,
  RefreshCw,
  Edit3,
} from 'lucide-react-native';

export const AuthScreen = ({ onComplete }) => {
  const { theme, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const { login, updateDPDPConsent } = useAppStore();

  const topPadding = Math.max(insets.top, StatusBar.currentHeight || 0, 16);
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Form States
  const [phoneInput, setPhoneInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [debugOtp, setDebugOtp] = useState(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regRole, setRegRole] = useState('user'); // 'user' | 'admin'
  const [agreedToDPDP, setAgreedToDPDP] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const normalizePhone = (rawPhone) => {
    const cleaned = rawPhone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+91')) return cleaned;
    if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
    return `+91${cleaned}`;
  };

  // Quick helper for testing seeded demo accounts
  const handleQuickDemoFill = (role) => {
    setErrorMessage(null);
    setOtpSent(false);
    setOtpCode('');
    setDebugOtp(null);
    if (role === 'admin') {
      setPhoneInput('9999900000');
      if (authMode === 'register') {
        setRegFullName('ChitTech Foreman');
        setRegRole('admin');
      }
    } else {
      setPhoneInput('9999900001');
      if (authMode === 'register') {
        setRegFullName('Anitha Kumar');
        setRegRole('user');
      }
    }
  };

  const handleRequestOtp = async () => {
    setErrorMessage(null);
    const cleaned = phoneInput.replace(/[^\d]/g, '');
    if (cleaned.length < 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (authMode === 'register' && !regFullName.trim()) {
      setErrorMessage('Please enter your full legal name as per PAN / Aadhaar.');
      return;
    }
    if (authMode === 'register' && !agreedToDPDP) {
      setErrorMessage('Please consent to DPDP Act 2023 regulations to continue.');
      return;
    }

    const formattedPhone = normalizePhone(phoneInput);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/otp/request', { phone: formattedPhone });
      setLoading(false);
      setOtpSent(true);
      setResendCountdown(30);

      if (res.data?.data?.debugOtp) {
        setDebugOtp(res.data.data.debugOtp);
        setOtpCode(res.data.data.debugOtp); // auto-populate in development
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to send OTP. Please check backend connection.');
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage(null);
    if (!otpCode || otpCode.length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    const formattedPhone = normalizePhone(phoneInput);
    setLoading(true);

    try {
      const payload = {
        phone: formattedPhone,
        code: otpCode.trim(),
        ...(authMode === 'register' ? { fullName: regFullName.trim(), role: regRole } : {}),
      };

      const res = await apiClient.post('/auth/otp/verify', payload);
      const { token, user: serverUser, role } = res.data.data;

      // Store JWT token securely
      await setAuthToken(token);

      // Record DPDP consents on registration
      if (authMode === 'register' && agreedToDPDP) {
        try {
          await apiClient.post('/users/me/consents', {
            consents: {
              identity_verification: true,
              credit_bureau_check: true,
              auction_participation_records: true,
              regulatory_reporting_pmla: true,
              marketing_communications: false,
            },
          });
          updateDPDPConsent('identity_verification', true);
          updateDPDPConsent('credit_bureau_check', true);
          updateDPDPConsent('auction_participation_records', true);
          updateDPDPConsent('regulatory_reporting_pmla', true);
        } catch (e) {
          console.warn('DPDP consent saving non-fatal error:', e.message);
        }
      }

      // Update global application store
      login(
        {
          id: serverUser.id,
          phone: serverUser.phone,
          full_name: serverUser.fullName,
          role: role || serverUser.role,
          kyc_status:
            serverUser.kycStatus === 'APPROVED'
              ? 'VERIFIED'
              : serverUser.kycStatus === 'PENDING'
              ? 'PENDING'
              : 'NOT_STARTED',
          is_nri: false,
          biometric_enabled: rememberMe,
        },
        token
      );

      setLoading(false);
      if (onComplete) onComplete();
    } catch (err) {
      setLoading(false);
      setErrorMessage(err.message || 'Invalid or expired OTP. Please try again.');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface.base,
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header with Emblem */}
        <View style={styles.brandHeader}>
          <View style={[styles.logoContainer, { borderColor: theme.gold.accent }]}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={[typography.h1, { color: theme.text.primary, marginTop: 12 }]}>
            Naveen Chit Fund
          </Text>
          <Text style={[typography.caption, { color: theme.gold.accent, letterSpacing: 2, fontWeight: '700' }]}>
            GOVERNMENT REGULATED · TRUSTED SAVINGS
          </Text>
        </View>

        {/* Tab Switcher: Sign In vs Create Account */}
        <View style={[styles.tabSegment, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.surface.border }]}>
          <TouchableOpacity
            onPress={() => {
              setAuthMode('login');
              setOtpSent(false);
              setErrorMessage(null);
            }}
            style={[
              styles.tabBtn,
              authMode === 'login' && {
                backgroundColor: theme.surface.card,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: authMode === 'login' ? theme.maroon.primary : theme.text.secondary,
                  fontWeight: authMode === 'login' ? '700' : '500',
                  fontSize: 13,
                },
              ]}
            >
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setAuthMode('register');
              setOtpSent(false);
              setErrorMessage(null);
            }}
            style={[
              styles.tabBtn,
              authMode === 'register' && {
                backgroundColor: theme.surface.card,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: authMode === 'register' ? theme.maroon.primary : theme.text.secondary,
                  fontWeight: authMode === 'register' ? '700' : '500',
                  fontSize: 13,
                },
              ]}
            >
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo Account Quick Fill Bar */}
        <View style={styles.demoBar}>
          <Text style={[typography.caption, { color: theme.text.muted, marginRight: 8 }]}>Demo accounts:</Text>
          <TouchableOpacity
            onPress={() => handleQuickDemoFill('admin')}
            style={[styles.demoPill, { borderColor: theme.maroon.primary + '50', backgroundColor: theme.maroon.primary + '10' }]}
          >
            <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700' }]}>Foreman</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleQuickDemoFill('user')}
            style={[styles.demoPill, { borderColor: theme.gold.accent + '60', backgroundColor: theme.gold.accent + '15' }]}
          >
            <Text style={[typography.caption, { color: theme.gold.accent, fontWeight: '700' }]}>Subscriber</Text>
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {errorMessage && (
          <View style={[styles.errorBanner, { backgroundColor: theme.semantic.errorBg, borderColor: theme.semantic.error + '40' }]}>
            <Text style={[typography.caption, { color: theme.semantic.error, fontWeight: '600' }]}>
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Main Authentication Card */}
        <Card style={styles.formCard}>
          <Text style={[typography.h2, { color: theme.text.primary, marginBottom: 4 }]}>
            {authMode === 'login' ? 'Welcome Back' : 'Register New Account'}
          </Text>
          <Text style={[typography.caption, { color: theme.text.secondary, marginBottom: 20 }]}>
            {otpSent
              ? `Enter 6-digit OTP sent to ${normalizePhone(phoneInput)}`
              : authMode === 'login'
              ? 'Sign in securely using 6-digit phone verification OTP'
              : 'Join regulated chit groups with instant eKYC'}
          </Text>

          {/* Registration Extra Fields */}
          {authMode === 'register' && !otpSent && (
            <>
              <Input
                label="FULL LEGAL NAME (AS PER PAN / AADHAAR)"
                placeholder="e.g. Anitha Kumar"
                value={regFullName}
                onChangeText={setRegFullName}
                leftIcon={User}
                autoCapitalize="words"
              />

              {/* Account Type */}
              <Text style={[typography.caption, styles.fieldLabel, { color: theme.text.secondary, marginTop: 14 }]}>
                ACCOUNT TYPE
              </Text>
              <View style={styles.roleSelectionRow}>
                <TouchableOpacity
                  onPress={() => setRegRole('user')}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: regRole === 'user' ? theme.maroon.primary + '18' : theme.surface.cardSubtle,
                      borderColor: regRole === 'user' ? theme.maroon.primary : theme.surface.border,
                    },
                  ]}
                >
                  <UserCheck size={18} color={regRole === 'user' ? theme.maroon.primary : theme.text.muted} />
                  <Text style={[typography.caption, { color: regRole === 'user' ? theme.maroon.primary : theme.text.primary, fontWeight: '700', marginTop: 4 }]}>
                    Subscriber
                  </Text>
                  <Text style={[typography.caption, { color: theme.text.muted, fontSize: 9, textAlign: 'center', marginTop: 2 }]}>
                    Save & Bid in Chits
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setRegRole('admin')}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: regRole === 'admin' ? theme.maroon.primary + '18' : theme.surface.cardSubtle,
                      borderColor: regRole === 'admin' ? theme.maroon.primary : theme.surface.border,
                    },
                  ]}
                >
                  <Building size={18} color={regRole === 'admin' ? theme.maroon.primary : theme.text.muted} />
                  <Text style={[typography.caption, { color: regRole === 'admin' ? theme.maroon.primary : theme.text.primary, fontWeight: '700', marginTop: 4 }]}>
                    Foreman
                  </Text>
                  <Text style={[typography.caption, { color: theme.text.muted, fontSize: 9, textAlign: 'center', marginTop: 2 }]}>
                    Compliance & Filing
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Mobile Number Field (if OTP not yet sent) */}
          {!otpSent ? (
            <>
              <Input
                label="MOBILE NUMBER"
                placeholder="Enter 10-digit number"
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneInput}
                onChangeText={setPhoneInput}
                prefix="+91"
                rightIcon={Smartphone}
                clearable
                containerStyle={{ marginTop: authMode === 'register' ? 6 : 0 }}
              />

              {/* DPDP 2023 Consent Checkbox for registration */}
              {authMode === 'register' && (
                <TouchableOpacity
                  onPress={() => setAgreedToDPDP(!agreedToDPDP)}
                  style={styles.consentRow}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: agreedToDPDP ? theme.maroon.primary : 'transparent',
                        borderColor: agreedToDPDP ? theme.maroon.primary : theme.surface.border,
                      },
                    ]}
                  >
                    {agreedToDPDP && <CheckCircle2 size={13} color="#FFFFFF" />}
                  </View>
                  <Text style={[typography.caption, { color: theme.text.secondary, flex: 1, marginLeft: 10, lineHeight: 16 }]}>
                    I consent to digital identity verification under DPDP Act 2023 and agree to Chit Funds Act 1982 bye-laws.
                  </Text>
                </TouchableOpacity>
              )}

              {/* Request OTP Button */}
              <Button
                title={authMode === 'login' ? 'Send Verification OTP' : 'Send Registration OTP'}
                variant="primary"
                loading={loading}
                onPress={handleRequestOtp}
                icon={<ArrowRight size={18} color="#FFFFFF" />}
                style={{ marginTop: 22 }}
              />
            </>
          ) : (
            /* OTP Verification Step */
            <>
              {/* Phone number change chip */}
              <View style={[styles.phoneChip, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.surface.border }]}>
                <Smartphone size={14} color={theme.text.secondary} />
                <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700', marginLeft: 6 }]}>
                  {normalizePhone(phoneInput)}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setDebugOtp(null);
                  }}
                  style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}
                >
                  <Edit3 size={12} color={theme.maroon.primary} />
                  <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700', marginLeft: 4 }]}>
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Development OTP Banner */}
              {debugOtp && (
                <View style={[styles.devOtpCard, { backgroundColor: theme.gold.accent + '20', borderColor: theme.gold.accent + '50' }]}>
                  <Text style={[typography.caption, { color: theme.text.primary }]}>
                    Dev Mode Code: <Text style={{ fontWeight: '800', letterSpacing: 2 }}>{debugOtp}</Text>
                  </Text>
                  <TouchableOpacity onPress={() => setOtpCode(debugOtp)}>
                    <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '800', marginLeft: 8 }]}>
                      AUTO-FILL
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <Input
                label="6-DIGIT VERIFICATION CODE"
                placeholder="Enter 6-digit code"
                keyboardType="number-pad"
                maxLength={6}
                value={otpCode}
                onChangeText={setOtpCode}
                leftIcon={KeyRound}
                inputStyle={{ letterSpacing: 6, fontWeight: '700', fontSize: 18 }}
                containerStyle={{ marginTop: 10 }}
              />

              {/* Resend OTP Row */}
              <View style={styles.resendRow}>
                {resendCountdown > 0 ? (
                  <Text style={[typography.caption, { color: theme.text.muted }]}>
                    Resend code in {resendCountdown}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleRequestOtp} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <RefreshCw size={12} color={theme.maroon.primary} />
                    <Text style={[typography.caption, { color: theme.maroon.primary, fontWeight: '700', marginLeft: 4 }]}>
                      Resend OTP
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Biometric Toggle */}
              <View style={styles.rememberRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                    trackColor={{ false: theme.surface.border, true: theme.maroon.primary }}
                    thumbColor="#FFFFFF"
                  />
                  <Text style={[typography.caption, { color: theme.text.secondary, marginLeft: 8 }]}>
                    Remember session on device
                  </Text>
                </View>
              </View>

              {/* Verify Button */}
              <Button
                title={authMode === 'login' ? 'Verify & Sign In' : 'Verify & Complete Registration'}
                variant="primary"
                loading={loading}
                onPress={handleVerifyOtp}
                icon={<CheckCircle2 size={18} color="#FFFFFF" />}
                style={{ marginTop: 20 }}
              />
            </>
          )}
        </Card>

        {/* Regulatory Footer Stamp */}
        <View style={styles.footerStamp}>
          <ShieldCheck size={16} color={theme.gold.accent} />
          <Text style={[typography.caption, { color: theme.text.secondary, marginLeft: 8 }]}>
            Protected by Chit Funds Act, 1982 & DPDP Act, 2023
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  tabSegment: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  demoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  demoPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  errorBanner: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  formCard: {
    padding: 22,
    borderRadius: 18,
  },
  fieldLabel: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    overflow: 'hidden',
  },
  countryBadge: {
    paddingHorizontal: 12,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E020',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    height: '100%',
  },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  devOtpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  roleSelectionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  roleCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  footerStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
});
