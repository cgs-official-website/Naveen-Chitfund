import express from 'express';
import { z } from 'zod';
import { logAuditEvent } from '../../db.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requireSuperAdmin } from '../../middleware/superadminAuth.js';
import { validateBody } from '../../utils/validate.js';

const router = express.Router();

// In-memory runtime platform configuration with defaults
let platformSettings = {
  statutoryMaxDiscountPct: 40,
  statutoryMinBidPct: 5,
  foremanCommissionPct: 5,
  gstRatePct: 18,
  fdrPledgeRequiredPct: 100,
  formXivFilingWindowHours: 48,
  superadminSessionTimeoutMins: 15,
  subscriberSessionTimeoutDays: 7,
  maxFailedLoginAttempts: 5,
  lockoutDurationMins: 15,
  companyName: 'Naveen Chit Fund (P) Ltd.',
  gstin: '36AAACC1206K1ZF',
  supportEmail: 'compliance@naveenchit.com',
  supportPhone: '+91 99999 00000',
  environment: process.env.NODE_ENV || 'development',
  dpdpComplianceEnabled: true,
};

const updateSettingsSchema = z.object({
  supportEmail: z.string().email().optional(),
  supportPhone: z.string().min(8).optional(),
  superadminSessionTimeoutMins: z.number().int().min(5).max(120).optional(),
  companyName: z.string().min(2).optional(),
});

// GET /api/v1/superadmin/settings
router.get(
  '/',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: platformSettings,
    });
  })
);

// PATCH /api/v1/superadmin/settings
router.patch(
  '/',
  requireSuperAdmin,
  validateBody(updateSettingsSchema),
  asyncHandler(async (req, res) => {
    const beforeState = { ...platformSettings };
    platformSettings = {
      ...platformSettings,
      ...req.body,
    };

    await logAuditEvent(null, {
      eventType: 'PLATFORM_SETTINGS_UPDATED',
      actorId: req.superAdmin.id,
      actorType: 'SUPERADMIN',
      entityType: 'platform_settings',
      entityId: 'global',
      beforeState,
      afterState: platformSettings,
      metadata: { updatedBy: req.superAdmin.email },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: platformSettings,
    });
  })
);

export default router;
