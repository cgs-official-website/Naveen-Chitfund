-- Migration 002: Add Sureties, Guarantors, Disbursals, DPDP Consents, Audit Events, and Integer-Paise columns

-- 1. Integer Paise columns on existing financial tables
ALTER TABLE chit_groups
  ADD COLUMN IF NOT EXISTS chit_amount_paise BIGINT;

ALTER TABLE installments
  ADD COLUMN IF NOT EXISTS amount_due_paise BIGINT;

ALTER TABLE ledger_entries
  ADD COLUMN IF NOT EXISTS amount_paise BIGINT;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS amount_paise BIGINT;

-- Backfill paise columns from existing numeric data if any exists
UPDATE chit_groups SET chit_amount_paise = ROUND(chit_amount * 100) WHERE chit_amount_paise IS NULL;
UPDATE installments SET amount_due_paise = ROUND(amount_due * 100) WHERE amount_due_paise IS NULL;
UPDATE ledger_entries SET amount_paise = ROUND(amount * 100) WHERE amount_paise IS NULL;
UPDATE payments SET amount_paise = ROUND(amount * 100) WHERE amount_paise IS NULL;

-- 2. Audit Events Table (Tamper-evident system activity log)
CREATE TABLE IF NOT EXISTS audit_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   TEXT NOT NULL,
  actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT,
  before_state JSONB,
  after_state  JSONB,
  metadata     JSONB DEFAULT '{}'::jsonb,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_events(created_at DESC);

-- 3. DPDP 2023 Consent Ledger
CREATE TABLE IF NOT EXISTS dpdp_consents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'identity_verification',
    'credit_bureau_check',
    'auction_participation_records',
    'regulatory_reporting_pmla',
    'marketing_communications'
  )),
  granted      BOOLEAN NOT NULL DEFAULT true,
  granted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address   TEXT,
  user_agent   TEXT,
  revoked_at   TIMESTAMPTZ,
  UNIQUE (user_id, consent_type)
);
CREATE INDEX IF NOT EXISTS idx_dpdp_user ON dpdp_consents(user_id);

-- 4. Statutory Sureties Table (Chit Funds Act § 31)
CREATE TABLE IF NOT EXISTS sureties (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id     UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  auction_id          UUID REFERENCES chit_auctions(id) ON DELETE SET NULL,
  surety_type         TEXT NOT NULL CHECK (surety_type IN (
    'CO_GUARANTORS',
    'FIXED_DEPOSIT',
    'PROPERTY',
    'GOVERNMENT_SECURITY'
  )) DEFAULT 'CO_GUARANTORS',
  status              TEXT NOT NULL CHECK (status IN (
    'PENDING',
    'SUBMITTED',
    'APPROVED',
    'REJECTED'
  )) DEFAULT 'PENDING',
  collateral_details  JSONB DEFAULT '{}'::jsonb,
  rejection_reason    TEXT,
  reviewed_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sureties_sub ON sureties(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sureties_auction ON sureties(auction_id);
CREATE INDEX IF NOT EXISTS idx_sureties_status ON sureties(status);

-- 5. Co-Guarantors Table
CREATE TABLE IF NOT EXISTS guarantors (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surety_id           UUID NOT NULL REFERENCES sureties(id) ON DELETE CASCADE,
  full_name           TEXT NOT NULL,
  phone               TEXT NOT NULL,
  pan_number          TEXT,
  relationship        TEXT,
  monthly_income_paise BIGINT,
  cibil_score         INTEGER,
  signature_verified  BOOLEAN NOT NULL DEFAULT false,
  verification_status TEXT NOT NULL CHECK (verification_status IN (
    'PENDING',
    'VERIFIED',
    'REJECTED'
  )) DEFAULT 'PENDING',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_guarantors_surety ON guarantors(surety_id);

-- 6. Prize Disbursals Table
CREATE TABLE IF NOT EXISTS disbursals (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id         UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  auction_id              UUID NOT NULL REFERENCES chit_auctions(id) ON DELETE CASCADE,
  surety_id               UUID REFERENCES sureties(id) ON DELETE SET NULL,
  gross_amount_paise      BIGINT NOT NULL,
  discount_amount_paise   BIGINT NOT NULL,
  foreman_commission_paise BIGINT NOT NULL,
  net_payout_paise        BIGINT NOT NULL,
  payment_mode            TEXT NOT NULL CHECK (payment_mode IN ('RTGS', 'NEFT', 'IMPS', 'CHEQUE')) DEFAULT 'RTGS',
  bank_account_number     TEXT NOT NULL,
  bank_ifsc               TEXT NOT NULL,
  bank_beneficiary_name   TEXT NOT NULL,
  bank_reference_utr      TEXT,
  status                  TEXT NOT NULL CHECK (status IN (
    'PENDING',
    'PROCESSING',
    'DISBURSED',
    'FAILED'
  )) DEFAULT 'PENDING',
  disbursed_at            TIMESTAMPTZ,
  failure_reason          TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (auction_id)
);
CREATE INDEX IF NOT EXISTS idx_disbursals_sub ON disbursals(subscription_id);
CREATE INDEX IF NOT EXISTS idx_disbursals_status ON disbursals(status);
