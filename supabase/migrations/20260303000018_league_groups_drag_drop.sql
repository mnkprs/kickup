-- League groups: add team to last group on approval, support drag-and-drop reassignment
-- New teams joining are automatically placed in the last group.

-- Backfill: add approved teams not yet in tournament_groups to last group (group_stage/round_robin only)
INSERT INTO tournament_groups (tournament_id, team_id, group_label)
SELECT tr.tournament_id, tr.team_id, COALESCE(
  (SELECT MAX(tg.group_label) FROM tournament_groups tg WHERE tg.tournament_id = tr.tournament_id),
  'A'
)
FROM tournament_registrations tr
JOIN tournaments t ON t.id = tr.tournament_id
WHERE tr.status = 'approved'
  AND t.bracket_format IN ('group_stage', 'round_robin')
  AND t.status IN ('registration', 'group_stage')
  AND NOT EXISTS (
    SELECT 1 FROM tournament_groups tg
    WHERE tg.tournament_id = tr.tournament_id AND tg.team_id = tr.team_id
  )
ON CONFLICT (tournament_id, team_id) DO NOTHING;

-- Update approve_tournament_registration: insert team into tournament_groups (last group)
CREATE OR REPLACE FUNCTION approve_tournament_registration(p_registration_id uuid)
RETURNS tournament_registrations LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_reg        tournament_registrations%rowtype;
  v_tourn_name text;
  v_last_group text;
  v_bracket    text;
BEGIN
  SELECT * INTO v_reg FROM tournament_registrations WHERE id = p_registration_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Registration not found'; END IF;

  IF NOT is_tournament_organizer(v_reg.tournament_id) THEN
    RAISE EXCEPTION 'Only the tournament organizer can approve registrations';
  END IF;

  UPDATE tournament_registrations SET status = 'approved'
  WHERE id = p_registration_id RETURNING * INTO v_reg;

  SELECT name, bracket_format INTO v_tourn_name, v_bracket FROM tournaments WHERE id = v_reg.tournament_id;

  -- For group_stage and round_robin: add team to tournament_groups (last group)
  IF v_bracket IN ('group_stage', 'round_robin') THEN
    SELECT COALESCE(MAX(group_label), 'A') INTO v_last_group
    FROM tournament_groups
    WHERE tournament_id = v_reg.tournament_id;

    INSERT INTO tournament_groups (tournament_id, team_id, group_label)
    VALUES (v_reg.tournament_id, v_reg.team_id, v_last_group)
    ON CONFLICT (tournament_id, team_id) DO UPDATE SET group_label = EXCLUDED.group_label;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, team_id)
  SELECT
    tm.player_id,
    'tournament_approved',
    'Tournament registration approved! 🏆',
    'Your team has been approved to join ' || v_tourn_name || '. Get ready!',
    v_reg.team_id
  FROM team_members tm
  WHERE tm.team_id = v_reg.team_id AND tm.role = 'captain';

  RETURN v_reg;
END;
$$;

-- RPC: move team to another group (organizer only, registration or group_stage)
CREATE OR REPLACE FUNCTION move_team_to_group(
  p_tournament_id uuid,
  p_team_id uuid,
  p_target_group_label text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status text;
  v_bracket text;
BEGIN
  IF NOT is_tournament_organizer(p_tournament_id) THEN
    RAISE EXCEPTION 'Only the tournament organizer can move teams between groups';
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
  IF p_target_group_label = '__NEW__' THEN
    SELECT COALESCE(
      chr(ascii(MAX(group_label)) + 1),
      'A'
    ) INTO p_target_group_label
    FROM tournament_groups
    WHERE tournament_id = p_tournament_id;
    IF p_target_group_label IS NULL THEN
      p_target_group_label := 'A';
    END IF;
  END IF;

  INSERT INTO tournament_groups (tournament_id, team_id, group_label)
  VALUES (p_tournament_id, p_team_id, p_target_group_label)
  ON CONFLICT (tournament_id, team_id) DO UPDATE SET group_label = EXCLUDED.group_label;
END;
$$;

-- start_group_stage: respect existing tournament_groups if already populated
CREATE OR REPLACE FUNCTION start_group_stage(p_tournament_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tournament  tournaments%rowtype;
  v_teams       uuid[];
  v_match_id    uuid;
  v_group_labels text[] := ARRAY['A','B','C','D','E','F','G','H'];
  v_group_idx   int;
  v_group_label text;
  v_match_order int := 0;
  v_i           int;
  v_j           int;
  v_group_a     text;
  v_group_b     text;
  v_has_groups  boolean;
BEGIN
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;

  IF NOT is_tournament_organizer(p_tournament_id) THEN
    RAISE EXCEPTION 'Only the organizer can start the group stage';
  END IF;

  IF v_tournament.status <> 'registration' THEN
    RAISE EXCEPTION 'Tournament is not in registration phase';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM tournament_groups WHERE tournament_id = p_tournament_id LIMIT 1
  ) INTO v_has_groups;

  IF NOT v_has_groups THEN
    -- Original logic: assign teams to groups by teams_per_group
    SELECT ARRAY(
      SELECT team_id FROM tournament_registrations
      WHERE tournament_id = p_tournament_id AND status = 'approved'
      ORDER BY applied_at
    ) INTO v_teams;

    IF array_length(v_teams, 1) IS NULL OR array_length(v_teams, 1) < 2 THEN
      RAISE EXCEPTION 'Need at least 2 approved teams to start the group stage';
    END IF;

    FOR v_i IN 1..array_length(v_teams, 1) LOOP
      v_group_idx   := (v_i - 1) / v_tournament.teams_per_group;
      v_group_label := v_group_labels[v_group_idx + 1];

      INSERT INTO tournament_groups (tournament_id, team_id, group_label)
      VALUES (p_tournament_id, v_teams[v_i], v_group_label)
      ON CONFLICT (tournament_id, team_id) DO UPDATE SET group_label = EXCLUDED.group_label;
    END LOOP;
  END IF;

  -- Create round-robin matches within each group (use existing groups)
  SELECT ARRAY(
    SELECT team_id FROM tournament_registrations
    WHERE tournament_id = p_tournament_id AND status = 'approved'
    ORDER BY applied_at
  ) INTO v_teams;

  IF array_length(v_teams, 1) IS NULL OR array_length(v_teams, 1) < 2 THEN
    RAISE EXCEPTION 'Need at least 2 approved teams to start the group stage';
  END IF;

  FOR v_i IN 1..array_length(v_teams, 1) LOOP
    FOR v_j IN (v_i + 1)..array_length(v_teams, 1) LOOP
      SELECT group_label INTO v_group_a FROM tournament_groups
      WHERE tournament_id = p_tournament_id AND team_id = v_teams[v_i];

      SELECT group_label INTO v_group_b FROM tournament_groups
      WHERE tournament_id = p_tournament_id AND team_id = v_teams[v_j];

      IF v_group_a = v_group_b THEN
        v_match_order := v_match_order + 1;

        INSERT INTO matches (home_team_id, away_team_id, format, status, created_by)
        VALUES (v_teams[v_i], v_teams[v_j], v_tournament.match_format, 'pre_match', v_tournament.organizer_id)
        RETURNING id INTO v_match_id;

        INSERT INTO tournament_matches (tournament_id, match_id, stage, group_label, match_order)
        VALUES (p_tournament_id, v_match_id, 'group', v_group_a, v_match_order);
      END IF;
    END LOOP;
  END LOOP;

  UPDATE tournaments SET status = 'group_stage' WHERE id = p_tournament_id;
END;
$$;
