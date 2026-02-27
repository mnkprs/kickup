-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Migration 010
--  team_invite notif type, invite RPC, Google avatar, apply notifications
-- ═══════════════════════════════════════════════════════════════════

-- ─── Add team_invite to notif_type enum ───────────────────────────
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'team_invite';

-- ─── Update handle_new_user to capture Google avatar_url ──────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_color, position, area, avatar_initials, nationality, date_of_birth, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_color', '#2E7D32'),
    (NEW.raw_user_meta_data->>'position')::player_position,
    NEW.raw_user_meta_data->>'area',
    UPPER(SUBSTRING(COALESCE(NEW.raw_user_meta_data->>'full_name', '?') FROM 1 FOR 1)) ||
    UPPER(SUBSTRING(
      REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), '^[^ ]+ ', '') FROM 1 FOR 1
    )),
    NEW.raw_user_meta_data->>'nationality',
    CASE
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::date
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- ─── RPC: invite_player_to_team ────────────────────────────────────
-- Sends a team_invite notification to a freelancer. Caller must be captain.
CREATE OR REPLACE FUNCTION invite_player_to_team(p_player_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_team_id   uuid;
  v_team_name text;
BEGIN
  SELECT tm.team_id INTO v_team_id
  FROM team_members tm
  WHERE tm.player_id = auth.uid()
    AND tm.role = 'captain'
    AND tm.status = 'active'
  LIMIT 1;

  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'You must be a team captain to invite players';
  END IF;

  SELECT name INTO v_team_name FROM teams WHERE id = v_team_id;

  INSERT INTO notifications (user_id, type, title, body, team_id)
  VALUES (
    p_player_id,
    'team_invite',
    v_team_name || ' wants you to join! 👋',
    'You have been invited to join ' || v_team_name || '. Head to the team page to apply.',
    v_team_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION invite_player_to_team TO authenticated;

-- ─── RPC: apply_to_team (updated) ─────────────────────────────────
-- Notifies team captains when a player applies for a spot.
CREATE OR REPLACE FUNCTION apply_to_team(p_team_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_player_name text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND player_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Already a member or application pending';
  END IF;

  INSERT INTO team_members (team_id, player_id, role, status)
  VALUES (p_team_id, auth.uid(), 'player', 'pending');

  SELECT full_name INTO v_player_name FROM profiles WHERE id = auth.uid();

  -- Notify all active captains of the team
  INSERT INTO notifications (user_id, type, title, body, team_id)
  SELECT
    tm.player_id,
    'spot_applied',
    v_player_name || ' wants to join your team!',
    v_player_name || ' applied for a spot. Review their application in the team page.',
    p_team_id
  FROM team_members tm
  WHERE tm.team_id = p_team_id
    AND tm.role = 'captain'
    AND tm.status = 'active';
END;
$$;
