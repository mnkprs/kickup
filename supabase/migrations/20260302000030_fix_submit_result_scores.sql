--  KICKUP — Fix submit_result score storage
--  Migration 030: Store both home and away scores from each team for correct agreement check.
--  Previously: away team stored p_home_score in away_score_submit, causing wrong final scores.

-- 1. Add columns for the other score from each team
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_away_score_submit int;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_home_score_submit int;

-- 2. Update submit_result: store both scores from each team
DROP FUNCTION IF EXISTS submit_result(uuid, uuid, int, int, uuid, text);
DROP FUNCTION IF EXISTS submit_result(uuid, uuid, int, int, uuid, text, jsonb);

CREATE OR REPLACE FUNCTION submit_result(
  p_match_id   uuid,
  p_team_id    uuid,
  p_home_score int,
  p_away_score int,
  p_mvp_id     uuid   default null,
  p_notes      text   default null,
  p_goals      jsonb  default '{}'
)
RETURNS matches LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match matches%rowtype;
  v_is_home boolean;
BEGIN
  IF NOT is_team_captain(p_team_id) THEN
    RAISE EXCEPTION 'Only a team captain can submit a result';
  END IF;

  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_match.home_team_id <> p_team_id AND v_match.away_team_id <> p_team_id THEN
    RAISE EXCEPTION 'Your team is not part of this match';
  END IF;

  v_is_home := (v_match.home_team_id = p_team_id);

  IF v_is_home THEN
    UPDATE matches SET
      home_score_submit    = p_home_score,
      home_away_score_submit = p_away_score,
      home_result_status   = 'confirmed',
      mvp_id               = COALESCE(p_mvp_id, mvp_id),
      notes                = COALESCE(p_notes, notes),
      pending_home_goals   = COALESCE(p_goals, '{}')
    WHERE id = p_match_id
    RETURNING * INTO v_match;
  ELSE
    UPDATE matches SET
      away_home_score_submit = p_home_score,
      away_score_submit     = p_away_score,
      away_result_status    = 'confirmed',
      mvp_id                = COALESCE(p_mvp_id, mvp_id),
      notes                 = COALESCE(p_notes, notes),
      pending_away_goals    = COALESCE(p_goals, '{}')
    WHERE id = p_match_id
    RETURNING * INTO v_match;
  END IF;

  RETURN v_match;
END;
$$;

-- 3. Update resolve_match_result: compare both scores for agreement
CREATE OR REPLACE FUNCTION resolve_match_result()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rec record;
  i int;
BEGIN
  IF NEW.home_result_status = 'confirmed' AND NEW.away_result_status = 'confirmed' THEN
    -- Both teams agree on home score AND away score
    IF NEW.home_score_submit IS NOT DISTINCT FROM NEW.away_home_score_submit
       AND NEW.home_away_score_submit IS NOT DISTINCT FROM NEW.away_score_submit THEN
      -- Insert match_events from pending_home_goals
      FOR v_rec IN SELECT key, COALESCE(NULLIF(value, '')::int, 0) AS cnt
        FROM jsonb_each_text(NEW.pending_home_goals)
      LOOP
        FOR i IN 1..LEAST(GREATEST(0, v_rec.cnt), 20) LOOP
          INSERT INTO match_events (match_id, team_id, scorer_id, minute)
          VALUES (NEW.id, NEW.home_team_id, v_rec.key::uuid, 0);
        END LOOP;
      END LOOP;
      -- Insert match_events from pending_away_goals
      FOR v_rec IN SELECT key, COALESCE(NULLIF(value, '')::int, 0) AS cnt
        FROM jsonb_each_text(NEW.pending_away_goals)
      LOOP
        FOR i IN 1..LEAST(GREATEST(0, v_rec.cnt), 20) LOOP
          INSERT INTO match_events (match_id, team_id, scorer_id, minute)
          VALUES (NEW.id, NEW.away_team_id, v_rec.key::uuid, 0);
        END LOOP;
      END LOOP;

      UPDATE matches SET
        status              = 'completed',
        home_score          = NEW.home_score_submit,
        away_score          = COALESCE(NEW.home_away_score_submit, NEW.away_score_submit, 0),
        pending_home_goals   = '{}',
        pending_away_goals   = '{}'
      WHERE id = NEW.id;
    ELSE
      UPDATE matches SET status = 'disputed' WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
