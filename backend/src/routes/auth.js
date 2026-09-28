import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { query } from '../db.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { validateBody } from '../utils/validate.js';

const router = express.Router();

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many OTP requests, try again later' },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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
  fullName: z.string().min(2).optional(),
  role: z.enum(['user', 'admin']).optional(),
});

const directRegisterSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['user', 'admin']).optional().default('user'),
});

const directLoginSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
});

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'chittech_default_jwt_secret_2026';
  return jwt.sign({ userId: user.id, role: user.role }, secret, {
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

    console.log(`[MOCK SMS] OTP for ${phone}: ${code} (expires in 5 min)`);

    res.json({
      success: true,
      data: {
        message: 'OTP sent',
        ...(process.env.NODE_ENV !== 'production' ? { debugOtp: code } : {}),
      },
    });
  })
);

// POST /api/v1/auth/otp/verify -> creates user if new, returns JWT + role
router.post(
  '/otp/verify',
  otpVerifyLimiter,
  validateBody(verifySchema),
  asyncHandler(async (req, res) => {
    const { phone, code, fullName, role } = req.body;

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
      const assignedRole = role === 'admin' ? 'admin' : 'user';
      const insert = await query(
        `INSERT INTO users (full_name, phone, role)
         VALUES ($1, $2, $3) RETURNING *`,
        [fullName ? fullName.trim() : 'New Subscriber', phone, assignedRole]
      );
      user = insert.rows[0];
    } else if (fullName && user.full_name === 'New Subscriber') {
      const update = await query(
        `UPDATE users SET full_name = $1 WHERE id = $2 RETURNING *`,
        [fullName.trim(), user.id]
      );
      user = update.rows[0];
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
          role: user.role,
          kycStatus: user.kyc_status,
        },
      },
    });
  })
);

// POST /api/v1/auth/register-direct -> creates user without OTP verification
router.post(
  '/register-direct',
  validateBody(directRegisterSchema),
  asyncHandler(async (req, res) => {
    const { phone, fullName, role } = req.body;

    let userResult = await query('SELECT * FROM users WHERE phone = $1', [phone]);
    let user = userResult.rows[0];

    if (!user) {
      const assignedRole = role === 'admin' ? 'admin' : 'user';
      const insert = await query(
        `INSERT INTO users (full_name, phone, role)
         VALUES ($1, $2, $3) RETURNING *`,
        [fullName.trim(), phone, assignedRole]
      );
      user = insert.rows[0];
    } else {
      const update = await query(
        `UPDATE users SET full_name = $1, role = COALESCE($2, role) WHERE id = $3 RETURNING *`,
        [fullName.trim(), role || user.role, user.id]
      );
      user = update.rows[0];
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
          role: user.role,
          kycStatus: user.kyc_status,
        },
      },
    });
  })
);

// POST /api/v1/auth/login-direct -> logs in user without OTP verification
router.post(
  '/login-direct',
  validateBody(directLoginSchema),
  asyncHandler(async (req, res) => {
    const { phone } = req.body;

    const userResult = await query('SELECT * FROM users WHERE phone = $1', [phone]);
    const user = userResult.rows[0];

    if (!user) {
      throw new ApiError(404, 'No account found with this mobile number. Please register first.');
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
          role: user.role,
          kycStatus: user.kyc_status,
        },
      },
    });
  })
);

// GET /api/v1/auth/verify-session
router.get(
  '/verify-session',
  asyncHandler(async (req, res) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'No token provided');

    const secret = process.env.JWT_SECRET || 'chittech_default_jwt_secret_2026';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (e) {
      throw new ApiError(401, 'Invalid or expired session');
    }

    const { rows } = await query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    if (!rows.length) throw new ApiError(404, 'User not found');
    const user = rows[0];

    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: user.id,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role,
          kycStatus: user.kyc_status,
        },
      },
    });
  })
);

export default router;
