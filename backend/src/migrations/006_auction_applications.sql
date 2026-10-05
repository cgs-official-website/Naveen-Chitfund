-- Migration 006: Auction Participant Limits and Application Approval Workflow
-- Allows setting participant limits per auction and requires superadmin approval before ticket issue

ALTER TABLE chit_auctions ADD COLUMN IF NOT EXISTS max_participants INT NOT NULL DEFAULT 20;

-- Drop check constraint on auction_tickets.status if present to allow APPLIED and REJECTED states
DO $$
BEGIN
  ALTER TABLE auction_tickets DROP CONSTRAINT IF EXISTS auction_tickets_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE auction_tickets ADD CONSTRAINT auction_tickets_status_check 
  CHECK (status IN ('APPLIED', 'PENDING', 'ACTIVE', 'ISSUED', 'USED', 'EXPIRED', 'REVOKED', 'REJECTED'));
