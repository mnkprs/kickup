-- Create the final match when both semi-finals are completed.
-- Winner of semi-final 1 plays winner of semi-final 2.

CREATE OR REPLACE FUNCTION advance_to_final(p_tournament_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tournament  tournaments%rowtype;
  v_match_id    uuid;
  v_semi        record;
  v_winners     uuid[] := ARRAY[]::uuid[];
  v_home        uuid;
  v_away        uuid;
  v_winner      uuid;
BEGIN
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;

  IF NOT is_tournament_organizer(p_tournament_id) THEN
    RAISE EXCEPTION 'Only the organizer can advance to the final';
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

  -- Collect winners from each semi-final (ordered by match_order)
  FOR v_semi IN
    SELECT tm.match_id, tm.match_order, m.home_team_id, m.away_team_id, m.home_score, m.away_score, m.status
    FROM tournament_matches tm
    JOIN matches m ON m.id = tm.match_id
    WHERE tm.tournament_id = p_tournament_id AND tm.stage = 'semi_final'
    ORDER BY tm.match_order
  LOOP
    IF v_semi.status <> 'completed' THEN
      RAISE EXCEPTION 'All semi-finals must be completed before advancing to the final';
    END IF;

    IF v_semi.home_score IS NULL OR v_semi.away_score IS NULL THEN
      RAISE EXCEPTION 'Semi-final match has no result';
    END IF;

    IF v_semi.home_score > v_semi.away_score THEN
      v_winner := v_semi.home_team_id;
    ELSIF v_semi.away_score > v_semi.home_score THEN
      v_winner := v_semi.away_team_id;
    ELSE
      RAISE EXCEPTION 'Semi-final ended in a draw. Resolve the result before advancing.';
    END IF;

    v_winners := array_append(v_winners, v_winner);
  END LOOP;

  IF array_length(v_winners, 1) IS NULL OR array_length(v_winners, 1) < 2 THEN
    RAISE EXCEPTION 'Need exactly 2 semi-finals to create the final';
  END IF;

  v_home := v_winners[1];
  v_away := v_winners[2];

  INSERT INTO matches (home_team_id, away_team_id, format, status, created_by)
  VALUES (v_home, v_away, v_tournament.match_format, 'pre_match', v_tournament.organizer_id)
  RETURNING id INTO v_match_id;

  INSERT INTO tournament_matches (tournament_id, match_id, stage, match_order)
  VALUES (p_tournament_id, v_match_id, 'final', 100);
END;
$$;
