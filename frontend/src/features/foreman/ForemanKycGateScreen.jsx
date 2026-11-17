import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
    StatusBar,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeProvider';
import { Card } from '../../core/components/Card';
import { Button } from '../../core/components/Button';
import { Input } from '../../core/components/Input';
import { Alert } from '../../core/components/CustomAlertModal';
import { useAppStore } from '../../store/useAppStore';
import { ShieldCheck, Clock, LogOut, AlertTriangle, RefreshCw } from 'lucide-react-native';

/**
 * Shown INSTEAD of the normal app tabs while a foreman's KYC is not approved.
 *
 *  - NOT_STARTED / REJECTED  -> KYC form (name, email, PAN)
 *  - PENDING                 -> "waiting for Super Admin approval" (auto-checks every 8 s)
 *  - VERIFIED                -> this screen is no longer rendered (RootNavigator opens the app)
 */
export const ForemanKycGateScreen = ({ onSignOut }) => {
    const insets = useSafeAreaInsets();
    const { theme, typography } = useTheme();
    const { user, fetchUserProfile, updateUserProfile } = useAppStore();

    const status = user?.kyc_status || 'NOT_STARTED';
    const isPending = status === 'PENDING';
    const isRejected = status === 'REJECTED';

    const [fullName, setFullName] = useState(user?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [pan, setPan] = useState(user?.pan_number || '');
    const [submitting, setSubmitting] = useState(false);
    const [checking, setChecking] = useState(false);

    // While waiting, quietly re-check the approval status every 8 seconds.
    useEffect(() => {
        if (!isPending) return undefined;
        const timer = setInterval(() => {
            fetchUserProfile();
        }, 8000);
        return () => clearInterval(timer);
    }, [isPending]);

    const handleSubmit = async () => {
        const name = fullName.trim();
        const panValue = pan.trim().toUpperCase();
        const emailValue = email.trim();

        if (name.length < 2) {
            Alert.alert('Validation Error', 'Please enter your full legal name.');
            return;
        }
        if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            Alert.alert('Validation Error', 'Please enter a valid email address.');
            return;
        }
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panValue)) {
            Alert.alert(
                'Validation Error',
                'Invalid PAN format. Must be 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F).'
            );
            return;
        }

        setSubmitting(true);
        try {
            const res = await updateUserProfile({
                fullName: name,
                email: emailValue || undefined,
                panNumber: panValue,
            });
            if (!res.success) {
                Alert.alert('Submission Failed', res.error || 'Could not submit your KYC. Please try again.');
            }
            // On success the store now holds kyc_status = 'PENDING' and this screen switches to the waiting view.
        } finally {
            setSubmitting(false);
        }
    };

    const handleCheckStatus = async () => {
        setChecking(true);
        try {
            await fetchUserProfile();
        } finally {
            setChecking(false);
        }
    };

    const topPad = Math.max(insets.top, StatusBar.currentHeight || 0, 14);

    return (
        <View style={[styles.root, { backgroundColor: theme.surface.base }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: topPad, height: 56 + topPad }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={styles.logoBadge}>
                        <Image source={require('../../../assets/logo.png')} style={styles.logoIcon} resizeMode="contain" />
                    </View>
                    <View style={{ marginLeft: 10, flexShrink: 1 }}>
                        <Text style={styles.brand}>Naveen Chit Fund</Text>
                        <Text style={styles.subBrand}>FOREMAN ONBOARDING</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={onSignOut} activeOpacity={0.7} style={styles.signOutBtn}>
                    <LogOut size={15} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 + insets.bottom }}
                    keyboardShouldPersistTaps="handled"
                >
                    {isPending ? (
                        /* ---------- WAITING FOR APPROVAL ---------- */
                        <Card style={styles.card}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.18)' }]}>
                                <Clock size={30} color="#D4AF37" />
                            </View>
                            <Text style={[typography.h2, styles.center, { color: theme.text.primary, marginTop: 14 }]}>
                                KYC Submitted
                            </Text>
                            <Text style={[typography.bodyMedium, styles.center, { color: theme.text.secondary, marginTop: 6 }]}>
                                Your details are waiting for Super Admin approval. You can use the app as soon as you are approved.
                            </Text>

                            <View style={[styles.summaryBox, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.surface.border }]}>
                                <Text style={[typography.caption, { color: theme.text.secondary }]}>Name</Text>
                                <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '700' }]}>
                                    {user?.full_name || '-'}
                                </Text>
                                <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 8 }]}>PAN</Text>
                                <Text style={[typography.bodyMedium, { color: theme.text.primary, fontWeight: '700' }]}>
                                    {user?.pan_number || '-'}
                                </Text>
                                <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 8 }]}>Status</Text>
                                <Text style={[typography.bodyMedium, { color: '#D4AF37', fontWeight: '800' }]}>
                                    Waiting for approval
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14 }}>
                                <ActivityIndicator size="small" color={theme.maroon.primary} />
                                <Text style={[typography.caption, { color: theme.text.secondary, marginLeft: 8 }]}>
                                    Checking for approval automatically...
                                </Text>
                            </View>

                            <Button
                                title={checking ? 'Checking...' : 'Check approval status'}
                                variant="primary"
                                onPress={handleCheckStatus}
                                disabled={checking}
                                style={{ marginTop: 16 }}
                            />
                        </Card>
                    ) : (
                        /* ---------- KYC FORM ---------- */
                        <Card style={styles.card}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.maroon.primary + '18' }]}>
                                <ShieldCheck size={30} color={theme.maroon.primary} />
                            </View>
                            <Text style={[typography.h2, styles.center, { color: theme.text.primary, marginTop: 14 }]}>
                                Complete your KYC
                            </Text>
                            <Text style={[typography.bodyMedium, styles.center, { color: theme.text.secondary, marginTop: 6, marginBottom: 14 }]}>
                                Foremen must be verified by the Super Admin before they can use the app. Fill in your details and submit.
                            </Text>

                            {isRejected ? (
                                <View style={styles.rejectBox}>
                                    <AlertTriangle size={16} color="#B91C1C" />
                                    <Text style={[typography.caption, { color: '#B91C1C', marginLeft: 8, flex: 1, fontWeight: '600' }]}>
                                        Your previous KYC was rejected. Please correct your details and submit again.
                                    </Text>
                                </View>
                            ) : null}

                            <Input
                                label="Full Legal Name (as per Aadhaar / PAN)"
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="e.g. Ramesh Chandra Sharma"
                                autoCapitalize="words"
                            />
                            <Input
                                label="Email Address"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder="name@example.com"
                            />
                            <Input
                                label="Permanent Account Number (PAN)"
                                value={pan}
                                onChangeText={(v) => setPan(v.toUpperCase())}
                                autoCapitalize="characters"
                                maxLength={10}
                                placeholder="ABCDE1234F"
                            />

                            <Button
                                title={submitting ? 'Submitting...' : 'Submit for Approval'}
                                variant="primary"
                                onPress={handleSubmit}
                                disabled={submitting}
                                style={{ marginTop: 18 }}
                            />
                        </Card>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '#38000C',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(212, 175, 55, 0.3)',
    },
    logoBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#D4AF37',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    logoIcon: { width: 30, height: 30 },
    brand: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
    subBrand: { fontSize: 8.5, fontWeight: '700', color: '#D4AF37', letterSpacing: 1.2, marginTop: 1 },
    signOutBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.18)',
        borderWidth: 0.5,
        borderColor: 'rgba(239, 68, 68, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: { padding: 20 },
    center: { textAlign: 'center' },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    summaryBox: {
        marginTop: 18,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    rejectBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.35)',
        marginBottom: 12,
    },
});
