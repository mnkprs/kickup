-- Allow admin to move teams between groups (in addition to organizer)
CREATE OR REPLACE FUNCTION move_team_to_group(
  p_tournament_id uuid,
  p_team_id uuid,
  p_target_group_label text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status text;
  v_bracket text;
  v_is_admin boolean;
BEGIN
  SELECT COALESCE(p.is_admin, false) INTO v_is_admin
  FROM profiles p
  WHERE p.id = auth.uid();

  IF NOT is_tournament_organizer(p_tournament_id) AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Only the tournament organizer or admin can move teams between groups';
  END IF;

  SELECT status, bracket_format INTO v_status, v_bracket FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;

  IF v_status NOT IN ('registration', 'group_stage') THEN
    RAISE EXCEPTION 'Teams can only be moved during registration or group stage';
  END IF;

  IF v_bracket NOT IN ('group_stage', 'round_robin') THEN
    RAISE EXCEPTION 'This tournament format does not use groups';
  END IF;

  -- Ensure team is approved
  IF NOT EXISTS (
    SELECT 1 FROM tournament_registrations
    WHERE tournament_id = p_tournament_id AND team_id = p_team_id AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Team is not approved for this tournament';
  END IF;

  -- If target is __NEW__, create next group label (A, B, C, ...)
  -- When no groups exist (flat list shown as Group A), create 'B'
  IF p_target_group_label = '__NEW__' THEN
    SELECT COALESCE(
      chr(ascii(MAX(group_label)) + 1),
      'B'
    ) INTO p_target_group_label
    FROM tournament_groups
    WHERE tournament_id = p_tournament_id;
    IF p_target_group_label IS NULL THEN
      p_target_group_label := 'B';
    END IF;
  END IF;

  INSERT INTO tournament_groups (tournament_id, team_id, group_label)
  VALUES (p_tournament_id, p_team_id, p_target_group_label)
  ON CONFLICT (tournament_id, team_id) DO UPDATE SET group_label = EXCLUDED.group_label;
END;
$$;
