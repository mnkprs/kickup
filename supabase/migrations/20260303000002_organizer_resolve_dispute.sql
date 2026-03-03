-- KICKUP — Organizer Resolve Dispute
-- Allow tournament organizer to resolve disputed matches (captains submitted different scores).
-- organizer_submit_result already allows status != 'completed'; add defensive cleanup for disputed.

CREATE OR REPLACE FUNCTION organizer_submit_result(
  p_match_id   uuid,
  p_home_score int,
  p_away_score int,
  p_mvp_id     uuid  default null,
  p_notes      text  default null,
  p_goals      jsonb default '{}'
)
RETURNS matches LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match      matches%rowtype;
  v_home_goals jsonb;
  v_away_goals jsonb;
  v_rec        record;
  i            int;
BEGIN
  IF NOT is_tournament_match_organizer(p_match_id) THEN
    RAISE EXCEPTION 'Only the tournament organizer can submit results for this match';
  END IF;

  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_match.status = 'completed' THEN
    RAISE EXCEPTION 'Match is already completed';
  END IF;

  -- For disputed matches: clear any stale match_events before inserting (defensive)
  IF v_match.status = 'disputed' THEN
    DELETE FROM match_events WHERE match_id = p_match_id;
  END IF;

  v_home_goals := coalesce(p_goals->'home', '{}');
  v_away_goals := coalesce(p_goals->'away', '{}');

  -- Insert home team goals
  FOR v_rec IN SELECT key, coalesce(nullif(value, '')::int, 0) AS cnt
    FROM jsonb_each_text(v_home_goals)
  LOOP
    FOR i IN 1..least(greatest(0, v_rec.cnt), 20) LOOP
      INSERT INTO match_events (match_id, team_id, scorer_id, minute)
      VALUES (p_match_id, v_match.home_team_id, v_rec.key::uuid, 0);
    END LOOP;
  END LOOP;

  -- Insert away team goals
  FOR v_rec IN SELECT key, coalesce(nullif(value, '')::int, 0) AS cnt
    FROM jsonb_each_text(v_away_goals)
  LOOP
    FOR i IN 1..least(greatest(0, v_rec.cnt), 20) LOOP
      INSERT INTO match_events (match_id, team_id, scorer_id, minute)
      VALUES (p_match_id, v_match.away_team_id, v_rec.key::uuid, 0);
    END LOOP;
  END LOOP;

  UPDATE matches SET
    home_score         = p_home_score,
    away_score         = p_away_score,
    home_score_submit  = p_home_score,
    away_score_submit  = p_away_score,
    home_result_status = 'confirmed',
    away_result_status = 'confirmed',
    mvp_id             = coalesce(p_mvp_id, mvp_id),
    notes              = coalesce(p_notes, notes),
    status             = 'completed'
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  RETURN v_match;
END;
$$;
