-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — UX Columns
--  Migration 013: Missing columns for UI display + owner applications
-- ═══════════════════════════════════════════════════════════════════

-- ─── PROFILES: aggregate stat columns ─────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stat_draws        int  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stat_losses       int  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stat_yellow_cards int  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stat_red_cards    int  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stat_clean_sheets int  NOT NULL DEFAULT 0;

-- ─── PROFILES: permission flags ───────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_field_owner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_admin        boolean NOT NULL DEFAULT false;

-- ─── TEAMS: captain + home ground ─────────────────────────────────
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS captain_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS home_ground text;

-- Computed points column (W=3, D=1)
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS points int GENERATED ALWAYS AS (record_w * 3 + record_d) STORED;

-- ─── TOURNAMENTS: bracket format + entry fee ──────────────────────
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS bracket_format text DEFAULT 'knockout'
    CHECK (bracket_format IN ('knockout', 'round_robin', 'group_stage')),
  ADD COLUMN IF NOT EXISTS entry_fee text NOT NULL DEFAULT '';

-- ─── OWNER APPLICATIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owner_applications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message    text        NOT NULL DEFAULT '',
  status     text        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)  -- one active application per user
);

CREATE INDEX IF NOT EXISTS owner_applications_user_idx   ON owner_applications (user_id);
CREATE INDEX IF NOT EXISTS owner_applications_status_idx ON owner_applications (status);

-- RLS
ALTER TABLE owner_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_applications_select_own"
  ON owner_applications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "owner_applications_insert_own"
  ON owner_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "owner_applications_update_admin"
  ON owner_applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
