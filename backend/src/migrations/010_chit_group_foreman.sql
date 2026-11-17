-- Migration 010: Assign a foreman (users.role = 'admin') to each chit group
ALTER TABLE chit_groups ADD COLUMN IF NOT EXISTS foreman_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_chit_groups_foreman_id ON chit_groups(foreman_id);
