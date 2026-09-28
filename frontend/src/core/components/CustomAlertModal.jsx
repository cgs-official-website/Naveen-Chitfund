import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  LogOut,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  X,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Global handler subscription
let activeAlertHandler = null;

export const Alert = {
  alert: (title, message, buttons, options) => {
    if (activeAlertHandler) {
      activeAlertHandler({ title, message, buttons, options });
    } else {
      console.warn('CustomAlertModal is not mounted yet to handle:', title);
    }
  },
};

export const CustomAlert = Alert;

export const CustomAlertModal = () => {
  const { theme, typography, isDark } = useTheme();
  const [modalData, setModalData] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    activeAlertHandler = (payload) => {
      setModalData(payload);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    };

    return () => {
      activeAlertHandler = null;
    };
  }, []);

  const closeModal = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalData(null);
      if (typeof callback === 'function') {
        callback();
      }
    });
  };

  if (!modalData) return null;

  const { title = '', message = '', buttons } = modalData;

  // Derive contextual icon & accent
  const fullText = `${title} ${message}`.toLowerCase();
  let IconComponent = Info;
  let iconColor = '#D4AF37'; // Gold default
  let iconBg = 'rgba(212, 175, 55, 0.16)';

  if (fullText.includes('sign out') || fullText.includes('logout')) {
    IconComponent = LogOut;
    iconColor = '#EF4444';
    iconBg = 'rgba(239, 68, 68, 0.15)';
  } else if (fullText.includes('remove') || fullText.includes('delete')) {
    IconComponent = Trash2;
    iconColor = '#EF4444';
    iconBg = 'rgba(239, 68, 68, 0.15)';
  } else if (
    fullText.includes('error') ||
    fullText.includes('failed') ||
    fullText.includes('invalid') ||
    fullText.includes('unable') ||
    fullText.includes('incomplete')
  ) {
    IconComponent = AlertCircle;
    iconColor = '#EF4444';
    iconBg = 'rgba(239, 68, 68, 0.15)';
  } else if (
    fullText.includes('success') ||
    fullText.includes('ready') ||
    fullText.includes('enrolled') ||
    fullText.includes('credited') ||
    fullText.includes('saved') ||
    fullText.includes('scheduled') ||
    fullText.includes('updated') ||
    fullText.includes('lodged') ||
    fullText.includes('verified')
  ) {
    IconComponent = CheckCircle2;
    iconColor = '#10B981';
    iconBg = 'rgba(16, 185, 129, 0.15)';
  } else if (
    fullText.includes('statutory') ||
    fullText.includes('grace') ||
    fullText.includes('notice') ||
    fullText.includes('review')
  ) {
    IconComponent = AlertTriangle;
    iconColor = '#D4AF37';
    iconBg = 'rgba(212, 175, 55, 0.16)';
  }

  // Normalize buttons
  const normalizedButtons =
    buttons && buttons.length > 0
      ? buttons
      : [
          {
            text: 'OK',
            style: 'default',
            onPress: () => {},
          },
        ];

  const isTwoButtons = normalizedButtons.length === 2;

  return (
    <Modal transparent animationType="none" visible={true} onRequestClose={() => closeModal()}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={() => {
            const cancelBtn = normalizedButtons.find((b) => b.style === 'cancel');
            closeModal(cancelBtn?.onPress);
          }}
        />

        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1C0C14' : '#FFFFFF',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.35)' : 'rgba(56, 0, 12, 0.18)',
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header Icon circle */}
          <View style={[styles.iconCircle, { backgroundColor: iconBg, borderColor: iconColor + '40' }]}>
            <IconComponent size={28} color={iconColor} />
          </View>

          {/* Title */}
          {title ? (
            <Text
              style={[
                typography.h2,
                {
                  color: isDark ? '#FFFFFF' : '#2D0A14',
                  textAlign: 'center',
                  marginTop: 14,
                  fontSize: 18,
                  fontWeight: '800',
                  lineHeight: 24,
                },
              ]}
            >
              {title}
            </Text>
          ) : null}

          {/* Message content */}
          {message ? (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={[
                  typography.bodyMedium,
                  {
                    color: isDark ? '#C7B8AF' : '#5A4E46',
                    textAlign: 'center',
                    lineHeight: 21,
                    fontSize: 13.5,
                  },
                ]}
              >
                {message}
              </Text>
            </ScrollView>
          ) : null}

          {/* Action Buttons */}
          <View
            style={[
              styles.buttonsContainer,
              isTwoButtons ? styles.buttonsRow : styles.buttonsColumn,
            ]}
          >
            {normalizedButtons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';

              let btnBg = theme.maroon.primary;
              let textColor = '#FFFFFF';
              let borderColor = 'transparent';

              if (isCancel) {
                btnBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
                textColor = isDark ? '#E5D8CF' : '#5A4E46';
                borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
              } else if (isDestructive) {
                btnBg = 'rgba(239, 68, 68, 0.12)';
                textColor = '#EF4444';
                borderColor = 'rgba(239, 68, 68, 0.4)';
              } else if (normalizedButtons.length === 1) {
                btnBg = theme.maroon.primary;
                textColor = '#FFFFFF';
              }

              return (
                <TouchableOpacity
                  key={`modal-btn-${index}`}
                  style={[
                    styles.actionBtn,
                    isTwoButtons && styles.actionBtnHalf,
                    {
                      backgroundColor: btnBg,
                      borderColor: borderColor,
                      borderWidth: borderColor === 'transparent' ? 0 : 1,
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => closeModal(btn.onPress)}
                >
                  <Text
                    style={[
                      typography.button,
                      {
                        color: textColor,
                        fontWeight: '700',
                        fontSize: 14,
                        textAlign: 'center',
                      },
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 2, 5, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  scrollArea: {
    maxHeight: 220,
    marginTop: 10,
    width: '100%',
  },
  scrollContent: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  buttonsContainer: {
    width: '100%',
    marginTop: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonsColumn: {
    flexDirection: 'column',
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  actionBtnHalf: {
    flex: 1,
  },
});
