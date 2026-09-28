-- Migration 004: Superadmin Panel Tables and Audit Event Enhancements

-- 1. Enable CITEXT extension if missing
CREATE EXTENSION IF NOT EXISTS citext;

-- 2. Table: super_admins (isolated administrative accounts)
CREATE TABLE IF NOT EXISTS super_admins (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                CITEXT UNIQUE NOT NULL,
  password_hash        TEXT NOT NULL,
  full_name            TEXT NOT NULL,
  role                 TEXT NOT NULL DEFAULT 'SUPERADMIN',
  is_active            BOOLEAN NOT NULL DEFAULT true,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  failed_attempts      INT NOT NULL DEFAULT 0,
  locked_until         TIMESTAMPTZ NULL,
  last_login_at        TIMESTAMPTZ NULL,
  last_login_ip        INET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);
CREATE INDEX IF NOT EXISTS idx_super_admins_is_active ON super_admins(is_active);

-- 3. Table: super_admin_sessions (refresh tokens and active sessions)
CREATE TABLE IF NOT EXISTS super_admin_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id     UUID NOT NULL REFERENCES super_admins(id) ON DELETE CASCADE,
  refresh_token_hash TEXT,
  user_agent         TEXT,
  ip                 INET,
  expires_at         TIMESTAMPTZ NOT NULL,
  revoked_at         TIMESTAMPTZ NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sa_sessions_admin ON super_admin_sessions(super_admin_id);
CREATE INDEX IF NOT EXISTS idx_sa_sessions_expires ON super_admin_sessions(expires_at);

-- 4. Audit Events Enhancement: Add actor_type column (USER | SUPERADMIN | SYSTEM)
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS actor_type TEXT DEFAULT 'USER';

-- Drop foreign key constraint on actor_id if present to allow SUPERADMIN or SYSTEM IDs
ALTER TABLE audit_events DROP CONSTRAINT IF EXISTS audit_events_actor_id_fkey;

CREATE INDEX IF NOT EXISTS idx_audit_actor_type ON audit_events(actor_type);
