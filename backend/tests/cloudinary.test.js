import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.CLOUDINARY_CLOUD_NAME = 'chittech-test-cloud';
process.env.CLOUDINARY_API_KEY = 'test_api_key_123';
process.env.CLOUDINARY_API_SECRET = 'test_api_secret_ultra_secure_456';

// 1. Mock Cloudinary SDK (Hard Rule 5: No real Cloudinary calls in tests)
const mockDestroy = jest.fn(async (publicId, options) => ({ result: 'ok' }));
const mockApiSignRequest = jest.fn((paramsToSign, apiSecret) => `mock_signature_${paramsToSign.timestamp}_${paramsToSign.folder}`);
const mockUploadStream = jest.fn((options, callback) => ({
  end: (buffer) => {
    callback(null, {
      public_id: 'mock_uploaded_asset_123',
      secure_url: 'https://res.cloudinary.com/chittech/image/upload/v1/doc.pdf',
      format: 'pdf',
      bytes: 1024,
    });
  },
}));

jest.unstable_mockModule('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    utils: {
      api_sign_request: mockApiSignRequest,
    },
    uploader: {
      destroy: mockDestroy,
      upload_stream: mockUploadStream,
    },
  },
}));

// 2. Mock Database module for isolated media/document testing
const testUserId = '00000000-0000-0000-0000-000000000001';
const otherUserId = '00000000-0000-0000-0000-000000000099';
const testAdminId = '00000000-0000-0000-0000-000000000002';
const testSuretyId = '66666666-6666-6666-6666-666666666666';
const testGuarantorId = '77777777-7777-7777-7777-777777777777';
const testDocId = '88888888-8888-8888-8888-888888888888';

jest.unstable_mockModule('../src/db.js', () => ({
  query: jest.fn(async (text, params) => {
    // Surety lookup
    if (text.includes('FROM sureties s')) {
      const suretyId = params ? params[0] : null;
      if (suretyId === testSuretyId) {
        return {
          rows: [
            {
              id: testSuretyId,
              subscription_id: '22222222-2222-2222-2222-222222222222',
              user_id: testUserId,
              status: 'PENDING',
            },
          ],
        };
      }
      return { rows: [] };
    }

    // Guarantor lookup
    if (text.includes('FROM guarantors WHERE id = $1 AND surety_id = $2')) {
      if (params[0] === testGuarantorId && params[1] === testSuretyId) {
        return { rows: [{ id: testGuarantorId, surety_id: testSuretyId }] };
      }
      return { rows: [] };
    }

    // Insert guarantor document
    if (text.includes('INSERT INTO guarantor_documents')) {
      return {
        rows: [
          {
            id: testDocId,
            surety_id: params[0],
            guarantor_id: params[1],
            document_type: params[2],
            title: params[3],
            file_url: params[4],
            cloudinary_public_id: params[5],
            cloudinary_format: params[6],
            file_size_bytes: params[7],
            mime_type: params[8],
            uploaded_by: params[9],
            verification_status: 'PENDING',
            created_at: new Date().toISOString(),
          },
        ],
      };
    }

    // Select documents by surety
    if (text.includes('FROM guarantor_documents d') && text.includes('WHERE d.surety_id = $1')) {
      return {
        rows: [
          {
            id: testDocId,
            surety_id: testSuretyId,
            guarantor_id: testGuarantorId,
            document_type: 'SALARY_SLIP',
            title: 'Guarantor Salary Slip Oct 2026',
            file_url: 'https://res.cloudinary.com/chittech/image/upload/v1/salary.pdf',
            cloudinary_public_id: 'chittech/documents/salary_123',
            verification_status: 'PENDING',
            guarantor_name: 'P. Raghavendra',
          },
        ],
      };
    }

    // Pending documents list for admin
    if (text.includes("WHERE d.verification_status = 'PENDING'") && text.includes('subscriber_name')) {
      return {
        rows: [
          {
            id: testDocId,
            surety_id: testSuretyId,
            document_type: 'SALARY_SLIP',
            title: 'Guarantor Salary Slip',
            file_url: 'https://res.cloudinary.com/chittech/image/upload/salary.pdf',
            subscriber_name: 'Test Subscriber',
            subscriber_phone: '+919876543210',
            chit_group_name: 'Gold Chit 1 Lakh',
            guarantor_name: 'P. Raghavendra',
            verification_status: 'PENDING',
            created_at: new Date().toISOString(),
          },
        ],
      };
    }

    // Document lookup for delete
    if (text.includes('FROM guarantor_documents d') && text.includes('JOIN sureties s')) {
      if (params && params[0] === testDocId) {
        return {
          rows: [
            {
              id: testDocId,
              surety_id: testSuretyId,
              user_id: testUserId,
              surety_status: 'PENDING',
              cloudinary_public_id: 'chittech/documents/salary_123',
            },
          ],
        };
      }
      if (params && params[0] === 'doc-approved-surety') {
        return {
          rows: [
            {
              id: 'doc-approved-surety',
              surety_id: testSuretyId,
              user_id: testUserId,
              surety_status: 'APPROVED',
              cloudinary_public_id: 'chittech/documents/approved_doc',
            },
          ],
        };
      }
      return { rows: [] };
    }

    // Single document lookup for review
    if (text.includes('FROM guarantor_documents WHERE id = $1')) {
      if (params && params[0] === testDocId) {
        return {
          rows: [
            {
              id: testDocId,
              verification_status: 'PENDING',
            },
          ],
        };
      }
      return { rows: [] };
    }

    // Update document review
    if (text.includes('UPDATE guarantor_documents')) {
      return {
        rows: [
          {
            id: testDocId,
            verification_status: params[0],
            rejection_reason: params[1],
            updated_at: new Date().toISOString(),
          },
        ],
      };
    }

    // Delete query
    if (text.includes('DELETE FROM guarantor_documents')) {
      return { rowCount: 1 };
    }

    return { rows: [] };
  }),
  withTransaction: jest.fn(async (cb) => cb({ query: jest.fn() })),
  logAuditEvent: jest.fn().mockResolvedValue({ rows: [] }),
  pool: { connect: jest.fn(), end: jest.fn() },
}));

// Dynamic import of app and cloudinary service
const { app } = await import('../src/index.js');
const { generateSignature, isCloudinaryConfigured, deleteAsset } = await import('../src/services/cloudinary.js');

describe('Phase 1: Cloudinary Storage & Media Document Engine', () => {
  const jwtSecret = process.env.JWT_SECRET || 'chittech_default_jwt_secret_2026';
  const testUserToken = jwt.sign(
    { userId: testUserId, role: 'user', phone: '+919876543210' },
    jwtSecret,
    { expiresIn: '1h' }
  );
  const otherUserToken = jwt.sign(
    { userId: otherUserId, role: 'user', phone: '+919876543299' },
    jwtSecret,
    { expiresIn: '1h' }
  );
  const testAdminToken = jwt.sign(
    { userId: testAdminId, role: 'admin', phone: '+919999999999' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  describe('1. Cloudinary Service Unit Functions', () => {
    test('isCloudinaryConfigured returns true when credentials exist', () => {
      expect(isCloudinaryConfigured()).toBe(true);
    });

    test('generateSignature calls api_sign_request with secret and returns string', () => {
      const sig = generateSignature({ timestamp: 1700000000, folder: 'chittech/docs' });
      expect(sig).toContain('mock_signature_1700000000_chittech/docs');
      expect(mockApiSignRequest).toHaveBeenCalled();
    });

    test('deleteAsset invokes cloudinary.uploader.destroy', async () => {
      const res = await deleteAsset('test_asset_id');
      expect(res).toEqual({ result: 'ok' });
      expect(mockDestroy).toHaveBeenCalledWith('test_asset_id', expect.any(Object));
    });
  });

  describe('2. POST /api/v1/media/sign-upload (Signed Upload Authorization)', () => {
    test('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/v1/media/sign-upload');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('generates signature and public metadata without exposing secret', async () => {
      const res = await request(app)
        .post('/api/v1/media/sign-upload')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ documentType: 'SALARY_SLIP' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.signature).toBeDefined();
      expect(res.body.data.timestamp).toBeDefined();
      expect(res.body.data.apiKey).toBe('test_api_key_123');
      expect(res.body.data.cloudName).toBe('chittech-test-cloud');
      expect(res.body.data.folder).toContain(`chittech/documents/${testUserId}`);

      // Hard Rule 4: Secret must NEVER be present anywhere in the response
      expect(JSON.stringify(res.body)).not.toContain('test_api_secret_ultra_secure_456');
    });
  });

  describe('3. POST /api/v1/media/documents (Document Registration)', () => {
    test('rejects payload with missing required fields with 400', async () => {
      const res = await request(app)
        .post('/api/v1/media/documents')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          suretyId: testSuretyId,
          // missing fileUrl and cloudinaryPublicId
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('rejects unauthorized user trying to upload for another subscriber surety with 403', async () => {
      const res = await request(app)
        .post('/api/v1/media/documents')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          suretyId: testSuretyId,
          documentType: 'SALARY_SLIP',
          fileUrl: 'https://res.cloudinary.com/chittech/image/upload/salary.pdf',
          cloudinaryPublicId: 'chittech/docs/salary_123',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('persists valid guarantor document record and returns 201', async () => {
      const res = await request(app)
        .post('/api/v1/media/documents')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          suretyId: testSuretyId,
          guarantorId: testGuarantorId,
          documentType: 'SALARY_SLIP',
          title: 'Guarantor Salary Slip',
          fileUrl: 'https://res.cloudinary.com/chittech/image/upload/salary.pdf',
          cloudinaryPublicId: 'chittech/docs/salary_123',
          cloudinaryFormat: 'pdf',
          fileSizeBytes: 204800,
          mimeType: 'application/pdf',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testDocId);
      expect(res.body.data.document_type).toBe('SALARY_SLIP');
      expect(res.body.data.verification_status).toBe('PENDING');
    });
  });

  describe('4. GET /api/v1/media/documents/surety/:suretyId', () => {
    test('returns documents attached to the surety package', async () => {
      const res = await request(app)
        .get(`/api/v1/media/documents/surety/${testSuretyId}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].cloudinary_public_id).toBe('chittech/documents/salary_123');
    });

    test('prevents other users from viewing surety documents with 403', async () => {
      const res = await request(app)
        .get(`/api/v1/media/documents/surety/${testSuretyId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('5. GET /api/v1/media/documents/pending (Admin Pending Documents Queue)', () => {
    test('rejects non-admin from accessing pending documents queue with 403', async () => {
      const res = await request(app)
        .get('/api/v1/media/documents/pending')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toBe(403);
    });

    test('admin can view list of pending guarantor documents', async () => {
      const res = await request(app)
        .get('/api/v1/media/documents/pending')
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].subscriber_name).toBe('Test Subscriber');
      expect(res.body.data[0].document_type).toBe('SALARY_SLIP');
    });
  });

  describe('6. PATCH /api/v1/media/documents/:id/review (Foreman Admin Review)', () => {
    test('rejects non-admin from reviewing document with 403', async () => {
      const res = await request(app)
        .patch(`/api/v1/media/documents/${testDocId}/review`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ verificationStatus: 'VERIFIED' });

      expect(res.statusCode).toBe(403);
    });

    test('admin can verify document with 200', async () => {
      const res = await request(app)
        .patch(`/api/v1/media/documents/${testDocId}/review`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({ verificationStatus: 'VERIFIED' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verification_status).toBe('VERIFIED');
    });
  });

  describe('6. DELETE /api/v1/media/documents/:id', () => {
    test('owner can delete document and trigger Cloudinary cleanup', async () => {
      const res = await request(app)
        .delete(`/api/v1/media/documents/${testDocId}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDestroy).toHaveBeenCalledWith('chittech/documents/salary_123', expect.any(Object));
    });

    test('prevents non-owner from deleting document with 403', async () => {
      const res = await request(app)
        .delete(`/api/v1/media/documents/${testDocId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('prevents document deletion if surety package is already APPROVED with 400', async () => {
      const res = await request(app)
        .delete('/api/v1/media/documents/doc-approved-surety')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Cannot delete document after surety package has been approved');
    });
  });

  afterAll(async () => {
    const { server, io } = await import('../src/index.js');
    if (io && typeof io.close === 'function') io.close();
    if (server && typeof server.close === 'function') server.close();
  });
});
