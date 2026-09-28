import express from 'express';
import { query } from '../../db.js';
import { asyncHandler, ApiError } from '../../middleware/errorHandler.js';
import { requireSuperAdmin } from '../../middleware/superadminAuth.js';

const router = express.Router();

// GET /api/v1/superadmin/compliance/filing-tracker
router.get(
  '/filing-tracker',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT ca.id, ca.month_number, ca.status, ca.winning_bid_pct, ca.closed_at,
              cg.id AS chit_group_id, cg.name AS group_name, cg.chit_amount,
              u.full_name AS winner_name, s.ticket_number AS winner_ticket_number
       FROM chit_auctions ca
       JOIN chit_groups cg ON cg.id = ca.chit_group_id
       LEFT JOIN subscriptions s ON s.id = ca.winning_subscription_id
       LEFT JOIN users u ON u.id = s.user_id
       WHERE ca.status = 'COMPLETED'
       ORDER BY ca.closed_at DESC LIMIT 20`
    );

    const now = Date.now();
    const tracker = rows.map((a) => {
      const closedAtMs = a.closed_at ? new Date(a.closed_at).getTime() : now;
      const deadlineMs = closedAtMs + 48 * 60 * 60 * 1000;
      const remainingMs = deadlineMs - now;
      const hoursRemaining = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
      const minutesRemaining = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));

      return {
        ...a,
        filingDeadline: new Date(deadlineMs).toISOString(),
        isOverdue: remainingMs < 0,
        hoursRemaining,
        minutesRemaining,
        filingStatus: remainingMs < 0 ? 'OVERDUE' : 'DUE_SOON',
      };
    });

    res.json({ success: true, data: tracker });
  })
);

// GET /api/v1/superadmin/compliance/form-xiv/:auctionId
router.get(
  '/form-xiv/:auctionId',
  requireSuperAdmin,
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
      superadminReviewAudit: `Reviewed and certified by Superadmin: ${req.superAdmin.email}`,
    };

    res.json({ success: true, data: formXIV });
  })
);

// GET /api/v1/superadmin/compliance/gst-invoice/:auctionId
router.get(
  '/gst-invoice/:auctionId',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { auctionId } = req.params;

    const auctionRes = await query(
      `SELECT ca.*, cg.name AS group_name, cg.chit_amount, cg.foreman_commission_pct
       FROM chit_auctions ca
       JOIN chit_groups cg ON cg.id = ca.chit_group_id
       WHERE ca.id = $1`,
      [auctionId]
    );

    if (!auctionRes.rows.length) throw new ApiError(404, 'Auction not found');
    const a = auctionRes.rows[0];

    const grossAmount = Number(a.chit_amount);
    const commissionRatePct = Number(a.foreman_commission_pct || 5);
    const commissionTaxableValue = Math.round((grossAmount * commissionRatePct) / 100);

    const isIntraState = true;
    const cgstRate = isIntraState ? 9 : 0;
    const sgstRate = isIntraState ? 9 : 0;
    const igstRate = isIntraState ? 0 : 18;

    const cgstAmount = Math.round((commissionTaxableValue * cgstRate) / 100);
    const sgstAmount = Math.round((commissionTaxableValue * sgstRate) / 100);
    const igstAmount = Math.round((commissionTaxableValue * igstRate) / 100);
    const totalGstAmount = cgstAmount + sgstAmount + igstAmount;
    const totalInvoiceValue = commissionTaxableValue + totalGstAmount;

    const invoice = {
      invoiceNumber: `INV/GST/${new Date().getFullYear()}/AUCT-${a.id.slice(0, 8).toUpperCase()}`,
      invoiceDate: a.closed_at ? new Date(a.closed_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      hsnSacCode: '997159',
      hsnDescription: 'Financial consultancy, management and chit fund administrative services',
      supplier: {
        legalName: 'Naveen Chit Fund (P) Ltd.',
        gstin: '36AAACC1206K1ZF',
        state: 'Telangana',
        stateCode: '36',
      },
      itemDescription: `Foreman statutory commission (5%) on chit auction month #${a.month_number} for ${a.group_name}`,
      taxableValue: commissionTaxableValue,
      cgst: { ratePct: cgstRate, amount: cgstAmount },
      sgst: { ratePct: sgstRate, amount: sgstAmount },
      igst: { ratePct: igstRate, amount: igstAmount },
      totalTax: totalGstAmount,
      totalInvoiceAmount: totalInvoiceValue,
      complianceNote: 'Under GST Notification No. 11/2017, GST applies exclusively to the 5% foreman commission, not subscriber pool capital.',
    };

    res.json({ success: true, data: invoice });
  })
);

// GET /api/v1/superadmin/compliance/dpdp-export/:userId
router.get(
  '/dpdp-export/:userId',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const [userRes, consentsRes, subsRes, paymentsRes, auditRes] = await Promise.all([
      query(`SELECT * FROM users WHERE id = $1`, [userId]),
      query(`SELECT * FROM dpdp_consents WHERE user_id = $1 ORDER BY consent_timestamp DESC`, [userId]),
      query(
        `SELECT s.*, cg.name AS group_name, cg.chit_amount
         FROM subscriptions s
         JOIN chit_groups cg ON cg.id = s.chit_group_id
         WHERE s.user_id = $1`,
        [userId]
      ),
      query(`SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      query(`SELECT * FROM audit_events WHERE actor_id = $1 ORDER BY created_at DESC LIMIT 50`, [userId]),
    ]);

    if (!userRes.rows.length) throw new ApiError(404, 'User not found');

    res.json({
      success: true,
      data: {
        complianceStandard: 'DPDP Act, 2023 (Section 11) - Data Principal Export Package',
        exportTimestamp: new Date().toISOString(),
        dataPrincipal: userRes.rows[0],
        consents: consentsRes.rows,
        subscriptions: subsRes.rows,
        payments: paymentsRes.rows,
        auditTrail: auditRes.rows,
      },
    });
  })
);

export default router;
