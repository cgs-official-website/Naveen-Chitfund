import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { query, logAuditEvent } from '../../db.js';
import { asyncHandler, ApiError } from '../../middleware/errorHandler.js';
import { validateBody } from '../../utils/validate.js';
import { requireSuperAdmin } from '../../middleware/superadminAuth.js';

const router = express.Router();

const superadminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
});

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(12, 'New password must be at least 12 characters'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const getJwtSecret = () =>
  process.env.SUPERADMIN_JWT_SECRET || 'superadmin_ultra_secure_secret_naveenchit_2026_finance_panel';

function signAccessToken(admin) {
  return jwt.sign(
    {
      sub: admin.id,
      email: admin.email,
      role: 'superadmin',
      aud: 'superadmin',
    },
    getJwtSecret(),
    { expiresIn: process.env.SUPERADMIN_JWT_EXPIRES || '15m' }
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// POST /api/v1/superadmin/auth/login
router.post(
  '/login',
  superadminLoginLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Superadmin Client';

    const normalizedEmail = email.trim().toLowerCase();
    const { rows } = await query(
      `SELECT * FROM super_admins WHERE email = $1`,
      [normalizedEmail]
    );

    const admin = rows[0];

    // Generic error helper to avoid user enumeration
    const failLogin = async (targetAdmin, reason = 'invalid_credentials') => {
      if (targetAdmin) {
        const nextAttempts = targetAdmin.failed_attempts + 1;
        let lockUntil = targetAdmin.locked_until;

        if (nextAttempts >= 5) {
          lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        }

        await query(
          `UPDATE super_admins
           SET failed_attempts = $1, locked_until = $2, updated_at = now()
           WHERE id = $3`,
          [nextAttempts, lockUntil, targetAdmin.id]
        );

        await logAuditEvent(null, {
          eventType: 'SUPERADMIN_LOGIN_FAILED',
          actorId: targetAdmin.id,
          actorType: 'SUPERADMIN',
          entityType: 'super_admins',
          entityId: targetAdmin.id,
          metadata: { email: normalizedEmail, attempts: nextAttempts, reason },
          ipAddress: clientIp,
        });
      } else {
        await logAuditEvent(null, {
          eventType: 'SUPERADMIN_LOGIN_FAILED',
          actorId: null,
          actorType: 'SUPERADMIN',
          entityType: 'super_admins',
          entityId: null,
          metadata: { email: normalizedEmail, reason: 'unknown_account' },
          ipAddress: clientIp,
        });
      }

      throw new ApiError(401, 'Invalid email or password');
    };

    if (!admin) {
      await failLogin(null);
    }

    // Check account active state
    if (!admin.is_active) {
      throw new ApiError(403, 'Account is disabled. Contact system administrator.');
    }

    // Check lock state
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      const minutesRemaining = Math.ceil((new Date(admin.locked_until) - new Date()) / 60000);
      throw new ApiError(
        423,
        `Account locked due to 5 consecutive failed attempts. Try again in ${minutesRemaining} minute(s).`
      );
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      await failLogin(admin);
    }

    // Reset failed attempts & update login metadata
    await query(
      `UPDATE super_admins
       SET failed_attempts = 0, locked_until = NULL, last_login_at = now(), last_login_ip = $1, updated_at = now()
       WHERE id = $2`,
      [clientIp, admin.id]
    );

    // Create session & refresh token
    const accessToken = signAccessToken(admin);
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      `INSERT INTO super_admin_sessions (super_admin_id, refresh_token_hash, user_agent, ip, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [admin.id, refreshTokenHash, userAgent, clientIp, expiresAt]
    );

    await logAuditEvent(null, {
      eventType: 'SUPERADMIN_LOGIN_SUCCESS',
      actorId: admin.id,
      actorType: 'SUPERADMIN',
      entityType: 'super_admins',
      entityId: admin.id,
      metadata: { email: admin.email, userAgent },
      ipAddress: clientIp,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: rawRefreshToken,
        admin: {
          id: admin.id,
          email: admin.email,
          fullName: admin.full_name,
          role: admin.role,
          mustChangePassword: admin.must_change_password,
        },
      },
    });
  })
);

// POST /api/v1/superadmin/auth/refresh
router.post(
  '/refresh',
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const tokenHash = hashToken(refreshToken);

    const { rows } = await query(
      `SELECT s.*, a.id as admin_id, a.email, a.full_name, a.role, a.is_active, a.must_change_password
       FROM super_admin_sessions s
       JOIN super_admins a ON a.id = s.super_admin_id
       WHERE s.refresh_token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now()`,
      [tokenHash]
    );

    if (!rows.length || !rows[0].is_active) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const session = rows[0];
    const newAccessToken = signAccessToken({
      id: session.admin_id,
      email: session.email,
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        admin: {
          id: session.admin_id,
          email: session.email,
          fullName: session.full_name,
          role: session.role,
          mustChangePassword: session.must_change_password,
        },
      },
    });
  })
);

// POST /api/v1/superadmin/auth/logout
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await query(
        `UPDATE super_admin_sessions SET revoked_at = now() WHERE refresh_token_hash = $1`,
        [tokenHash]
      );
    }
    res.json({ success: true, message: 'Logged out successfully' });
  })
);

// GET /api/v1/superadmin/auth/me
router.get(
  '/me',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT id, email, full_name, role, is_active, must_change_password, last_login_at, created_at
       FROM super_admins WHERE id = $1`,
      [req.superAdmin.id]
    );

    if (!rows.length) {
      throw new ApiError(404, 'Superadmin profile not found');
    }

    const a = rows[0];
    res.json({
      success: true,
      data: {
        id: a.id,
        email: a.email,
        fullName: a.full_name,
        role: a.role,
        isActive: a.is_active,
        mustChangePassword: a.must_change_password,
        lastLoginAt: a.last_login_at,
        createdAt: a.created_at,
      },
    });
  })
);

// POST /api/v1/superadmin/auth/change-password
router.post(
  '/change-password',
  requireSuperAdmin,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.superAdmin.id;

    const { rows } = await query(`SELECT password_hash FROM super_admins WHERE id = $1`, [adminId]);
    if (!rows.length) throw new ApiError(404, 'Admin not found');

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) {
      throw new ApiError(400, 'Current password does not match');
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await query(
      `UPDATE super_admins
       SET password_hash = $1, must_change_password = false, updated_at = now()
       WHERE id = $2`,
      [newHash, adminId]
    );

    // Revoke previous sessions except current
    await query(
      `UPDATE super_admin_sessions SET revoked_at = now() WHERE super_admin_id = $1`,
      [adminId]
    );

    await logAuditEvent(null, {
      eventType: 'SUPERADMIN_PASSWORD_CHANGED',
      actorId: adminId,
      actorType: 'SUPERADMIN',
      entityType: 'super_admins',
      entityId: adminId,
      metadata: { adminId },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Password updated successfully' });
  })
);

export default router;
