-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Migration 028
--  Allow players to leave a team on their own
-- ═══════════════════════════════════════════════════════════════════

-- ─── RPC: leave_team ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION leave_team(p_team_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role text;
  v_is_captain boolean;
  v_other_member_id uuid;
  v_active_count int;
BEGIN
  -- Verify caller is an active member
  SELECT role INTO v_role
  FROM team_members
  WHERE team_id = p_team_id AND player_id = auth.uid() AND status = 'active';

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'You are not a member of this team';
  END IF;

  v_is_captain := (v_role = 'captain');

  IF v_is_captain THEN
    SELECT COUNT(*) INTO v_active_count
    FROM team_members
    WHERE team_id = p_team_id AND status = 'active';

    IF v_active_count > 1 THEN
      -- Promote next active member (oldest by joined_at) to captain
      SELECT player_id INTO v_other_member_id
      FROM team_members
      WHERE team_id = p_team_id AND status = 'active' AND player_id <> auth.uid()
      ORDER BY joined_at ASC
      LIMIT 1;

      UPDATE team_members SET role = 'player'
      WHERE team_id = p_team_id AND player_id = auth.uid();
      UPDATE team_members SET role = 'captain'
      WHERE team_id = p_team_id AND player_id = v_other_member_id;
      UPDATE teams SET captain_id = v_other_member_id WHERE id = p_team_id;
    END IF;
  END IF;

  DELETE FROM team_members
  WHERE team_id = p_team_id AND player_id = auth.uid();

  -- If captain was last member, delete the team
  IF v_is_captain AND v_active_count = 1 THEN
    DELETE FROM teams WHERE id = p_team_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION leave_team TO authenticated;
