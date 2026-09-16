-- Migration 003: Centralized Guarantor & Surety Documents Storage (Cloudinary)

CREATE TABLE IF NOT EXISTS guarantor_documents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surety_id             UUID NOT NULL REFERENCES sureties(id) ON DELETE CASCADE,
  guarantor_id          UUID REFERENCES guarantors(id) ON DELETE CASCADE,
  document_type         TEXT NOT NULL CHECK (document_type IN (
    'SALARY_SLIP',
    'FDR_CERTIFICATE',
    'PROPERTY_DEED',
    'PAN_CARD',
    'IDENTITY_PROOF',
    'OTHER'
  )),
  title                 TEXT,
  file_url              TEXT NOT NULL,
  cloudinary_public_id  TEXT NOT NULL,
  cloudinary_format     TEXT,
  file_size_bytes       BIGINT,
  mime_type             TEXT,
  uploaded_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  verification_status   TEXT NOT NULL CHECK (verification_status IN (
    'PENDING',
    'VERIFIED',
    'REJECTED'
  )) DEFAULT 'PENDING',
  rejection_reason      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gdocs_surety ON guarantor_documents(surety_id);
CREATE INDEX IF NOT EXISTS idx_gdocs_guarantor ON guarantor_documents(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_gdocs_status ON guarantor_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_gdocs_created_at ON guarantor_documents(created_at DESC);
