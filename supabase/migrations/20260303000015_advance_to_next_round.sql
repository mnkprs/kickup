-- Replace advance_to_final with dynamic advance_to_next_round.
-- Handles any round: 2 winners→final, 4→semi_final, 8→quarter_final, etc.

CREATE OR REPLACE FUNCTION advance_to_next_round(p_tournament_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tournament  tournaments%rowtype;
  v_match_id    uuid;
  v_cur         record;
  v_winners     uuid[] := ARRAY[]::uuid[];
  v_home        uuid;
  v_away        uuid;
  v_winner      uuid;
  v_max_order   int;
  v_next_stage  text;
  v_next_order  int;
  v_n           int;
  v_i           int;
  v_match_order int;
BEGIN
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;

  IF NOT is_tournament_organizer(p_tournament_id) THEN
    RAISE EXCEPTION 'Only the organizer can advance to the next round';
  END IF;

  IF v_tournament.status <> 'knockout_stage' THEN
    RAISE EXCEPTION 'Tournament is not in knockout stage';
  END IF;

  -- Final must not already exist
  IF EXISTS (
    SELECT 1 FROM tournament_matches
    WHERE tournament_id = p_tournament_id AND stage = 'final'
  ) THEN
    RAISE EXCEPTION 'Final match already exists';
  END IF;

  -- Find highest round_order among knockout matches
  SELECT COALESCE(MAX(round_order), 0) INTO v_max_order
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id AND stage <> 'group';

  IF v_max_order = 0 THEN
    RAISE EXCEPTION 'No knockout matches found. Advance from group stage first.';
  END IF;

  -- Collect winners from current round (ordered by match_order)
  FOR v_cur IN
    SELECT tm.match_id, tm.match_order, m.home_team_id, m.away_team_id, m.home_score, m.away_score, m.status
    FROM tournament_matches tm
    JOIN matches m ON m.id = tm.match_id
    WHERE tm.tournament_id = p_tournament_id
      AND tm.stage <> 'group'
      AND tm.round_order = v_max_order
    ORDER BY tm.match_order
  LOOP
    IF v_cur.status <> 'completed' THEN
      RAISE EXCEPTION 'All matches in the current round must be completed before advancing';
    END IF;

    IF v_cur.home_score IS NULL OR v_cur.away_score IS NULL THEN
      RAISE EXCEPTION 'Match has no result. Complete all matches in the current round.';
    END IF;

    IF v_cur.home_score > v_cur.away_score THEN
      v_winner := v_cur.home_team_id;
    ELSIF v_cur.away_score > v_cur.home_score THEN
      v_winner := v_cur.away_team_id;
    ELSE
      RAISE EXCEPTION 'Match ended in a draw. Resolve the result before advancing.';
    END IF;

    v_winners := array_append(v_winners, v_winner);
  END LOOP;

  v_n := array_length(v_winners, 1);
  IF v_n IS NULL OR v_n < 2 THEN
    RAISE EXCEPTION 'Need at least 2 match winners to advance';
  END IF;

  -- Determine next stage and round_order
  v_next_order := v_max_order + 1;
  v_next_stage := CASE
    WHEN v_n = 2 THEN 'final'
    WHEN v_n = 4 THEN 'semi_final'
    WHEN v_n = 8 THEN 'quarter_final'
    ELSE 'round_of_16'
  END;

  -- Create next round matches: pair (1,2), (3,4), ...
  v_match_order := 100 * v_next_order;
  FOR v_i IN 1..(v_n / 2) LOOP
    v_home := v_winners[(v_i - 1) * 2 + 1];
    v_away := v_winners[(v_i - 1) * 2 + 2];

    INSERT INTO matches (home_team_id, away_team_id, format, status, created_by)
    VALUES (v_home, v_away, v_tournament.match_format, 'pre_match', v_tournament.organizer_id)
    RETURNING id INTO v_match_id;

    INSERT INTO tournament_matches (tournament_id, match_id, stage, match_order, round_order)
    VALUES (p_tournament_id, v_match_id, v_next_stage, v_match_order + v_i, v_next_order);
  END LOOP;
END;
$$;

-- Keep advance_to_final as alias for backward compatibility with server actions
CREATE OR REPLACE FUNCTION advance_to_final(p_tournament_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM advance_to_next_round(p_tournament_id);
END;
$$;
