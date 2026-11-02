import { query } from '../db.js';
import { finalizeAuctionClose } from './auctionCloseService.js';

let timerIntervalId = null;
let isProcessing = false;

/**
 * Checks for live auctions whose fixed duration has expired and automatically
 * finalizes and closes them.
 */
export async function checkAndCloseExpiredAuctions(io = null) {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const expiredRes = await query(
      `SELECT id, chit_group_id, month_number, started_at, duration_seconds
       FROM chit_auctions
       WHERE status = 'LIVE'
         AND started_at IS NOT NULL
         AND (started_at + (COALESCE(duration_seconds, 300) * INTERVAL '1 second')) <= NOW()`
    );

    for (const auction of expiredRes.rows) {
      try {
        console.log(
          `[AuctionTimerService] Auto-closing expired auction ${auction.id} (month #${auction.month_number})`
        );
        await finalizeAuctionClose({
          auctionId: auction.id,
          actorId: null,
          actorType: 'SYSTEM',
          reason: 'Fixed auction duration elapsed',
          forceClosed: false,
          io,
        });
      } catch (closeErr) {
        console.error(
          `[AuctionTimerService] Error auto-closing auction ${auction.id}:`,
          closeErr.message
        );
      }
    }
  } catch (err) {
    console.error('[AuctionTimerService] Error polling expired auctions:', err.message);
  } finally {
    isProcessing = false;
  }
}

/**
 * Starts the periodic background monitor for automatic auction closure.
 * Runs check every 5 seconds.
 */
export function startAuctionTimerMonitor(io = null, intervalMs = 5000) {
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
  }

  // Initial check on startup
  checkAndCloseExpiredAuctions(io);

  timerIntervalId = setInterval(() => {
    checkAndCloseExpiredAuctions(io);
  }, intervalMs);

  // Allow Node process to exit cleanly if this timer is active
  if (timerIntervalId.unref) {
    timerIntervalId.unref();
  }

  console.log(`[AuctionTimerService] Background auction monitor started (interval: ${intervalMs}ms)`);
}

export function stopAuctionTimerMonitor() {
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
    console.log('[AuctionTimerService] Background auction monitor stopped');
  }
}
