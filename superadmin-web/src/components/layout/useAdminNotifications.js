import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useNotificationStore } from '../../store/notificationStore';

export const useAdminNotifications = () => {
  const { dismissedIds, dismissNotification, dismissByPath, dismissAll } = useNotificationStore();
  const [browserPermission, setBrowserPermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported';
  });
  const notifiedIdsRef = useRef(new Set());

  const hasBrowserSupport = typeof window !== 'undefined' && 'Notification' in window;

  const requestBrowserPermission = useCallback(async () => {
    if (!hasBrowserSupport) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      return permission;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  }, [hasBrowserSupport]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['superadmin-notifications-feed'],
    queryFn: async () => {
      const res = await api.get('/api/v1/superadmin/dashboard/summary');
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  const metrics = data?.metrics || {};
  const recentAudit = data?.recentAuditLogs || [];
  const liveAuction = data?.liveAuction;

  // Build high-value actionable notifications for superadmin
  const rawNotifications = [];

  // 1. Pending KYC queue
  if (metrics.pendingKyc > 0) {
    rawNotifications.push({
      id: 'notif-kyc-pending',
      title: 'Pending Member eKYC',
      description: `${metrics.pendingKyc} subscriber verification${metrics.pendingKyc > 1 ? 's' : ''} awaiting compliance review`,
      path: '/chit/kyc',
      badgeCount: metrics.pendingKyc,
      type: 'warning',
      category: 'KYC',
      time: 'Action Required',
      priority: 'high',
    });
  }

  // 2. Pending Sureties & Payouts
  if (metrics.pendingSureties > 0) {
    rawNotifications.push({
      id: 'notif-sureties-pending',
      title: 'Prized Bid Payouts Pending',
      description: `${metrics.pendingSureties} prized subscriber surety file${metrics.pendingSureties > 1 ? 's' : ''} awaiting approval`,
      path: '/chit/sureties',
      badgeCount: metrics.pendingSureties,
      type: 'warning',
      category: 'Sureties',
      time: 'Action Required',
      priority: 'high',
    });
  }

  // 3. Live Auction happening now
  if (metrics.liveAuctions > 0 || liveAuction) {
    rawNotifications.push({
      id: `notif-auction-${liveAuction?.id || 'live'}`,
      title: 'Reverse Auction Live Now',
      description: liveAuction
        ? `${liveAuction.group_name} round #${liveAuction.round_number} is actively taking bids`
        : `${metrics.liveAuctions} live auction cycle${metrics.liveAuctions > 1 ? 's' : ''} in progress`,
      path: '/chit/auctions',
      badgeCount: metrics.liveAuctions || 1,
      type: 'success',
      category: 'Auctions',
      time: 'Live',
      priority: 'urgent',
    });
  }

  // 4. Overdue Installments
  if (metrics.overdueInstallments > 0) {
    rawNotifications.push({
      id: 'notif-overdue-installments',
      title: 'Pending Installments',
      description: `${metrics.overdueInstallments} subscriber dues awaiting settlement or collection`,
      path: '/chit/payments',
      badgeCount: metrics.overdueInstallments,
      type: 'info',
      category: 'Payments',
      time: 'Billing',
    });
  }

  // 5. Recent audit critical events (last 3 if available)
  recentAudit.slice(0, 3).forEach((audit) => {
    rawNotifications.push({
      id: `notif-audit-${audit.id}`,
      title: `${audit.action?.replace(/_/g, ' ') || 'System Event'}`,
      description: `${audit.actor_name || 'System'}: ${audit.details?.summary || audit.entity_type || 'Activity registered'}`,
      path: '/chit/audit',
      badgeCount: 0,
      type: 'neutral',
      category: 'Audit',
      time: audit.created_at ? new Date(audit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
    });
  });

  // Filter out dismissed notifications
  const activeNotifications = rawNotifications.filter(
    (n) => !dismissedIds.includes(n.id)
  );

  // Trigger browser desktop notification when new high/urgent alert appears
  useEffect(() => {
    if (browserPermission !== 'granted' || !hasBrowserSupport) return;

    activeNotifications.forEach((n) => {
      // Fire browser notification only once per notification event cycle if not dismissed
      if (['high', 'urgent'].includes(n.priority) && !notifiedIdsRef.current.has(n.id)) {
        notifiedIdsRef.current.add(n.id);
        try {
          const notificationInstance = new Notification(n.title, {
            body: n.description,
            tag: n.id,
            icon: '/vite.svg',
          });
          notificationInstance.onclick = () => {
            window.focus();
            if (n.path) {
              window.location.hash = n.path;
            }
            notificationInstance.close();
          };
        } catch (e) {
          console.error('Desktop notification trigger failed:', e);
        }
      }
    });
  }, [activeNotifications, browserPermission, hasBrowserSupport]);

  // Group unread counts by navigation path for the sidebar badge
  const countsByPath = {};
  activeNotifications.forEach((n) => {
    if (n.path && !dismissedIds.includes(n.path) && !dismissedIds.includes(n.id)) {
      if (n.badgeCount > 0) {
        countsByPath[n.path] = (countsByPath[n.path] || 0) + n.badgeCount;
      }
    }
  });

  const totalUnreadCount = activeNotifications.length;

  return {
    notifications: activeNotifications,
    totalUnreadCount,
    countsByPath,
    browserPermission,
    requestBrowserPermission,
    hasBrowserSupport,
    dismissNotification,
    dismissByPath,
    dismissAll: () => dismissAll(rawNotifications.map((n) => n.id)),
    isLoading,
    refetch,
  };
};
