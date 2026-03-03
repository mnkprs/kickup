-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Accept team member: auto-leave previous team
--  When a player joins a team (captain accepts their application),
--  they automatically leave any team they were already in.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION accept_team_member(p_team_id uuid, p_player_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_team_captain(p_team_id) THEN
    RAISE EXCEPTION 'Only team captain can accept members';
  END IF;

  -- Remove player from any other team (active or pending) before joining this one
  DELETE FROM team_members
  WHERE player_id = p_player_id
    AND team_id != p_team_id;

  UPDATE team_members SET status = 'active'
  WHERE team_id = p_team_id AND player_id = p_player_id AND status = 'pending';
END;
$$;
