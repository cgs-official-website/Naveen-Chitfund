-- Migration 005: Auction Participation Tickets
-- Implements unguessable, scoped tickets for live chit reverse auctions

CREATE TABLE IF NOT EXISTS auction_tickets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id        UUID NOT NULL REFERENCES chit_auctions(id) ON DELETE CASCADE,
  subscription_id   UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_code       TEXT NOT NULL UNIQUE,
  status            TEXT NOT NULL CHECK (status IN ('ISSUED', 'ACTIVE', 'USED', 'EXPIRED', 'REVOKED')) DEFAULT 'ACTIVE',
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at           TIMESTAMPTZ,
  expired_at        TIMESTAMPTZ,
  revoked_at        TIMESTAMPTZ,
  revocation_reason TEXT,
  ip_address        TEXT,
  UNIQUE (auction_id, subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_auction_tickets_auction_status ON auction_tickets(auction_id, status);
CREATE INDEX IF NOT EXISTS idx_auction_tickets_user ON auction_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_auction_tickets_code ON auction_tickets(ticket_code);
