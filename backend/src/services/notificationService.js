import { query } from '../db.js';

/**
 * Send push notification via Expo Push API to a list of push tokens.
 * @param {Array<string>} pushTokens
 * @param {Object} message { title, body, data }
 */
async function sendExpoPushNotifications(pushTokens, { title, body, data = {} }) {
  if (!pushTokens || pushTokens.length === 0) return;

  const validTokens = pushTokens.filter(
    (t) => typeof t === 'string' && (t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken'))
  );

  if (validTokens.length === 0) return;

  const messages = validTokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: 'default',
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    return result;
  } catch (err) {
    console.error('[NotificationService] Expo Push delivery error:', err.message);
  }
}

/**
 * Dispatch a notification to a specific user.
 * Writes to notifications table and dispatches push alert to registered devices.
 */
export async function sendUserNotification({ userId, title, body, category = 'SYSTEM', data = {} }) {
  try {
    // 1. Insert into notifications table
    await query(
      `INSERT INTO notifications (user_id, title, body, category, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, body, category, JSON.stringify(data)]
    );

    // 2. Fetch active push tokens
    const { rows: tokenRows } = await query(
      `SELECT token FROM user_push_tokens WHERE user_id = $1 AND is_active = true`,
      [userId]
    );

    if (tokenRows.length > 0) {
      const tokens = tokenRows.map((r) => r.token);
      await sendExpoPushNotifications(tokens, { title, body, data: { ...data, category } });
    }
  } catch (err) {
    console.error('[NotificationService] Error sending user notification:', err.message);
  }
}

/**
 * Dispatch notification to all active subscribers in a chit group.
 */
export async function sendGroupNotification({ chitGroupId, title, body, category = 'AUCTION', data = {} }) {
  try {
    // Fetch all user IDs in this chit group
    const { rows: members } = await query(
      `SELECT DISTINCT user_id FROM subscriptions WHERE chit_group_id = $1 AND status = 'ACTIVE'`,
      [chitGroupId]
    );

    for (const member of members) {
      await sendUserNotification({
        userId: member.user_id,
        title,
        body,
        category,
        data: { ...data, chitGroupId },
      });
    }
  } catch (err) {
    console.error('[NotificationService] Error sending group notification:', err.message);
  }
}
