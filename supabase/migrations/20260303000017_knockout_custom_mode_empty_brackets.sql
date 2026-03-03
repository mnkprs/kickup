-- Knockout custom mode: create empty brackets on advance, allow assign teams
-- TBD placeholder teams for empty match slots (matches table requires non-null home/away)

-- ─── TBD placeholder teams ─────────────────────────────────────────
INSERT INTO teams (id, name, short_name, area, format, emoji, color, description)
VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'TBD', 'TBD', 'System', '7v7', '❓', '#9E9E9E', 'Placeholder for unassigned knockout slot'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'TBD', 'TBD', 'System2', '7v7', '❓', '#9E9E9E', 'Placeholder for unassigned knockout slot')
ON CONFLICT (id) DO NOTHING;

-- ─── advance_to_knockouts: custom mode creates empty bracket ─────────
CREATE OR REPLACE FUNCTION advance_to_knockouts(p_tournament_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tournament  tournaments%rowtype;
  v_groups      text[];
  v_group       text;
  v_match_id    uuid;
  v_match_order int := 0;
  v_winners     uuid[] := ARRAY[]::uuid[];
  v_runners     uuid[] := ARRAY[]::uuid[];
  v_row         record;
  v_home        uuid;
  v_away        uuid;
  v_paired_idx  int;
  v_n           int;
  v_stage       text;
  v_i           int;
  v_tbd_home    uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_tbd_away    uuid := 'a0000000-0000-0000-0000-000000000002'::uuid;
  v_round       int;
  v_matches_in_round int;
  v_total_matches int;
BEGIN
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;

  IF NOT is_tournament_organizer(p_tournament_id) THEN
    RAISE EXCEPTION 'Only the organizer can advance to knockouts';
  END IF;

  IF v_tournament.status <> 'group_stage' THEN
    RAISE EXCEPTION 'Tournament is not in group stage';
  END IF;

  -- Custom mode: create empty bracket structure (TBD vs TBD)
  IF COALESCE(v_tournament.knockout_mode, 'auto') = 'custom' THEN
    -- Get unique group labels
    SELECT ARRAY(
      SELECT DISTINCT group_label FROM tournament_groups
      WHERE tournament_id = p_tournament_id
      ORDER BY group_label
    ) INTO v_groups;

    IF array_length(v_groups, 1) IS NULL THEN
      RAISE EXCEPTION 'No groups found. Start the group stage first.';
    END IF;

    -- Count advancing teams (top 2 per group)
    FOR v_i IN 1..array_length(v_groups, 1) LOOP
      v_group := v_groups[v_i];
      FOR v_row IN
        SELECT * FROM get_tournament_standings(p_tournament_id, v_group) LIMIT 2
      LOOP
        v_winners := array_append(v_winners, v_row.team_id);
      END LOOP;
    END LOOP;

    v_n := array_length(v_winners, 1);
    IF v_n IS NULL OR v_n = 0 THEN
      RAISE EXCEPTION 'No group standings found. Complete all group matches first.';
    END IF;

    -- Total advancing = v_n * 2 (winners + runners)
    v_total_matches := v_n;
    v_stage := CASE
      WHEN v_total_matches <= 2 THEN 'semi_final'
      WHEN v_total_matches <= 4 THEN 'quarter_final'
      ELSE 'round_of_16'
    END;

    -- Create first round: v_n matches (TBD vs TBD)
    FOR v_i IN 1..v_n LOOP
      v_match_order := v_match_order + 1;
      INSERT INTO matches (home_team_id, away_team_id, format, status, created_by)
      VALUES (v_tbd_home, v_tbd_away, v_tournament.match_format, 'pre_match', v_tournament.organizer_id)
      RETURNING id INTO v_match_id;
      INSERT INTO tournament_matches (tournament_id, match_id, stage, match_order, round_order)
      VALUES (p_tournament_id, v_match_id, v_stage, v_match_order, 1);
    END LOOP;

    -- Create subsequent rounds (semi, final) as empty
    v_matches_in_round := v_n / 2;
    v_round := 2;
    WHILE v_matches_in_round >= 1 LOOP
      v_stage := CASE
        WHEN v_matches_in_round = 1 THEN 'final'
        WHEN v_matches_in_round = 2 THEN 'semi_final'
        WHEN v_matches_in_round <= 4 THEN 'quarter_final'
        ELSE 'round_of_16'
      END;
      FOR v_i IN 1..v_matches_in_round LOOP
        v_match_order := v_match_order + 1;
        INSERT INTO matches (home_team_id, away_team_id, format, status, created_by)
        VALUES (v_tbd_home, v_tbd_away, v_tournament.match_format, 'pre_match', v_tournament.organizer_id)
        RETURNING id INTO v_match_id;
        INSERT INTO tournament_matches (tournament_id, match_id, stage, match_order, round_order)
        VALUES (p_tournament_id, v_match_id, v_stage, v_match_order, v_round);
      END LOOP;
      v_matches_in_round := v_matches_in_round / 2;
      v_round := v_round + 1;
    END LOOP;

    UPDATE tournaments SET status = 'knockout_stage' WHERE id = p_tournament_id;
    RETURN;
  END IF;

  -- Auto mode: original logic (create matches with teams from standings)
  SELECT ARRAY(
    SELECT DISTINCT group_label FROM tournament_groups
    WHERE tournament_id = p_tournament_id
    ORDER BY group_label
  ) INTO v_groups;

  IF array_length(v_groups, 1) IS NULL THEN
    RAISE EXCEPTION 'No groups found. Start the group stage first.';
  END IF;

  FOR v_i IN 1..array_length(v_groups, 1) LOOP
    v_group := v_groups[v_i];
    FOR v_row IN
      SELECT * FROM get_tournament_standings(p_tournament_id, v_group) LIMIT 2
    LOOP
      IF v_row.rank = 1 THEN
        v_winners := array_append(v_winners, v_row.team_id);
      ELSE
        v_runners := array_append(v_runners, v_row.team_id);
      END IF;
    END LOOP;
  END LOOP;

  v_n := array_length(v_winners, 1);
  IF v_n IS NULL OR v_n = 0 THEN
    RAISE EXCEPTION 'No group standings found. Complete all group matches first.';
  END IF;

  v_stage := CASE
    WHEN v_n * 2 <= 4 THEN 'semi_final'
    WHEN v_n * 2 <= 8 THEN 'quarter_final'
    ELSE 'round_of_16'
  END;

  FOR v_i IN 1..v_n LOOP
    v_home       := v_winners[v_i];
    v_paired_idx := v_n + 1 - v_i;
    IF v_paired_idx > array_length(v_runners, 1) THEN
      v_paired_idx := array_length(v_runners, 1);
    END IF;
    v_away := v_runners[v_paired_idx];

    v_match_order := v_match_order + 1;

    INSERT INTO matches (home_team_id, away_team_id, format, status, created_by)
    VALUES (v_home, v_away, v_tournament.match_format, 'pre_match', v_tournament.organizer_id)
    RETURNING id INTO v_match_id;

    INSERT INTO tournament_matches (tournament_id, match_id, stage, match_order, round_order)
    VALUES (p_tournament_id, v_match_id, v_stage, v_match_order, 1);
  END LOOP;

  UPDATE tournaments SET status = 'knockout_stage' WHERE id = p_tournament_id;
END;
$$;

-- ─── create_knockout_match: allow optional teams (use TBD when null) ──
CREATE OR REPLACE FUNCTION create_knockout_match(
  p_tournament_id uuid,
  p_stage        text,
  p_round_order  int DEFAULT 1,
  p_home_team_id uuid DEFAULT NULL,
  p_away_team_id uuid DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tournament  tournaments%rowtype;
  v_match_id    uuid;
  v_match_order int;
  v_tbd_home    uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_tbd_away    uuid := 'a0000000-0000-0000-0000-000000000002'::uuid;
BEGIN
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;

  IF NOT is_tournament_organizer(p_tournament_id) THEN
    RAISE EXCEPTION 'Only the organizer can create knockout matches';
  END IF;

  IF v_tournament.status <> 'knockout_stage' THEN
    RAISE EXCEPTION 'Tournament must be in knockout stage';
  END IF;

  IF COALESCE(v_tournament.knockout_mode, 'auto') <> 'custom' THEN
    RAISE EXCEPTION 'Custom knockout mode required to create matches manually';
  END IF;

  IF p_stage NOT IN ('round_of_16','quarter_final','semi_final','final') THEN
    RAISE EXCEPTION 'Invalid stage: %', p_stage;
  END IF;

  -- Use TBD placeholders when teams not provided
  IF p_home_team_id IS NULL THEN p_home_team_id := v_tbd_home; END IF;
  IF p_away_team_id IS NULL THEN p_away_team_id := v_tbd_away; END IF;

  IF p_home_team_id = p_away_team_id THEN
    RAISE EXCEPTION 'Home and away teams must be different';
  END IF;

  SELECT COALESCE(MAX(match_order), 0) + 1 INTO v_match_order
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id AND stage <> 'group';

  INSERT INTO matches (home_team_id, away_team_id, format, status, created_by)
  VALUES (p_home_team_id, p_away_team_id, v_tournament.match_format, 'pre_match', v_tournament.organizer_id)
  RETURNING id INTO v_match_id;

  INSERT INTO tournament_matches (tournament_id, match_id, stage, match_order, round_order)
  VALUES (p_tournament_id, v_match_id, p_stage, v_match_order, p_round_order);

  RETURN v_match_id;
END;
$$;
