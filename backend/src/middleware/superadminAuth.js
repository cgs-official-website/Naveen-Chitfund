import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const getSecret = () =>
  process.env.SUPERADMIN_JWT_SECRET || 'superadmin_ultra_secure_secret_naveenchit_2026_finance_panel';

export async function requireSuperAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Superadmin authentication token required' });
  }

  try {
    const payload = jwt.verify(token, getSecret(), { audience: 'superadmin' });

    if (payload.role !== 'superadmin' && payload.role !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, error: 'Insufficient superadmin privileges' });
    }

    const { rows } = await query(
      `SELECT id, email, full_name, role, is_active, must_change_password
       FROM super_admins WHERE id = $1`,
      [payload.sub]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ success: false, error: 'Superadmin account is disabled or does not exist' });
    }

    req.superAdmin = rows[0];
    req.user = { userId: rows[0].id, role: 'superadmin' };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid superadmin token',
    });
  }
}
