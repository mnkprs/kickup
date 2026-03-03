-- KICKUP — Tournament Match Location
-- Add location parameter to set_tournament_match_schedule.

CREATE OR REPLACE FUNCTION set_tournament_match_schedule(
  p_match_id uuid,
  p_date     date,
  p_time     time,
  p_location text DEFAULT NULL
)
RETURNS matches LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tournament_id uuid;
  v_match         matches%rowtype;
BEGIN
  SELECT tournament_id INTO v_tournament_id
  FROM tournament_matches WHERE match_id = p_match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match is not part of any tournament';
  END IF;

  IF NOT is_tournament_organizer(v_tournament_id) THEN
    RAISE EXCEPTION 'Only the tournament organizer can set match schedules';
  END IF;

  UPDATE matches
  SET
    match_date = p_date,
    match_time = p_time,
    location   = COALESCE(NULLIF(TRIM(p_location), ''), location),
    status     = 'pre_match'
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  RETURN v_match;
END;
$$;
