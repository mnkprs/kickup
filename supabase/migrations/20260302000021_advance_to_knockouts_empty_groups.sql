-- Fix: advance_to_knockouts fails with "upper bound of FOR loop cannot be null"
-- when tournament has no groups (array_length returns NULL).

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
BEGIN
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;

  IF NOT is_tournament_organizer(p_tournament_id) THEN
    RAISE EXCEPTION 'Only the organizer can advance to knockouts';
  END IF;

  IF v_tournament.status <> 'group_stage' THEN
    RAISE EXCEPTION 'Tournament is not in group stage';
  END IF;

  -- Get unique group labels ordered
  SELECT ARRAY(
    SELECT DISTINCT group_label FROM tournament_groups
    WHERE tournament_id = p_tournament_id
    ORDER BY group_label
  ) INTO v_groups;

  IF array_length(v_groups, 1) IS NULL THEN
    RAISE EXCEPTION 'No groups found. Start the group stage first.';
  END IF;

  -- Collect top 2 from each group
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

  -- Create semi-finals: cross-pair winners[i] vs runners[n+1-i]
  FOR v_i IN 1..v_n LOOP
    v_home       := v_winners[v_i];
    v_paired_idx := v_n + 1 - v_i;
    -- Clamp in case groups are uneven
    IF v_paired_idx > array_length(v_runners, 1) THEN
      v_paired_idx := array_length(v_runners, 1);
    END IF;
    v_away := v_runners[v_paired_idx];

    v_match_order := v_match_order + 1;

    INSERT INTO matches (home_team_id, away_team_id, format, status, created_by)
    VALUES (v_home, v_away, v_tournament.match_format, 'pre_match', v_tournament.organizer_id)
    RETURNING id INTO v_match_id;

    INSERT INTO tournament_matches (tournament_id, match_id, stage, match_order)
    VALUES (p_tournament_id, v_match_id, 'semi_final', v_match_order);
  END LOOP;

  UPDATE tournaments SET status = 'knockout_stage' WHERE id = p_tournament_id;
END;
$$;
