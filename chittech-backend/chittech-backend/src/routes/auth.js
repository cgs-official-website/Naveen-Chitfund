const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { query } = require('../db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { validateBody } = require('../utils/validate');

const router = express.Router();

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many OTP requests, try again later' },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many verification attempts, try again later' },
});

const phoneSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
});

const verifySchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  code: z.string().length(6),
});

function signToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/v1/auth/otp/request
router.post(
  '/otp/request',
  otpRequestLimiter,
  validateBody(phoneSchema),
  asyncHandler(async (req, res) => {
    const { phone } = req.body;
    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await query('INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)', [
      phone,
      code,
      expiresAt,
    ]);

    // TODO(compliance/prod): swap for real SMS provider (e.g. MSG91, Twilio).
    console.log(`[MOCK SMS] OTP for ${phone}: ${code} (expires in 5 min)`);

    res.json({ success: true, data: { message: 'OTP sent' } });
  })
);

// POST /api/v1/auth/otp/verify -> creates user if new, returns JWT + role
router.post(
  '/otp/verify',
  otpVerifyLimiter,
  validateBody(verifySchema),
  asyncHandler(async (req, res) => {
    const { phone, code } = req.body;

    const { rows } = await query(
      `SELECT id FROM otp_codes
       WHERE phone = $1 AND code = $2 AND consumed = false AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, code]
    );

    if (!rows.length) {
      throw new ApiError(400, 'Invalid or expired OTP');
    }

    await query('UPDATE otp_codes SET consumed = true WHERE id = $1', [rows[0].id]);

    let userResult = await query('SELECT * FROM users WHERE phone = $1', [phone]);
    let user = userResult.rows[0];

    if (!user) {
      const insert = await query(
        `INSERT INTO users (full_name, phone, role)
         VALUES ($1, $2, 'user') RETURNING *`,
        ['New Subscriber', phone]
      );
      user = insert.rows[0];
    }

    const token = signToken(user);

    res.json({
      success: true,
      data: {
        token,
        role: user.role,
        user: {
          id: user.id,
          fullName: user.full_name,
          phone: user.phone,
          kycStatus: user.kyc_status,
        },
      },
    });
  })
);

module.exports = router;
