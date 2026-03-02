--  KICKUP — Organizer Submit Result
--  Migration 020: Tournament organizer can submit match result directly
--  Used when both teams fail to report; organizer enters the final score.

CREATE OR REPLACE FUNCTION organizer_submit_result(
  p_match_id   uuid,
  p_home_score int,
  p_away_score int,
  p_mvp_id    uuid default null,
  p_notes     text default null
)
RETURNS matches LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match matches%rowtype;
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

  UPDATE matches SET
    home_score         = p_home_score,
    away_score         = p_away_score,
    home_score_submit  = p_home_score,
    away_score_submit  = p_away_score,
    home_result_status = 'confirmed',
    away_result_status = 'confirmed',
    mvp_id             = COALESCE(p_mvp_id, mvp_id),
    notes              = COALESCE(p_notes, notes),
    status             = 'completed'
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  RETURN v_match;
END;
$$;
