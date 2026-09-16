import express from 'express';
import { z } from 'zod';
import { query, withTransaction, logAuditEvent } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { validateBody } from '../utils/validate.js';
import { toPaise, toRupees } from '../utils/money.js';

const router = express.Router();

const addGuarantorSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  panNumber: z.string().optional(),
  relationship: z.string().optional(),
  monthlyIncomePaise: z.number().int().positive().optional(),
  cibilScore: z.number().int().min(300).max(900).optional(),
});

const disburseSchema = z.object({
  bankAccountNumber: z.string().min(8),
  bankIfsc: z.string().min(4),
  bankBeneficiaryName: z.string().min(2),
  paymentMode: z.enum(['RTGS', 'NEFT', 'IMPS', 'CHEQUE']).default('RTGS'),
});

// GET /api/v1/sureties/mine (auth'd user) — returns active prize money claim & surety package
router.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    // 1. Fetch user's subscription in SB (Successful Bidder) or PS (Prized Subscriber) status
    const subRes = await query(
      `SELECT s.id AS subscription_id, s.ticket_number, s.subscriber_status, s.prized_month,
              cg.id AS chit_group_id, cg.name AS chit_group_name, cg.chit_amount, cg.foreman_commission_pct,
              ca.id AS auction_id, ca.winning_bid_pct, ca.month_number AS auction_month
       FROM subscriptions s
       JOIN chit_groups cg ON cg.id = s.chit_group_id
       LEFT JOIN chit_auctions ca ON ca.winning_subscription_id = s.id
       WHERE s.user_id = $1 AND s.subscriber_status IN ('SB', 'PS')
       ORDER BY s.joined_at DESC
       LIMIT 1`,
      [req.user.userId]
    );

    if (!subRes.rows.length) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const sub = subRes.rows[0];
    const grossPaise = toPaise(Number(sub.chit_amount));
    const winPct = Number(sub.winning_bid_pct || 22.5);
    const discountPaise = Math.round((grossPaise * winPct) / 100);
    const commissionPaise = Math.round((grossPaise * Number(sub.foreman_commission_pct || 5)) / 100);
    const netPayoutPaise = grossPaise - discountPaise;

    // 2. Fetch or initialize surety record
    let surety = null;
    let guarantors = [];
    const suretyRes = await query(
      `SELECT * FROM sureties WHERE subscription_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [sub.subscription_id]
    );

    if (suretyRes.rows.length) {
      surety = suretyRes.rows[0];
      const gRes = await query(
        `SELECT * FROM guarantors WHERE surety_id = $1 ORDER BY created_at ASC`,
        [surety.id]
      );
      guarantors = gRes.rows;
    } else {
      // Auto-initialize surety record if not yet created
      const newSuretyRes = await query(
        `INSERT INTO sureties (subscription_id, auction_id, surety_type, status)
         VALUES ($1, $2, 'CO_GUARANTORS', 'PENDING')
         RETURNING *`,
        [sub.subscription_id, sub.auction_id]
      );
      surety = newSuretyRes.rows[0];
    }

    // 3. Fetch disbursal record if any
    let disbursal = null;
    const disbursalRes = await query(
      `SELECT * FROM disbursals WHERE subscription_id = $1 LIMIT 1`,
      [sub.subscription_id]
    );
    if (disbursalRes.rows.length) {
      disbursal = disbursalRes.rows[0];
    }

    res.json({
      success: true,
      data: {
        subscription: sub,
        grossAmount: Number(sub.chit_amount),
        grossAmountPaise: grossPaise,
        winningBidPct: winPct,
        discountAmount: toRupees(discountPaise),
        discountAmountPaise: discountPaise,
        foremanCommissionAmount: toRupees(commissionPaise),
        netPayoutAmount: toRupees(netPayoutPaise),
        netPayoutPaise,
        surety: {
          ...surety,
          guarantors,
        },
        disbursal,
      },
    });
  })
);

// POST /api/v1/sureties/:id/guarantors (auth'd user or admin) — add co-guarantor
router.post(
  '/:id/guarantors',
  requireAuth,
  validateBody(addGuarantorSchema),
  asyncHandler(async (req, res) => {
    const suretyId = req.params.id;
    const { fullName, phone, panNumber, relationship, monthlyIncomePaise, cibilScore } = req.body;

    const suretyRes = await query('SELECT * FROM sureties WHERE id = $1', [suretyId]);
    if (!suretyRes.rows.length) throw new ApiError(404, 'Surety record not found');

    const { rows } = await query(
      `INSERT INTO guarantors (surety_id, full_name, phone, pan_number, relationship, monthly_income_paise, cibil_score, signature_verified, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'VERIFIED')
       RETURNING *`,
      [suretyId, fullName, phone, panNumber || null, relationship || null, monthlyIncomePaise || null, cibilScore || null]
    );

    await logAuditEvent(null, {
      eventType: 'GUARANTOR_ADDED',
      actorId: req.user.userId,
      entityType: 'guarantors',
      entityId: rows[0].id,
      afterState: rows[0],
      metadata: { suretyId, fullName, phone },
    });

    res.status(201).json({ success: true, data: rows[0] });
  })
);

// POST /api/v1/sureties/:id/submit (auth'd user) — submit completed surety package for review
router.post(
  '/:id/submit',
  requireAuth,
  asyncHandler(async (req, res) => {
    const suretyId = req.params.id;

    const suretyRes = await query('SELECT * FROM sureties WHERE id = $1', [suretyId]);
    if (!suretyRes.rows.length) throw new ApiError(404, 'Surety record not found');

    const { rows } = await query(
      `UPDATE sureties SET status = 'SUBMITTED', updated_at = now() WHERE id = $1 RETURNING *`,
      [suretyId]
    );

    await logAuditEvent(null, {
      eventType: 'SURETY_SUBMITTED',
      actorId: req.user.userId,
      entityType: 'sureties',
      entityId: suretyId,
      afterState: rows[0],
    });

    res.json({ success: true, data: rows[0] });
  })
);

// POST /api/v1/sureties/:id/approve (admin) — approve submitted surety
router.post(
  '/:id/approve',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const suretyId = req.params.id;

    const suretyRes = await query(
      `SELECT s.*, sub.user_id, cg.chit_amount, cg.foreman_commission_pct, ca.winning_bid_pct
       FROM sureties s
       JOIN subscriptions sub ON sub.id = s.subscription_id
       JOIN chit_groups cg ON cg.id = sub.chit_group_id
       LEFT JOIN chit_auctions ca ON ca.id = s.auction_id
       WHERE s.id = $1`,
      [suretyId]
    );
    if (!suretyRes.rows.length) throw new ApiError(404, 'Surety not found');
    const item = suretyRes.rows[0];

    const { rows } = await query(
      `UPDATE sureties SET status = 'APPROVED', reviewed_by = $1, reviewed_at = now(), updated_at = now()
       WHERE id = $2 RETURNING *`,
      [req.user.userId, suretyId]
    );

    // Initialize or update disbursal in PENDING status
    const grossPaise = toPaise(Number(item.chit_amount));
    const winPct = Number(item.winning_bid_pct || 22.5);
    const discountPaise = Math.round((grossPaise * winPct) / 100);
    const commissionPaise = Math.round((grossPaise * Number(item.foreman_commission_pct || 5)) / 100);
    const netPayoutPaise = grossPaise - discountPaise;

    await query(
      `INSERT INTO disbursals (
         subscription_id, auction_id, surety_id, gross_amount_paise, discount_amount_paise,
         foreman_commission_paise, net_payout_paise, payment_mode, bank_account_number, bank_ifsc,
         bank_beneficiary_name, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'RTGS', 'PENDING_ENTRY', 'PENDING_IFSC', 'BENEFICIARY', 'PENDING')
       ON CONFLICT (auction_id) DO UPDATE
       SET surety_id = EXCLUDED.surety_id, status = 'PENDING'`,
      [
        item.subscription_id,
        item.auction_id,
        suretyId,
        grossPaise,
        discountPaise,
        commissionPaise,
        netPayoutPaise,
      ]
    );

    await logAuditEvent(null, {
      eventType: 'SURETY_APPROVED',
      actorId: req.user.userId,
      entityType: 'sureties',
      entityId: suretyId,
      afterState: rows[0],
    });

    res.json({ success: true, data: rows[0] });
  })
);

// POST /api/v1/sureties/:id/disburse (admin or user with admin/simulation) — executes RTGS disbursal and transitions SB -> PS
router.post(
  '/:id/disburse',
  requireAuth,
  validateBody(disburseSchema),
  asyncHandler(async (req, res) => {
    const suretyId = req.params.id;
    const { bankAccountNumber, bankIfsc, bankBeneficiaryName, paymentMode } = req.body;

    const suretyRes = await query(
      `SELECT s.*, sub.user_id, sub.id AS sub_id, sub.subscriber_status, cg.name AS group_name,
              cg.chit_amount, cg.foreman_commission_pct, ca.winning_bid_pct, ca.id AS act_auction_id
       FROM sureties s
       JOIN subscriptions sub ON sub.id = s.subscription_id
       JOIN chit_groups cg ON cg.id = sub.chit_group_id
       LEFT JOIN chit_auctions ca ON ca.id = s.auction_id
       WHERE s.id = $1`,
      [suretyId]
    );
    if (!suretyRes.rows.length) throw new ApiError(404, 'Surety record not found');
    const item = suretyRes.rows[0];

    const grossPaise = toPaise(Number(item.chit_amount));
    const winPct = Number(item.winning_bid_pct || 22.5);
    const discountPaise = Math.round((grossPaise * winPct) / 100);
    const commissionPaise = Math.round((grossPaise * Number(item.foreman_commission_pct || 5)) / 100);
    const netPayoutPaise = grossPaise - discountPaise;
    const utrNumber = `UTR${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const result = await withTransaction(async (client) => {
      // 1. Mark surety approved if not already
      await client.query(
        `UPDATE sureties SET status = 'APPROVED', updated_at = now() WHERE id = $1`,
        [suretyId]
      );

      // 2. Insert or update disbursal record as DISBURSED
      const disbursalRes = await client.query(
        `INSERT INTO disbursals (
           subscription_id, auction_id, surety_id, gross_amount_paise, discount_amount_paise,
           foreman_commission_paise, net_payout_paise, payment_mode, bank_account_number, bank_ifsc,
           bank_beneficiary_name, bank_reference_utr, status, disbursed_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'DISBURSED', now())
         ON CONFLICT (auction_id) DO UPDATE
         SET status = 'DISBURSED', bank_reference_utr = EXCLUDED.bank_reference_utr,
             bank_account_number = EXCLUDED.bank_account_number, bank_ifsc = EXCLUDED.bank_ifsc,
             bank_beneficiary_name = EXCLUDED.bank_beneficiary_name, disbursed_at = now()
         RETURNING *`,
        [
          item.sub_id,
          item.auction_id || item.act_auction_id,
          suretyId,
          grossPaise,
          discountPaise,
          commissionPaise,
          netPayoutPaise,
          paymentMode,
          bankAccountNumber,
          bankIfsc,
          bankBeneficiaryName,
          utrNumber,
        ]
      );

      // 3. STATUTORY TRANSITION (§ 31 Chit Funds Act):
      // Transition subscriber from 'SB' (Successful Bidder) to 'PS' (Prized Subscriber)
      const subUpdateRes = await client.query(
        `UPDATE subscriptions SET subscriber_status = 'PS' WHERE id = $1 RETURNING *`,
        [item.sub_id]
      );

      // 4. Record audit event
      await logAuditEvent(client, {
        eventType: 'PRIZE_DISBURSED',
        actorId: req.user.userId,
        entityType: 'disbursals',
        entityId: disbursalRes.rows[0].id,
        afterState: disbursalRes.rows[0],
        metadata: {
          subscriptionId: item.sub_id,
          utrNumber,
          netPayoutPaise,
          netPayoutRupees: toRupees(netPayoutPaise),
        },
      });

      return {
        disbursal: disbursalRes.rows[0],
        subscription: subUpdateRes.rows[0],
      };
    });

    res.json({
      success: true,
      data: {
        ...result,
        netPayoutAmount: toRupees(netPayoutPaise),
        utrNumber,
      },
    });
  })
);

export default router;
