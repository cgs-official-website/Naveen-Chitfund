import express from 'express';
import authRoutes from './auth.js';
import dashboardRoutes from './dashboard.js';
import foremenRoutes from './foremen.js';
import chitGroupsRoutes from './chitGroups.js';
import subscribersRoutes from './subscribers.js';
import kycRoutes from './kyc.js';
import auctionsRoutes from './auctions.js';
import paymentsRoutes from './payments.js';
import suretiesRoutes from './sureties.js';
import ledgerRoutes from './ledger.js';
import complianceRoutes from './compliance.js';
import auditLogsRoutes from './auditLogs.js';
import settingsRoutes from './settings.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/foremen', foremenRoutes);
router.use('/chit-groups', chitGroupsRoutes);
router.use('/subscribers', subscribersRoutes);
router.use('/kyc', kycRoutes);
router.use('/auctions', auctionsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/sureties', suretiesRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/compliance', complianceRoutes);
router.use('/audit-logs', auditLogsRoutes);
router.use('/settings', settingsRoutes);

export default router;
