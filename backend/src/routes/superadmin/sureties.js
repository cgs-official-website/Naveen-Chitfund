import express from 'express';
import { z } from 'zod';
import { query, withTransaction, logAuditEvent } from '../../db.js';
import { asyncHandler, ApiError } from '../../middleware/errorHandler.js';
import { requireSuperAdmin } from '../../middleware/superadminAuth.js';
import { validateBody, getPagination } from '../../utils/validate.js';
import { toPaise, toRupees } from '../../utils/money.js';

const router = express.Router();

const disburseSchema = z.object({
  bankAccountNumber: z.string().min(8, 'Bank account number is required'),
  bankIfsc: z.string().min(4, 'IFSC code is required'),
  bankBeneficiaryName: z.string().min(2, 'Beneficiary name is required'),
  paymentMode: z.enum(['RTGS', 'NEFT', 'IMPS', 'CHEQUE']).default('RTGS'),
});

// GET /api/v1/superadmin/sureties
router.get(
  '/',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const status = req.query.status || null;

    let whereClause = '';
    const params = [];

    if (status && status !== 'ALL') {
      params.push(status);
      whereClause = `WHERE s.status = $${params.length}`;
    }

    const countRes = await query(`SELECT COUNT(*)::int AS total FROM sureties s ${whereClause}`, params);
    const total = countRes.rows[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const { rows } = await query(
      `SELECT s.*,
              u.id AS user_id,
              u.full_name AS subscriber_name,
              u.phone AS subscriber_phone,
              cg.name AS group_name,
              cg.chit_amount,
              cg.foreman_commission_pct,
              sub.ticket_number,
              sub.subscriber_status,
              ca.winning_bid_pct,
              ca.month_number AS auction_month,
              d.status AS disbursal_status,
              d.utr_reference
       FROM sureties s
       JOIN subscriptions sub ON sub.id = s.subscription_id
       JOIN users u ON u.id = sub.user_id
       JOIN chit_groups cg ON cg.id = sub.chit_group_id
       LEFT JOIN chit_auctions ca ON ca.id = s.auction_id
       LEFT JOIN disbursals d ON d.surety_id = s.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    const items = rows.map((r) => {
      const grossPaise = toPaise(Number(r.chit_amount || 0));
      const winPct = Number(r.winning_bid_pct || 22.5);
      const discountPaise = Math.round((grossPaise * winPct) / 100);
      const netPayoutPaise = grossPaise - discountPaise;
      return {
        ...r,
        netPayoutAmount: toRupees(netPayoutPaise),
        netPayoutPaise,
        discountAmount: toRupees(discountPaise),
      };
    });

    res.json({
      success: true,
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  })
);

// GET /api/v1/superadmin/sureties/:id
router.get(
  '/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const suretyRes = await query(
      `SELECT s.*,
              u.full_name AS subscriber_name,
              u.phone AS subscriber_phone,
              cg.name AS group_name,
              cg.chit_amount,
              cg.foreman_commission_pct,
              sub.ticket_number,
              sub.subscriber_status,
              ca.winning_bid_pct,
              ca.month_number AS auction_month
       FROM sureties s
       JOIN subscriptions sub ON sub.id = s.subscription_id
       JOIN users u ON u.id = sub.user_id
       JOIN chit_groups cg ON cg.id = sub.chit_group_id
       LEFT JOIN chit_auctions ca ON ca.id = s.auction_id
       WHERE s.id = $1`,
      [id]
    );

    if (!suretyRes.rows.length) throw new ApiError(404, 'Surety not found');
    const s = suretyRes.rows[0];

    // Guarantors
    const gRes = await query(
      `SELECT * FROM guarantors WHERE surety_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    // Documents
    const docsRes = await query(
      `SELECT * FROM guarantor_documents WHERE surety_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    // Disbursal if any
    const dRes = await query(`SELECT * FROM disbursals WHERE surety_id = $1 LIMIT 1`, [id]);

    const grossPaise = toPaise(Number(s.chit_amount || 0));
    const winPct = Number(s.winning_bid_pct || 22.5);
    const discountPaise = Math.round((grossPaise * winPct) / 100);
    const netPayoutPaise = grossPaise - discountPaise;

    res.json({
      success: true,
      data: {
        ...s,
        netPayoutAmount: toRupees(netPayoutPaise),
        discountAmount: toRupees(discountPaise),
        guarantors: gRes.rows,
        documents: docsRes.rows,
        disbursal: dRes.rows[0] || null,
      },
    });
  })
);

// POST /api/v1/superadmin/sureties/:id/approve
router.post(
  '/:id/approve',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const suretyRes = await query(
      `SELECT s.*, sub.user_id, cg.chit_amount, cg.foreman_commission_pct, ca.winning_bid_pct
       FROM sureties s
       JOIN subscriptions sub ON sub.id = s.subscription_id
       JOIN chit_groups cg ON cg.id = sub.chit_group_id
       LEFT JOIN chit_auctions ca ON ca.id = s.auction_id
       WHERE s.id = $1`,
      [id]
    );
    if (!suretyRes.rows.length) throw new ApiError(404, 'Surety not found');
    const item = suretyRes.rows[0];

    const { rows } = await query(
      `UPDATE sureties
       SET status = 'APPROVED', reviewed_by = $1, reviewed_at = now(), updated_at = now()
       WHERE id = $2 RETURNING *`,
      [req.superAdmin.id, id]
    );

    // Initialize Disbursal record in PENDING state
    const grossPaise = toPaise(Number(item.chit_amount || 0));
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
        id,
        grossPaise,
        discountPaise,
        commissionPaise,
        netPayoutPaise,
      ]
    );

    await logAuditEvent(null, {
      eventType: 'SURETY_APPROVED',
      actorId: req.superAdmin.id,
      actorType: 'SUPERADMIN',
      entityType: 'sureties',
      entityId: id,
      afterState: rows[0],
      metadata: { approvedBy: req.superAdmin.email },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: rows[0] });
  })
);

// POST /api/v1/superadmin/sureties/:id/disburse
router.post(
  '/:id/disburse',
  requireSuperAdmin,
  validateBody(disburseSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { bankAccountNumber, bankIfsc, bankBeneficiaryName, paymentMode } = req.body;

    const suretyRes = await query(
      `SELECT s.*, sub.user_id, sub.id AS sub_id, sub.subscriber_status, cg.id AS group_id,
              cg.name AS group_name, cg.chit_amount, cg.foreman_commission_pct,
              ca.winning_bid_pct, ca.id AS act_auction_id
       FROM sureties s
       JOIN subscriptions sub ON sub.id = s.subscription_id
       JOIN chit_groups cg ON cg.id = sub.chit_group_id
       LEFT JOIN chit_auctions ca ON ca.id = s.auction_id
       WHERE s.id = $1`,
      [id]
    );
    if (!suretyRes.rows.length) throw new ApiError(404, 'Surety record not found');
    const s = suretyRes.rows[0];

    const grossPaise = toPaise(Number(s.chit_amount));
    const winPct = Number(s.winning_bid_pct || 22.5);
    const discountPaise = Math.round((grossPaise * winPct) / 100);
    const commissionPaise = Math.round((grossPaise * Number(s.foreman_commission_pct || 5)) / 100);
    const netPayoutPaise = grossPaise - discountPaise;
    const utrReference = `CMS${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await withTransaction(async (client) => {
      // 1. Transition subscriber status from SB to PS (Prized Subscriber)
      await client.query(
        `UPDATE subscriptions
         SET subscriber_status = 'PS', updated_at = now()
         WHERE id = $1`,
        [s.sub_id]
      );

      // 2. Mark surety DISBURSED
      await client.query(
        `UPDATE sureties
         SET status = 'DISBURSED', updated_at = now()
         WHERE id = $1`,
        [id]
      );

      // 3. Upsert Disbursals record as COMPLETED
      const disbursalRes = await client.query(
        `INSERT INTO disbursals (
           subscription_id, auction_id, surety_id, gross_amount_paise, discount_amount_paise,
           foreman_commission_paise, net_payout_paise, payment_mode, bank_account_number, bank_ifsc,
           bank_beneficiary_name, utr_reference, status, disbursed_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'COMPLETED', now())
         ON CONFLICT (auction_id) DO UPDATE
         SET status = 'COMPLETED',
             utr_reference = EXCLUDED.utr_reference,
             bank_account_number = EXCLUDED.bank_account_number,
             bank_ifsc = EXCLUDED.bank_ifsc,
             bank_beneficiary_name = EXCLUDED.bank_beneficiary_name,
             payment_mode = EXCLUDED.payment_mode,
             disbursed_at = now()
         RETURNING *`,
        [
          s.sub_id,
          s.act_auction_id,
          id,
          grossPaise,
          discountPaise,
          commissionPaise,
          netPayoutPaise,
          paymentMode,
          bankAccountNumber,
          bankIfsc,
          bankBeneficiaryName,
          utrReference,
        ]
      );

      // 4. Log audit event
      await logAuditEvent(client, {
        eventType: 'PRIZE_DISBURSED',
        actorId: req.superAdmin.id,
        actorType: 'SUPERADMIN',
        entityType: 'disbursals',
        entityId: disbursalRes.rows[0].id,
        afterState: disbursalRes.rows[0],
        metadata: {
          utrReference,
          netPayoutRupees: toRupees(netPayoutPaise),
          subscriberId: s.sub_id,
          disbursedBy: req.superAdmin.email,
        },
        ipAddress: req.ip,
      });

      return disbursalRes.rows[0];
    });

    res.json({
      success: true,
      data: {
        disbursal: result,
        utrReference,
        netPayoutAmount: toRupees(netPayoutPaise),
        subscriberStatus: 'PS',
      },
    });
  })
);

export default router;
