-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Team "Looking for Players" + Notify Freelancers
--  Migration 018: Captain can set status, freelancers in area get notified
-- ═══════════════════════════════════════════════════════════════════

-- ─── Add team flag ─────────────────────────────────────────────────
ALTER TABLE teams ADD COLUMN IF NOT EXISTS searching_for_players boolean NOT NULL DEFAULT false;

-- ─── Add notif type ────────────────────────────────────────────────
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'team_seeking_players';

-- ─── RPC: set_team_searching_for_players ───────────────────────────
-- Captain toggles flag. When setting true, notifies all freelancers in team's area.
CREATE OR REPLACE FUNCTION set_team_searching_for_players(p_team_id uuid, p_value boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_team_name text;
  v_team_area text;
  v_today date;
BEGIN
  IF NOT is_team_captain(p_team_id) THEN
    RAISE EXCEPTION 'Only team captain can set this';
  END IF;

  SELECT name, area INTO v_team_name, v_team_area FROM teams WHERE id = p_team_id;
  IF v_team_name IS NULL THEN
    RAISE EXCEPTION 'Team not found';
  END IF;

  UPDATE teams SET searching_for_players = p_value WHERE id = p_team_id;

  -- When turning ON: notify freelancers in the same area
  IF p_value AND v_team_area IS NOT NULL THEN
    v_today := CURRENT_DATE;
    INSERT INTO notifications (user_id, type, title, body, team_id)
    SELECT
      p.id,
      'team_seeking_players',
      v_team_name || ' is looking for players!',
      v_team_name || ' needs players in ' || v_team_area || '. Tap to view and apply.',
      p_team_id
    FROM profiles p
    WHERE p.is_freelancer = true
      AND p.area IS NOT NULL
      AND lower(trim(p.area)) = lower(trim(v_team_area))
      AND (p.freelancer_until IS NULL OR p.freelancer_until >= v_today)
      AND p.id NOT IN (SELECT player_id FROM team_members WHERE team_id = p_team_id);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION set_team_searching_for_players TO authenticated;
