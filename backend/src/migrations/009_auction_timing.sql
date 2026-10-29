-- Migration 009: Add timing columns to chit_auctions
ALTER TABLE chit_auctions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE chit_auctions ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 300;
