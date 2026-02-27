-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Migration 006
--  Profile age/nationality, team_member status, team avatar, new RPCs
-- ═══════════════════════════════════════════════════════════════════

-- ─── SCHEMA CHANGES ───────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS date_of_birth date;

ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('pending', 'active'));

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- ─── UPDATE HELPER: is_team_captain (only active captains) ────────
CREATE OR REPLACE FUNCTION is_team_captain(p_team_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND player_id = auth.uid()
      AND role = 'captain'
      AND status = 'active'
  );
$$;

-- ─── UPDATE handle_new_user TRIGGER ───────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_color, position, area, avatar_initials, nationality, date_of_birth)
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
    END
  );
  RETURN NEW;
END;
$$;

-- ─── UPDATE sync_team_open_spots (count only active members) ──────
DROP TRIGGER IF EXISTS sync_team_spots_insert ON team_members;
DROP TRIGGER IF EXISTS sync_team_spots_delete ON team_members;

CREATE OR REPLACE FUNCTION sync_team_open_spots()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_count int;
  spots_for_format int;
  team_fmt match_format;
  v_team_id uuid;
BEGIN
  v_team_id := COALESCE(NEW.team_id, OLD.team_id);
  SELECT format INTO team_fmt FROM teams WHERE id = v_team_id;
  SELECT COUNT(*) INTO member_count FROM team_members WHERE team_id = v_team_id AND status = 'active';
  spots_for_format := CASE team_fmt
    WHEN '5v5'   THEN 5
    WHEN '6v6'   THEN 6
    WHEN '7v7'   THEN 7
    WHEN '8v8'   THEN 8
    WHEN '11v11' THEN 11
    ELSE 5
  END;
  UPDATE teams SET open_spots = GREATEST(0, spots_for_format - member_count)
  WHERE id = v_team_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_team_spots_insert AFTER INSERT ON team_members
  FOR EACH ROW EXECUTE PROCEDURE sync_team_open_spots();
CREATE TRIGGER sync_team_spots_delete AFTER DELETE ON team_members
  FOR EACH ROW EXECUTE PROCEDURE sync_team_open_spots();
CREATE TRIGGER sync_team_spots_update AFTER UPDATE OF status ON team_members
  FOR EACH ROW EXECUTE PROCEDURE sync_team_open_spots();

-- ─── RPC: create_team_with_captain ────────────────────────────────
CREATE OR REPLACE FUNCTION create_team_with_captain(
  p_name        text,
  p_short_name  text,
  p_format      match_format,
  p_area        text,
  p_emoji       text,
  p_color       text,
  p_description text DEFAULT ''
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_team_id uuid;
BEGIN
  INSERT INTO teams (name, short_name, format, area, emoji, color, description, created_by)
  VALUES (p_name, p_short_name, p_format, p_area, p_emoji, p_color, p_description, auth.uid())
  RETURNING id INTO v_team_id;

  INSERT INTO team_members (team_id, player_id, role, status)
  VALUES (v_team_id, auth.uid(), 'captain', 'active');

  RETURN v_team_id;
END;
$$;

-- ─── RPC: apply_to_team ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION apply_to_team(p_team_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM team_members WHERE team_id = p_team_id AND player_id = auth.uid()) THEN
    RAISE EXCEPTION 'Already a member or application pending';
  END IF;
  INSERT INTO team_members (team_id, player_id, role, status)
  VALUES (p_team_id, auth.uid(), 'player', 'pending');
END;
$$;

-- ─── RPC: accept_team_member ──────────────────────────────────────
CREATE OR REPLACE FUNCTION accept_team_member(p_team_id uuid, p_player_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_team_captain(p_team_id) THEN
    RAISE EXCEPTION 'Only team captain can accept members';
  END IF;
  UPDATE team_members SET status = 'active'
  WHERE team_id = p_team_id AND player_id = p_player_id AND status = 'pending';
END;
$$;

-- ─── RPC: remove_team_member ──────────────────────────────────────
CREATE OR REPLACE FUNCTION remove_team_member(p_team_id uuid, p_player_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_team_captain(p_team_id) THEN
    RAISE EXCEPTION 'Only team captain can remove members';
  END IF;
  IF p_player_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself from the team';
  END IF;
  DELETE FROM team_members WHERE team_id = p_team_id AND player_id = p_player_id;
END;
$$;

-- ─── RPC: assign_team_captain ─────────────────────────────────────
CREATE OR REPLACE FUNCTION assign_team_captain(p_team_id uuid, p_player_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_team_captain(p_team_id) THEN
    RAISE EXCEPTION 'Only current captain can assign a new captain';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND player_id = p_player_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Player must be an active team member';
  END IF;
  UPDATE team_members SET role = 'player'
  WHERE team_id = p_team_id AND player_id = auth.uid();
  UPDATE team_members SET role = 'captain'
  WHERE team_id = p_team_id AND player_id = p_player_id;
END;
$$;

-- ─── GRANT RPC execute to authenticated users ─────────────────────
GRANT EXECUTE ON FUNCTION create_team_with_captain TO authenticated;
GRANT EXECUTE ON FUNCTION apply_to_team TO authenticated;
GRANT EXECUTE ON FUNCTION accept_team_member TO authenticated;
GRANT EXECUTE ON FUNCTION remove_team_member TO authenticated;
GRANT EXECUTE ON FUNCTION assign_team_captain TO authenticated;
