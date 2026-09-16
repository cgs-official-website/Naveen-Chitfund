import express from 'express';
import { z } from 'zod';
import { query, logAuditEvent } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { validateBody } from '../utils/validate.js';
import { generateSignature, deleteAsset } from '../services/cloudinary.js';

const router = express.Router();

const signUploadSchema = z.object({
  folder: z.string().optional(),
  documentType: z.enum([
    'SALARY_SLIP',
    'FDR_CERTIFICATE',
    'PROPERTY_DEED',
    'PAN_CARD',
    'IDENTITY_PROOF',
    'OTHER',
  ]).optional(),
  suretyId: z.string().uuid().optional(),
  guarantorId: z.string().uuid().optional(),
});

const registerDocumentSchema = z.object({
  suretyId: z.string().uuid(),
  guarantorId: z.string().uuid().optional().nullable(),
  documentType: z.enum([
    'SALARY_SLIP',
    'FDR_CERTIFICATE',
    'PROPERTY_DEED',
    'PAN_CARD',
    'IDENTITY_PROOF',
    'OTHER',
  ]),
  title: z.string().min(1).max(255).optional(),
  fileUrl: z.string().url(),
  cloudinaryPublicId: z.string().min(1),
  cloudinaryFormat: z.string().optional(),
  fileSizeBytes: z.number().int().nonnegative().optional(),
  mimeType: z.string().optional(),
});

const reviewDocumentSchema = z.object({
  verificationStatus: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

/**
 * POST /api/v1/media/sign-upload
 * Generates an authorized timestamp & signature for direct client-side upload to Cloudinary.
 * CLOUDINARY_API_SECRET is NEVER exposed to the frontend.
 */
router.post(
  '/sign-upload',
  requireAuth,
  validateBody(signUploadSchema),
  asyncHandler(async (req, res) => {
    const timestamp = Math.round(Date.now() / 1000);
    const userId = req.user.userId;
    const folder = req.body.folder || `chittech/documents/${userId}`;

    const paramsToSign = {
      timestamp,
      folder,
    };

    const signature = generateSignature(paramsToSign);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'chittech-dev';
    const apiKey = process.env.CLOUDINARY_API_KEY || 'dev_api_key_placeholder';

    res.json({
      success: true,
      data: {
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder,
      },
    });
  })
);

/**
 * POST /api/v1/media/documents
 * Registers an uploaded Cloudinary asset into the PostgreSQL guarantor_documents table.
 */
router.post(
  '/documents',
  requireAuth,
  validateBody(registerDocumentSchema),
  asyncHandler(async (req, res) => {
    const {
      suretyId,
      guarantorId,
      documentType,
      title,
      fileUrl,
      cloudinaryPublicId,
      cloudinaryFormat,
      fileSizeBytes,
      mimeType,
    } = req.body;

    // Verify surety exists and caller is owner or admin
    const suretyRes = await query(
      `SELECT s.*, sub.user_id
       FROM sureties s
       JOIN subscriptions sub ON sub.id = s.subscription_id
       WHERE s.id = $1`,
      [suretyId]
    );

    if (!suretyRes.rows.length) {
      throw new ApiError(404, 'Surety record not found');
    }

    const surety = suretyRes.rows[0];
    if (req.user.role !== 'admin' && surety.user_id !== req.user.userId) {
      throw new ApiError(403, 'You do not have permission to upload documents for this surety package');
    }

    // If guarantorId provided, verify it belongs to this surety
    if (guarantorId) {
      const gRes = await query(
        'SELECT id FROM guarantors WHERE id = $1 AND surety_id = $2',
        [guarantorId, suretyId]
      );
      if (!gRes.rows.length) {
        throw new ApiError(400, 'Guarantor does not belong to the specified surety package');
      }
    }

    const { rows } = await query(
      `INSERT INTO guarantor_documents (
         surety_id, guarantor_id, document_type, title, file_url,
         cloudinary_public_id, cloudinary_format, file_size_bytes, mime_type,
         uploaded_by, verification_status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')
       RETURNING *`,
      [
        suretyId,
        guarantorId || null,
        documentType,
        title || documentType,
        fileUrl,
        cloudinaryPublicId,
        cloudinaryFormat || null,
        fileSizeBytes || null,
        mimeType || null,
        req.user.userId,
      ]
    );

    await logAuditEvent(null, {
      eventType: 'DOCUMENT_UPLOADED',
      actorId: req.user.userId,
      entityType: 'guarantor_documents',
      entityId: rows[0].id,
      afterState: rows[0],
      metadata: { suretyId, guarantorId, documentType, cloudinaryPublicId },
    });

    res.status(201).json({
      success: true,
      data: rows[0],
    });
  })
);

/**
 * GET /api/v1/media/documents/surety/:suretyId
 * Lists all uploaded documents for a given surety package.
 */
router.get(
  '/documents/surety/:suretyId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { suretyId } = req.params;

    const suretyRes = await query(
      `SELECT s.*, sub.user_id
       FROM sureties s
       JOIN subscriptions sub ON sub.id = s.subscription_id
       WHERE s.id = $1`,
      [suretyId]
    );

    if (!suretyRes.rows.length) {
      throw new ApiError(404, 'Surety package not found');
    }

    if (req.user.role !== 'admin' && suretyRes.rows[0].user_id !== req.user.userId) {
      throw new ApiError(403, 'Access denied');
    }

    const { rows } = await query(
      `SELECT d.*, g.full_name AS guarantor_name
       FROM guarantor_documents d
       LEFT JOIN guarantors g ON g.id = d.guarantor_id
       WHERE d.surety_id = $1
       ORDER BY d.created_at DESC`,
      [suretyId]
    );

    res.json({
      success: true,
      data: rows,
    });
  })
);

/**
 * DELETE /api/v1/media/documents/:id
 * Removes a document record and destroys the asset on Cloudinary.
 */
router.delete(
  '/documents/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const docRes = await query(
      `SELECT d.*, s.status AS surety_status, sub.user_id
       FROM guarantor_documents d
       JOIN sureties s ON s.id = d.surety_id
       JOIN subscriptions sub ON sub.id = s.subscription_id
       WHERE d.id = $1`,
      [id]
    );

    if (!docRes.rows.length) {
      throw new ApiError(404, 'Document not found');
    }

    const doc = docRes.rows[0];
    if (req.user.role !== 'admin' && doc.user_id !== req.user.userId) {
      throw new ApiError(403, 'Not authorized to delete this document');
    }

    if (doc.surety_status === 'APPROVED' && req.user.role !== 'admin') {
      throw new ApiError(400, 'Cannot delete document after surety package has been approved');
    }

    await query('DELETE FROM guarantor_documents WHERE id = $1', [id]);

    // Clean up asset in Cloudinary (best-effort)
    try {
      if (doc.cloudinary_public_id) {
        await deleteAsset(doc.cloudinary_public_id);
      }
    } catch (err) {
      console.warn(`[Cloudinary] Failed to delete asset ${doc.cloudinary_public_id}:`, err.message);
    }

    await logAuditEvent(null, {
      eventType: 'DOCUMENT_DELETED',
      actorId: req.user.userId,
      entityType: 'guarantor_documents',
      entityId: id,
      beforeState: doc,
      metadata: { publicId: doc.cloudinary_public_id },
    });

    res.json({
      success: true,
      data: { id, message: 'Document deleted successfully' },
    });
  })
);

/**
 * PATCH /api/v1/media/documents/:id/review
 * Foreman Admin reviews and verifies/rejects a submitted document.
 */
router.patch(
  '/documents/:id/review',
  requireAuth,
  requireRole('admin'),
  validateBody(reviewDocumentSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { verificationStatus, rejectionReason } = req.body;

    const docRes = await query('SELECT * FROM guarantor_documents WHERE id = $1', [id]);
    if (!docRes.rows.length) {
      throw new ApiError(404, 'Document not found');
    }

    const { rows } = await query(
      `UPDATE guarantor_documents
       SET verification_status = $1, rejection_reason = $2, updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [verificationStatus, rejectionReason || null, id]
    );

    await logAuditEvent(null, {
      eventType: 'DOCUMENT_REVIEWED',
      actorId: req.user.userId,
      entityType: 'guarantor_documents',
      entityId: id,
      afterState: rows[0],
      metadata: { verificationStatus, rejectionReason },
    });

    res.json({
      success: true,
      data: rows[0],
    });
  })
);

/**
 * GET /api/v1/media/documents/pending
 * Foreman Admin endpoint to list all pending guarantor & surety documents awaiting statutory review.
 */
router.get(
  '/documents/pending',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT d.*, s.subscription_id, g.full_name AS guarantor_name,
              u.full_name AS subscriber_name, u.phone AS subscriber_phone,
              cg.name AS chit_group_name
       FROM guarantor_documents d
       JOIN sureties s ON s.id = d.surety_id
       JOIN subscriptions sub ON sub.id = s.subscription_id
       JOIN users u ON u.id = sub.user_id
       JOIN chit_groups cg ON cg.id = sub.chit_group_id
       LEFT JOIN guarantors g ON g.id = d.guarantor_id
       WHERE d.verification_status = 'PENDING'
       ORDER BY d.created_at ASC`
    );

    res.json({
      success: true,
      data: rows,
    });
  })
);

export default router;
