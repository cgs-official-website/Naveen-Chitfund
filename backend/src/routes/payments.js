import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { query, withTransaction, logAuditEvent } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { validateBody } from '../utils/validate.js';
import { toPaise } from '../utils/money.js';

const router = express.Router();

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

const createOrderSchema = z.object({
  installmentId: z.string().uuid(),
});

const simulatePaymentSchema = z
  .object({
    installmentId: z.string().uuid().optional(),
    subscriptionId: z.string().uuid().optional(),
  })
  .refine((data) => Boolean(data.installmentId || data.subscriptionId), {
    message: 'Either installmentId or subscriptionId must be provided',
  });

// POST /api/v1/payments/order  (auth'd user) — creates a Razorpay order for an installment
router.post(
  '/order',
  requireAuth,
  validateBody(createOrderSchema),
  asyncHandler(async (req, res) => {
    const { installmentId } = req.body;

    const instRes = await query(
      `SELECT i.*, s.user_id, s.id AS subscription_id
       FROM installments i JOIN subscriptions s ON s.id = i.subscription_id
       WHERE i.id = $1`,
      [installmentId]
    );
    if (!instRes.rows.length) throw new ApiError(404, 'Installment not found');
    const installment = instRes.rows[0];

    if (installment.user_id !== req.user.userId && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not your installment');
    }
    if (installment.status === 'PAID') {
      throw new ApiError(400, 'Installment already paid');
    }

    const amountPaise = installment.amount_due_paise
      ? Number(installment.amount_due_paise)
      : toPaise(Number(installment.amount_due));

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `installment_${installmentId}`,
      notes: { installmentId, subscriptionId: installment.subscription_id },
    });

    const { rows } = await query(
      `INSERT INTO payments (user_id, subscription_id, installment_id, amount, amount_paise, razorpay_order_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'CREATED') RETURNING *`,
      [req.user.userId, installment.subscription_id, installmentId, installment.amount_due, amountPaise, order.id]
    );

    res.status(201).json({
      success: true,
      data: {
        payment: rows[0],
        razorpayOrderId: order.id,
        amount: amountPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  })
);

// POST /api/v1/payments/simulate (auth'd user) — simulates successful installment settlement for dev/testing
router.post(
  '/simulate',
  requireAuth,
  validateBody(simulatePaymentSchema),
  asyncHandler(async (req, res) => {
    const { installmentId, subscriptionId } = req.body;

    let installment;
    if (installmentId) {
      const instRes = await query(
        `SELECT i.*, s.user_id, s.chit_group_id, s.id AS sub_id, cg.name AS chit_group_name
         FROM installments i
         JOIN subscriptions s ON s.id = i.subscription_id
         JOIN chit_groups cg ON cg.id = s.chit_group_id
         WHERE i.id = $1`,
        [installmentId]
      );
      if (!instRes.rows.length) throw new ApiError(404, 'Installment not found');
      installment = instRes.rows[0];
    } else {
      const instRes = await query(
        `SELECT i.*, s.user_id, s.chit_group_id, s.id AS sub_id, cg.name AS chit_group_name
         FROM installments i
         JOIN subscriptions s ON s.id = i.subscription_id
         JOIN chit_groups cg ON cg.id = s.chit_group_id
         WHERE s.id = $1 AND i.status != 'PAID'
         ORDER BY i.month_number ASC
         LIMIT 1`,
        [subscriptionId]
      );
      if (!instRes.rows.length) throw new ApiError(404, 'No pending installment found for this subscription');
      installment = instRes.rows[0];
    }

    if (installment.user_id !== req.user.userId && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized to pay this installment');
    }
    if (installment.status === 'PAID') {
      throw new ApiError(400, 'Installment is already paid');
    }

    const amountNum = Number(installment.amount_due);
    const amountPaise = installment.amount_due_paise
      ? Number(installment.amount_due_paise)
      : toPaise(amountNum);
    const orderId = `sim_ord_${installment.id.replace(/-/g, '').slice(0, 12)}_${Date.now()}`;
    const paymentId = `sim_pay_${installment.id.replace(/-/g, '').slice(0, 12)}_${Date.now()}`;

    const result = await withTransaction(async (client) => {
      // 1. Mark installment as PAID
      const updatedInst = await client.query(
        `UPDATE installments SET status = 'PAID' WHERE id = $1 RETURNING *`,
        [installment.id]
      );

      // 2. Insert payment record as SUCCESS
      const payRes = await client.query(
        `INSERT INTO payments (user_id, subscription_id, installment_id, amount, amount_paise, razorpay_order_id, razorpay_payment_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'SUCCESS')
         RETURNING *`,
        [
          req.user.userId,
          installment.subscription_id || installment.sub_id,
          installment.id,
          amountNum,
          amountPaise,
          orderId,
          paymentId,
        ]
      );
      const paymentRecord = payRes.rows[0];

      // 3. Post double-entry ledger entry for INSTALLMENT collection
      await client.query(
        `INSERT INTO ledger_entries (chit_group_id, subscription_id, entry_type, amount, amount_paise)
         VALUES ($1, $2, 'INSTALLMENT', $3, $4)`,
        [
          installment.chit_group_id,
          installment.subscription_id || installment.sub_id,
          amountNum,
          amountPaise,
        ]
      );

      // 4. Log audit event
      await logAuditEvent(client, {
        eventType: 'PAYMENT_COLLECTED',
        actorId: req.user.userId,
        entityType: 'payments',
        entityId: paymentRecord.id,
        afterState: paymentRecord,
        metadata: {
          simulated: true,
          installment_id: installment.id,
          month_number: installment.month_number,
          razorpay_payment_id: paymentId,
        },
      });

      return {
        payment: paymentRecord,
        installment: updatedInst.rows[0],
      };
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  })
);

// POST /api/v1/payments/webhook  (Razorpay server-to-server, signature-verified, no auth middleware)
// NOTE: this route must receive the RAW body for signature verification — see index.js for
// the express.raw() mount used specifically on this path.
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body) // raw Buffer
      .digest('hex');

    if (signature !== expected) {
      throw new ApiError(400, 'Invalid webhook signature');
    }

    const event = JSON.parse(req.body.toString('utf8'));

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      // Idempotency check: if payment is already recorded as SUCCESS, skip re-processing
      const existingPay = await query(
        `SELECT * FROM payments WHERE razorpay_order_id = $1`,
        [orderId]
      );
      if (existingPay.rows.length && existingPay.rows[0].status === 'SUCCESS') {
        return res.json({ success: true, message: 'Payment already processed' });
      }

      await withTransaction(async (client) => {
        const payRes = await client.query(
          `UPDATE payments SET status = 'SUCCESS', razorpay_payment_id = $1, amount_paise = COALESCE(amount_paise, ROUND(amount * 100))
           WHERE razorpay_order_id = $2 RETURNING *`,
          [payment.id, orderId]
        );

        if (payRes.rows.length) {
          const p = payRes.rows[0];
          await client.query(`UPDATE installments SET status = 'PAID' WHERE id = $1`, [p.installment_id]);
          await client.query(
            `INSERT INTO ledger_entries (chit_group_id, subscription_id, entry_type, amount, amount_paise)
             SELECT s.chit_group_id, s.id, 'INSTALLMENT', $1, ROUND($1 * 100)
             FROM subscriptions s WHERE s.id = $2`,
            [p.amount, p.subscription_id]
          );

          await logAuditEvent(client, {
            eventType: 'PAYMENT_CAPTURED',
            actorId: p.user_id,
            entityType: 'payments',
            entityId: p.id,
            afterState: p,
            metadata: { razorpay_payment_id: payment.id, order_id: orderId },
          });
        }
      });
    } else if (event.event === 'payment.failed') {
      await query(`UPDATE payments SET status = 'FAILED' WHERE razorpay_order_id = $1`, [
        event.payload.payment.entity.order_id,
      ]);
    }

    res.json({ success: true });
  })
);

// GET /api/v1/payments/mine  (auth'd user's own payment history / receipts)
router.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT p.id, p.user_id, p.subscription_id, p.installment_id,
              p.amount::float AS amount,
              p.amount_paise,
              p.razorpay_order_id,
              p.razorpay_payment_id,
              p.status,
              p.created_at,
              cg.name AS chit_group_name,
              i.month_number,
              s.ticket_number
       FROM payments p
       LEFT JOIN subscriptions s ON s.id = p.subscription_id
       LEFT JOIN chit_groups cg ON cg.id = s.chit_group_id
       LEFT JOIN installments i ON i.id = p.installment_id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.userId]
    );
    res.json({ success: true, data: rows });
  })
);

export default router;
