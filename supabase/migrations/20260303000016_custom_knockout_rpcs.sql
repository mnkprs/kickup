-- Custom knockout flow: organiser creates matches and assigns teams manually

-- create_knockout_match: organiser creates a knockout match (teams optional)
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

  -- matches table requires non-null home/away teams
  IF p_home_team_id IS NULL OR p_away_team_id IS NULL THEN
    RAISE EXCEPTION 'Both home and away teams are required';
  END IF;

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

-- assign_teams_to_tournament_match: organiser assigns/updates teams on a match
CREATE OR REPLACE FUNCTION assign_teams_to_tournament_match(
  p_match_id     uuid,
  p_home_team_id uuid,
  p_away_team_id uuid
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tournament_id uuid;
  v_tournament    tournaments%rowtype;
  v_match         matches%rowtype;
BEGIN
  SELECT tm.tournament_id INTO v_tournament_id
  FROM tournament_matches tm
  WHERE tm.match_id = p_match_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament match not found'; END IF;

  SELECT * INTO v_tournament FROM tournaments WHERE id = v_tournament_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;

  IF NOT is_tournament_organizer(v_tournament_id) THEN
    RAISE EXCEPTION 'Only the organizer can assign teams';
  END IF;

  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Match not found'; END IF;

  -- Only allow if match not started (no result yet)
  IF v_match.status = 'completed' THEN
    RAISE EXCEPTION 'Cannot change teams on a completed match';
  END IF;

  UPDATE matches
  SET home_team_id = p_home_team_id, away_team_id = p_away_team_id
  WHERE id = p_match_id;
END;
$$;
