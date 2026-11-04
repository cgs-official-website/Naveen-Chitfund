import { query } from '../db.js';
import { finalizeAuctionClose } from './auctionCloseService.js';
import { startAuctionSession } from './auctionStartService.js';

let timerIntervalId = null;
let isClosingProcessing = false;
let isStartingProcessing = false;

/**
 * Checks for scheduled auctions whose starting time has arrived (scheduled_at <= NOW())
 * and automatically starts them into LIVE state.
 */
export async function checkAndStartScheduledAuctions(io = null) {
  if (isStartingProcessing) return;
  isStartingProcessing = true;

  try {
    const scheduledRes = await query(
      `SELECT ca.id, ca.chit_group_id, ca.month_number, ca.scheduled_at, cg.name AS group_name
       FROM chit_auctions ca
       JOIN chit_groups cg ON cg.id = ca.chit_group_id
       WHERE ca.status = 'SCHEDULED'
         AND ca.scheduled_at IS NOT NULL
         AND ca.scheduled_at <= NOW()`
    );

    for (const auction of scheduledRes.rows) {
      try {
        console.log(
          `[AuctionTimerService] Auto-starting scheduled auction ${auction.id} for "${auction.group_name}" (month #${auction.month_number}) at scheduled time ${auction.scheduled_at}`
        );
        await startAuctionSession({
          auctionId: auction.id,
          actorId: null,
          actorType: 'SYSTEM',
          io,
        });
      } catch (startErr) {
        console.error(
          `[AuctionTimerService] Error auto-starting auction ${auction.id}:`,
          startErr.message
        );
      }
    }
  } catch (err) {
    console.error('[AuctionTimerService] Error polling scheduled auctions:', err.message);
  } finally {
    isStartingProcessing = false;
  }
}

/**
 * Checks for live auctions whose fixed duration has expired and automatically
 * finalizes and closes them.
 */
export async function checkAndCloseExpiredAuctions(io = null) {
  if (isClosingProcessing) return;
  isClosingProcessing = true;

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
    isClosingProcessing = false;
  }
}

/**
 * Starts the periodic background monitor for automatic auction start and closure.
 * Runs check every 5 seconds.
 */
export function startAuctionTimerMonitor(io = null, intervalMs = 5000) {
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
  }

  const runAllChecks = () => {
    checkAndStartScheduledAuctions(io);
    checkAndCloseExpiredAuctions(io);
  };

  // Initial check on startup
  runAllChecks();

  timerIntervalId = setInterval(runAllChecks, intervalMs);

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
