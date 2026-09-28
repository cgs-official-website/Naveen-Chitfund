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
  const { user, activeChits, currentAuction, activePrizeClaim } = useAppStore();

  const isForeman = user?.role === 'admin';

  // Dynamically derive notifications from real system and subscriber state
  const notifications = [];

  // 1. Live/Scheduled Auction Alert
  if (currentAuction) {
    notifications.push({
      id: `notif-auc-${currentAuction.id}`,
      type: 'AUCTION',
      title: currentAuction.status === 'IN_PROGRESS' ? 'Live Reverse Auction in Progress' : 'Monthly Auction Scheduled',
      body: `Reverse auction for ${currentAuction.chit_group_name} (Month #${currentAuction.month_number}) is ${currentAuction.status === 'IN_PROGRESS' ? 'now live! Submit your bids via WebSocket.' : 'scheduled soon.'}`,
      time: 'Just now',
      isUnread: currentAuction.status === 'IN_PROGRESS',
      foremanOnly: false,
    });
  }

  // 2. Due Installment Nudge
  if (activeChits && activeChits.length > 0) {
    const dueChit = activeChits.find((c) => c.installments_paid < c.total_installments);
    if (dueChit) {
      notifications.push({
        id: `notif-inst-${dueChit.id}`,
        type: 'PAYMENT',
        title: 'Monthly Installment Due',
        body: `Installment #${dueChit.installments_paid + 1} of ₹${dueChit.installment_amount.toLocaleString('en-IN')} for ${dueChit.chit_group_name} is due by the 15th.`,
        time: 'Today',
        isUnread: true,
        foremanOnly: false,
      });
    }

    // 3. Dividend notification
    const totalDiv = activeChits.reduce((acc, c) => acc + (c.total_dividend_earned || 0), 0);
    if (totalDiv > 0) {
      notifications.push({
        id: 'notif-div-earned',
        type: 'DIVIDEND',
        title: 'Statutory Dividend Credited',
        body: `You have accrued ₹${totalDiv.toLocaleString('en-IN')} in total dividend deductions across your active chit groups.`,
        time: 'Active cycle',
        isUnread: false,
        foremanOnly: false,
      });
    }
  }

  // 4. Prize Claim / Surety Alert
  if (activePrizeClaim) {
    notifications.push({
      id: 'notif-surety-claim',
      type: 'REGISTRAR',
      title: 'Prize Disbursal & Surety Review',
      body: `Status: ${activePrizeClaim.surety?.status || 'PENDING'}. Please ensure co-guarantor salary slips and identity proofs are verified.`,
      time: 'Recent',
      isUnread: activePrizeClaim.surety?.status === 'PENDING',
      foremanOnly: false,
    });
  }

  // 5. KYC Status Nudge
  if (user && user.kyc_status !== 'VERIFIED') {
    notifications.push({
      id: 'notif-kyc-nudge',
      type: 'REGISTRAR',
      title: 'Complete Your DPDP & PMLA KYC',
      body: 'Upload your PAN card and complete identity verification to qualify for reverse auction bidding and prize disbursals.',
      time: 'Account Notice',
      isUnread: true,
      foremanOnly: false,
    });
  }

  // 6. Foreman specific statutory reminders
  if (isForeman) {
    notifications.push({
      id: 'notif-foreman-formxiv',
      type: 'REGISTRAR',
      title: 'Section 18 / Form XIV Regulatory Filing',
      body: 'Ensure Form XIV auction minutes and GST tax invoices are filed with the State Registrar within 48 hours of auction completion.',
      time: 'Statutory Requirement',
      isUnread: false,
      foremanOnly: true,
    });
  }

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

      {filteredNotifications.length === 0 ? (
        <Card style={{ padding: 24, alignItems: 'center', marginTop: 10 }}>
          <Text style={[typography.h3, { color: theme.text.primary }]}>No Notifications</Text>
          <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 4, textAlign: 'center' }]}>
            You're all caught up. No pending auction alerts or statutory notices.
          </Text>
        </Card>
      ) : (
        filteredNotifications.map((n) => {
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
        })
      )}
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
