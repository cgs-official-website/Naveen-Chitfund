import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../core/theme/ThemeProvider';
import { Card } from '../../core/components/Card';
import { useAppStore } from '../../store/useAppStore';
import {
  Gavel,
  DollarSign,
  AlertCircle,
  FileCheck,
} from 'lucide-react-native';

export const NotificationsScreen = () => {
  const { theme, typography } = useTheme();
  const { user } = useAppStore();

  const isForeman = user?.role === 'admin';

  const notifications = [
    {
      id: 'notif-1',
      title: 'Auction Starting in 15 Minutes',
      body: 'Kaveti Smart Wealth Series-I auction opens at 05:30 PM. Quorum check is live.',
      time: '15m ago',
      type: 'AUCTION',
      isUnread: true,
      foremanOnly: false,
    },
    {
      id: 'notif-2',
      title: 'Dividend Credited: +₹3,800.00',
      body: 'Your share of Month 3 auction discount has reduced your next installment.',
      time: '2h ago',
      type: 'DIVIDEND',
      isUnread: false,
      foremanOnly: false,
    },
    {
      id: 'notif-3',
      title: 'Form XIV Minutes Due for Filing',
      body: 'Auction minutes for Series-I Month 3 must be lodged with Registrar within 48 hours.',
      time: '1d ago',
      type: 'REGISTRAR',
      isUnread: true,
      foremanOnly: true,
    },
    {
      id: 'notif-4',
      title: 'Installment Due Reminder',
      body: 'Next due date is 15 Sep 2026 for Kakatiya Premium Gold Chit.',
      time: '2d ago',
      type: 'DUE_DATE',
      isUnread: false,
      foremanOnly: false,
    },
  ];

  const filteredNotifications = notifications.filter(
    (n) => !n.foremanOnly || isForeman
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[typography.h1, { color: theme.text.primary }]}>Notifications</Text>
        <Text style={[typography.bodyMedium, { color: theme.text.secondary }]}>
          Auction Alerts, Dividend Credits & Statutory Nudges
        </Text>
      </View>

      {filteredNotifications.map((n) => {
        const getIcon = () => {
          switch (n.type) {
            case 'AUCTION':
              return <Gavel size={20} color={theme.gold.accent} />;
            case 'DIVIDEND':
              return <DollarSign size={20} color={theme.semantic.success} />;
            case 'REGISTRAR':
              return <FileCheck size={20} color={theme.maroon.primary} />;
            default:
              return <AlertCircle size={20} color={theme.semantic.warning} />;
          }
        };

        return (
          <Card
            key={n.id}
            style={[
              styles.notifCard,
              n.isUnread && {
                borderColor: theme.maroon.primary + '50',
                backgroundColor: theme.surface.cardSubtle,
              },
            ]}
          >
            <View style={styles.notifRow}>
              <View style={styles.iconWrapper}>{getIcon()}</View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.titleRow}>
                  <Text style={[typography.h3, { color: theme.text.primary }]}>{n.title}</Text>
                  {n.isUnread && <View style={[styles.unreadDot, { backgroundColor: theme.maroon.primary }]} />}
                </View>
                <Text style={[typography.bodySmall, { color: theme.text.secondary, marginTop: 3 }]}>
                  {n.body}
                </Text>
                <Text style={[typography.caption, { color: theme.text.muted, marginTop: 6 }]}>
                  {n.time} {n.foremanOnly ? '· Foreman Compliance Nudge' : ''}
                </Text>
              </View>
            </View>
          </Card>
        );
      })}
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
  notifCard: {
    marginBottom: 12,
    padding: 14,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    marginTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
