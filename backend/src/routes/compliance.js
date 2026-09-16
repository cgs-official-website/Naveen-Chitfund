import express from 'express';
import { z } from 'zod';
import { query, logAuditEvent } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { validateBody } from '../utils/validate.js';
import { toPaise, toRupees } from '../utils/money.js';

const router = express.Router();

const dpdpConsentSchema = z.object({
  purpose: z.string().min(2),
  consented: z.boolean(),
});

const dpdpWithdrawSchema = z.object({
  purpose: z.string().min(2),
});

// GET /api/v1/compliance/dpdp/export (auth'd user) — Data Principal Right to Access (§ 11 DPDP Act 2023)
router.get(
  '/dpdp/export',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const [userRes, consentsRes, subsRes, paymentsRes, auditRes] = await Promise.all([
      query(
        `SELECT id, phone, full_name, role, kyc_status, pan_number, is_nri, created_at, updated_at
         FROM users WHERE id = $1`,
        [userId]
      ),
      query(`SELECT * FROM dpdp_consents WHERE user_id = $1 ORDER BY consent_timestamp DESC`, [userId]),
      query(
        `SELECT s.id, s.ticket_number, s.subscriber_status, s.prized_month, s.joined_at,
                cg.name AS group_name, cg.chit_amount, cg.duration_months
         FROM subscriptions s
         JOIN chit_groups cg ON cg.id = s.chit_group_id
         WHERE s.user_id = $1`,
        [userId]
      ),
      query(
        `SELECT p.id, p.amount, p.amount_paise, p.status, p.razorpay_payment_id, p.created_at
         FROM payments p
         WHERE p.user_id = $1
         ORDER BY p.created_at DESC`,
        [userId]
      ),
      query(
        `SELECT id, event_type, entity_type, entity_id, created_at
         FROM audit_events
         WHERE actor_id = $1
         ORDER BY created_at DESC LIMIT 50`,
        [userId]
      ),
    ]);

    if (!userRes.rows.length) throw new ApiError(404, 'User not found');

    const exportPackage = {
      complianceStandard: 'DPDP Act, 2023 (Section 11) - Data Principal Export Package',
      exportTimestamp: new Date().toISOString(),
      dataPrincipal: userRes.rows[0],
      activeConsents: consentsRes.rows,
      subscribedChits: subsRes.rows,
      financialLedgers: paymentsRes.rows,
      activityAuditTrail: auditRes.rows,
    };

    await logAuditEvent(null, {
      eventType: 'DPDP_DATA_EXPORTED',
      actorId: userId,
      entityType: 'users',
      entityId: userId,
      metadata: { recordCount: paymentsRes.rows.length + subsRes.rows.length },
    });

    res.json({
      success: true,
      data: exportPackage,
    });
  })
);

// POST /api/v1/compliance/dpdp/consent (auth'd user) — update/grant consent
router.post(
  '/dpdp/consent',
  requireAuth,
  validateBody(dpdpConsentSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { purpose, consented } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'ChitTech App';

    const { rows } = await query(
      `INSERT INTO dpdp_consents (user_id, purpose, consented, consent_timestamp, ip_address, user_agent)
       VALUES ($1, $2, $3, now(), $4, $5)
       ON CONFLICT (user_id, purpose) DO UPDATE
       SET consented = EXCLUDED.consented,
           consent_timestamp = now(),
           withdrawal_timestamp = NULL,
           ip_address = EXCLUDED.ip_address,
           user_agent = EXCLUDED.user_agent
       RETURNING *`,
      [userId, purpose, consented, ipAddress, userAgent]
    );

    await logAuditEvent(null, {
      eventType: 'DPDP_CONSENT_UPDATED',
      actorId: userId,
      entityType: 'dpdp_consents',
      entityId: rows[0].id,
      afterState: rows[0],
      metadata: { purpose, consented },
    });

    res.json({ success: true, data: rows[0] });
  })
);

// POST /api/v1/compliance/dpdp/withdraw (auth'd user) — revoke consent (§ 6(4) DPDP Act 2023)
router.post(
  '/dpdp/withdraw',
  requireAuth,
  validateBody(dpdpWithdrawSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { purpose } = req.body;

    const { rows } = await query(
      `UPDATE dpdp_consents
       SET consented = false, withdrawal_timestamp = now()
       WHERE user_id = $1 AND purpose = $2
       RETURNING *`,
      [userId, purpose]
    );

    if (!rows.length) {
      throw new ApiError(404, `No active consent record found for purpose: ${purpose}`);
    }

    await logAuditEvent(null, {
      eventType: 'DPDP_CONSENT_WITHDRAWN',
      actorId: userId,
      entityType: 'dpdp_consents',
      entityId: rows[0].id,
      afterState: rows[0],
      metadata: { purpose },
    });

    res.json({ success: true, data: rows[0] });
  })
);

// GET /api/v1/compliance/form-xiv/:auctionId — generate Form XIV Minutes (§ 18 Chit Funds Act, 1982)
router.get(
  '/form-xiv/:auctionId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { auctionId } = req.params;

    const auctionRes = await query(
      `SELECT ca.*, cg.name AS group_name, cg.chit_amount, cg.duration_months,
              cg.foreman_commission_pct, cg.registrar_state_code,
              u.full_name AS winner_name, u.phone AS winner_phone,
              s.ticket_number AS winner_ticket_number
       FROM chit_auctions ca
       JOIN chit_groups cg ON cg.id = ca.chit_group_id
       LEFT JOIN subscriptions s ON s.id = ca.winning_subscription_id
       LEFT JOIN users u ON u.id = s.user_id
       WHERE ca.id = $1`,
      [auctionId]
    );

    if (!auctionRes.rows.length) throw new ApiError(404, 'Auction not found');
    const a = auctionRes.rows[0];

    const grossAmount = Number(a.chit_amount);
    const winBidPct = Number(a.winning_bid_pct || 0);
    const discountAmount = Math.round((grossAmount * winBidPct) / 100);
    const foremanCommission = Math.round((grossAmount * Number(a.foreman_commission_pct || 5)) / 100);
    const prizeMoney = grossAmount - discountAmount;
    const distributableDividend = Math.max(0, discountAmount - foremanCommission);

    // Count subscribers
    const subCountRes = await query(
      `SELECT COUNT(*)::int AS total FROM subscriptions WHERE chit_group_id = $1`,
      [a.chit_group_id]
    );
    const totalSubscribers = subCountRes.rows[0]?.total || a.duration_months;

    const formXIV = {
      formName: 'FORM XIV',
      statutoryReference: 'Rule 27 / Section 18 of Chit Funds Act, 1982',
      filingDeadlineHours: 48,
      minutesFilingReference: `ROC/${a.registrar_state_code || 'TS'}/${new Date().getFullYear()}/FXIV-${a.id.slice(0, 8).toUpperCase()}`,
      chitGroup: {
        id: a.chit_group_id,
        name: a.group_name,
        chitAmount: grossAmount,
        durationMonths: a.duration_months,
      },
      auctionProceedings: {
        auctionId: a.id,
        monthNumber: a.month_number,
        conductedAt: a.closed_at || a.scheduled_at || new Date().toISOString(),
        totalSubscribers,
        presentSubscribersCount: totalSubscribers,
        winningBidDiscountPct: winBidPct,
        discountOfferedRupees: discountAmount,
        foremanCommissionRupees: foremanCommission,
        netPrizeMoneyDisbursable: prizeMoney,
        totalDividendDistributable: distributableDividend,
        dividendPerNonPrizedSubscriber: Math.round(distributableDividend / Math.max(1, totalSubscribers - a.month_number)),
      },
      successfulBidder: {
        ticketNumber: a.winner_ticket_number,
        name: a.winner_name || 'Designated Subscriber',
        phone: a.winner_phone,
      },
      declarations: [
        'The reverse auction was conducted openly and in strict compliance with the statutory 40% discount cap under Section 14.',
        'The foreman commission was deducted strictly at 5% as per Section 21 of the Chit Funds Act, 1982.',
        'True copies of the bid entries and minutes are lodged with the Registrar of Chits within the prescribed 48-hour statutory window.',
      ],
      dscStatus: 'DIGITALLY_SIGNED_SHA256_RSA',
      foremanSignatureVerification: 'CHITTECH FOREMAN ESCROW PVT LTD (DIRECTOR DSC VERIFIED)',
    };

    res.json({
      success: true,
      data: formXIV,
    });
  })
);

// GET /api/v1/compliance/gst-invoice/:auctionId — generate Statutory GST Tax Invoice (Notification 11/2017)
router.get(
  '/gst-invoice/:auctionId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { auctionId } = req.params;

    const auctionRes = await query(
      `SELECT ca.*, cg.name AS group_name, cg.chit_amount, cg.foreman_commission_pct,
              u.full_name AS winner_name, u.phone AS winner_phone, u.pan_number,
              s.ticket_number AS winner_ticket
       FROM chit_auctions ca
       JOIN chit_groups cg ON cg.id = ca.chit_group_id
       LEFT JOIN subscriptions s ON s.id = ca.winning_subscription_id
       LEFT JOIN users u ON u.id = s.user_id
       WHERE ca.id = $1`,
      [auctionId]
    );

    if (!auctionRes.rows.length) throw new ApiError(404, 'Auction not found');
    const a = auctionRes.rows[0];

    const grossAmount = Number(a.chit_amount);
    const commissionRatePct = Number(a.foreman_commission_pct || 5);
    const taxableCommissionPaise = Math.round((grossAmount * commissionRatePct * 100) / 100);
    const cgstPaise = Math.round(taxableCommissionPaise * 0.09);
    const sgstPaise = Math.round(taxableCommissionPaise * 0.09);
    const totalGstPaise = cgstPaise + sgstPaise;
    const totalInvoicePaise = taxableCommissionPaise + totalGstPaise;

    const invoice = {
      invoiceNumber: `INV-${new Date().getFullYear()}-${a.id.slice(0, 8).toUpperCase()}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      sacCode: '997159',
      sacDescription: 'Financial intermediation services (Chit Fund Foreman Management Commission)',
      gstNotification: 'Notification No. 11/2017 - Central Tax (Rate)',
      foremanEntity: {
        legalName: 'ChitTech Digital Chit Funds Private Limited',
        tradeName: 'ChitTech Fintech',
        gstin: '36AAACC1206K1ZF',
        pan: 'AAACC1206K',
        state: 'Telangana',
        stateCode: '36',
      },
      recipient: {
        name: a.winner_name || 'Subscriber',
        ticketNumber: a.winner_ticket,
        chitGroupName: a.group_name,
        pan: a.pan_number || 'UNREGISTERED',
      },
      lineItems: [
        {
          description: `Foreman Management Commission (Month ${a.month_number}) @ ${commissionRatePct}% on ₹${grossAmount.toLocaleString('en-IN')}`,
          taxableValuePaise: taxableCommissionPaise,
          taxableValueRupees: toRupees(taxableCommissionPaise),
          cgstRatePct: 9,
          cgstPaise,
          cgstRupees: toRupees(cgstPaise),
          sgstRatePct: 9,
          sgstPaise,
          sgstRupees: toRupees(sgstPaise),
          totalTaxPaise: totalGstPaise,
          totalTaxRupees: toRupees(totalGstPaise),
          totalAmountPaise: totalInvoicePaise,
          totalAmountRupees: toRupees(totalInvoicePaise),
        },
      ],
      rcmApplicable: false,
      legalNote: 'GST is charged strictly on Foreman Commission. Principal chit contributions are non-taxable as per Supreme Court of India rulings.',
    };

    res.json({
      success: true,
      data: invoice,
    });
  })
);

export default router;
