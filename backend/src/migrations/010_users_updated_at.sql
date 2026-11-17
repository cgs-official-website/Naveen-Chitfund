-- Migration 010: add users.updated_at
-- The superadmin KYC queue (GET /api/v1/superadmin/kyc) sorts by u.updated_at and
-- the review endpoint writes it. The column was never created, so the query failed
-- and the queue showed "All Caught Up" even with pending KYC.
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();