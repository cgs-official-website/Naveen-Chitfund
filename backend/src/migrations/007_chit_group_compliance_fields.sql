-- Migration 007: Add pso_number, fdr_number, and update status check on chit_groups
ALTER TABLE chit_groups ADD COLUMN IF NOT EXISTS pso_number TEXT;
ALTER TABLE chit_groups ADD COLUMN IF NOT EXISTS fdr_number TEXT;

-- Update chit_groups status check constraint to include 'OPEN' if not already permitted
DO $$
BEGIN
  ALTER TABLE chit_groups DROP CONSTRAINT IF EXISTS chit_groups_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE chit_groups ADD CONSTRAINT chit_groups_status_check
  CHECK (status IN ('DRAFT', 'OPEN', 'RUNNING', 'ACTIVE', 'CLOSED', 'COMPLETED'));
