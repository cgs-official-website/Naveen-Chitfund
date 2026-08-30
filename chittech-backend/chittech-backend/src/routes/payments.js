const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { z } = require('zod');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { validateBody } = require('../utils/validate');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrderSchema = z.object({
  installmentId: z.string().uuid(),
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

    if (installment.user_id !== req.user.userId) {
      throw new ApiError(403, 'Not your installment');
    }
    if (installment.status === 'PAID') {
      throw new ApiError(400, 'Installment already paid');
    }

    const amountPaise = Math.round(Number(installment.amount_due) * 100);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `installment_${installmentId}`,
      notes: { installmentId, subscriptionId: installment.subscription_id },
    });

    const { rows } = await query(
      `INSERT INTO payments (user_id, subscription_id, installment_id, amount, razorpay_order_id, status)
       VALUES ($1, $2, $3, $4, $5, 'CREATED') RETURNING *`,
      [req.user.userId, installment.subscription_id, installmentId, installment.amount_due, order.id]
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

      const payRes = await query(
        `UPDATE payments SET status = 'SUCCESS', razorpay_payment_id = $1
         WHERE razorpay_order_id = $2 RETURNING *`,
        [payment.id, orderId]
      );

      if (payRes.rows.length) {
        const p = payRes.rows[0];
        await query(`UPDATE installments SET status = 'PAID' WHERE id = $1`, [p.installment_id]);
        await query(
          `INSERT INTO ledger_entries (chit_group_id, subscription_id, entry_type, amount)
           SELECT s.chit_group_id, s.id, 'INSTALLMENT', $1
           FROM subscriptions s WHERE s.id = $2`,
          [p.amount, p.subscription_id]
        );
        console.log(`[AUDIT] payment captured: order=${orderId} payment=${payment.id} amount=${p.amount}`);
      }
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
      `SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json({ success: true, data: rows });
  })
);

module.exports = router;
