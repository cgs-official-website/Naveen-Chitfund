-- ChitTech core schema (MVP)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  phone             TEXT NOT NULL UNIQUE,
  email             TEXT,
  role              TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  kyc_status        TEXT NOT NULL CHECK (kyc_status IN ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'NOT_SUBMITTED',
  pan_number        TEXT,
  aadhaar_ref_token TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chit_groups (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT NOT NULL,
  chit_amount                 NUMERIC(14,2) NOT NULL,
  duration_months             INTEGER NOT NULL,
  foreman_commission_pct      NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  status                      TEXT NOT NULL CHECK (status IN ('DRAFT', 'OPEN', 'RUNNING', 'CLOSED')) DEFAULT 'DRAFT',
  registrar_state_code        TEXT,
  dividend_distribution_policy TEXT NOT NULL CHECK (dividend_distribution_policy IN ('ALL_SUBSCRIBERS', 'NON_PRIZED_ONLY')) DEFAULT 'NON_PRIZED_ONLY',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chit_group_id     UUID NOT NULL REFERENCES chit_groups(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_number     INTEGER NOT NULL,
  subscriber_status TEXT NOT NULL CHECK (subscriber_status IN ('NPS', 'SB', 'PS')) DEFAULT 'NPS',
  prized_month      INTEGER,
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chit_group_id, ticket_number),
  UNIQUE (chit_group_id, user_id)
);

CREATE TABLE IF NOT EXISTS installments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  month_number    INTEGER NOT NULL,
  amount_due      NUMERIC(14,2) NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('PENDING', 'PAID', 'OVERDUE')) DEFAULT 'PENDING',
  due_date        DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, month_number)
);

CREATE TABLE IF NOT EXISTS chit_auctions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chit_group_id          UUID NOT NULL REFERENCES chit_groups(id) ON DELETE CASCADE,
  month_number           INTEGER NOT NULL,
  status                 TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED')) DEFAULT 'SCHEDULED',
  winning_bid_pct        NUMERIC(5,2),
  winning_subscription_id UUID REFERENCES subscriptions(id),
  scheduled_at           TIMESTAMPTZ,
  closed_at              TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chit_group_id, month_number)
);

CREATE TABLE IF NOT EXISTS auction_bids (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id      UUID NOT NULL REFERENCES chit_auctions(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  bid_pct         NUMERIC(5,2) NOT NULL,
  bid_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address      TEXT
);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction ON auction_bids(auction_id);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chit_group_id   UUID NOT NULL REFERENCES chit_groups(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  entry_type      TEXT NOT NULL CHECK (entry_type IN ('INSTALLMENT', 'DIVIDEND', 'PRIZE_PAYOUT', 'COMMISSION')),
  amount          NUMERIC(14,2) NOT NULL,
  auction_id      UUID REFERENCES chit_auctions(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ledger_group ON ledger_entries(chit_group_id);
CREATE INDEX IF NOT EXISTS idx_ledger_subscription ON ledger_entries(subscription_id);

CREATE TABLE IF NOT EXISTS payments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id    UUID REFERENCES subscriptions(id),
  installment_id     UUID REFERENCES installments(id),
  amount             NUMERIC(14,2) NOT NULL,
  razorpay_order_id  TEXT,
  razorpay_payment_id TEXT,
  status             TEXT NOT NULL CHECK (status IN ('CREATED', 'SUCCESS', 'FAILED')) DEFAULT 'CREATED',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP store (mock SMS provider) — short-lived, cleaned up by expiry check in app logic
CREATE TABLE IF NOT EXISTS otp_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      TEXT NOT NULL,
  code       TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed   BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);

-- TODO(compliance): AML/PMLA reporting tables, DPDP consent ledger, GST computation fields,
-- multi-state registrar rule tables, escrow account separation ledger — intentionally
-- out of scope for MVP. Kept out of the schema so they're additive, not a migration.
