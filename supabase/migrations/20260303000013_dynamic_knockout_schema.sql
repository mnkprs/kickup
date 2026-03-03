-- Dynamic knockout flow: extend stages, add round_order, add knockout_mode
-- Supports: 2 groups (SF→Final), 4 groups (QF→SF→Final), 8 groups (R16→QF→SF→Final)
-- Plus custom mode for organiser to create matches manually.

-- ─── tournament_matches: extend stage + add round_order ────────────
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_stage_check;
ALTER TABLE tournament_matches ADD CONSTRAINT tournament_matches_stage_check
  CHECK (stage IN ('group','round_of_16','quarter_final','semi_final','final'));

ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS round_order int NOT NULL DEFAULT 0;

-- Backfill round_order for existing knockout matches
UPDATE tournament_matches SET round_order = 1 WHERE stage = 'semi_final' AND round_order = 0;
UPDATE tournament_matches SET round_order = 2 WHERE stage = 'final' AND round_order = 0;

-- ─── tournaments: knockout_mode ────────────────────────────────────
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS knockout_mode text
  NOT NULL DEFAULT 'auto' CHECK (knockout_mode IN ('auto','custom'));
