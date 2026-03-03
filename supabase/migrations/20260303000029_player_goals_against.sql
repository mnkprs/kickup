-- KICKUP — Player goals against (for goalkeeper GA/match stat)
-- Add stat_goals_against to profiles and update sync/revert/apply logic.

-- 1. Add stat_goals_against to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stat_goals_against int NOT NULL DEFAULT 0;

-- 1b. Backfill stat_goals_against from existing completed matches
UPDATE profiles p SET
  stat_goals_against = COALESCE((
    SELECT sum(CASE
      WHEN ml.team_id = m.home_team_id THEN m.away_score
      ELSE m.home_score
    END)
    FROM match_lineups ml
    JOIN matches m ON m.id = ml.match_id
    WHERE ml.player_id = p.id
      AND m.status = 'completed'
      AND m.home_score IS NOT NULL
      AND m.away_score IS NOT NULL
  ), 0);

-- 2. Update sync_match_stats: add goals against for each player in lineup
CREATE OR REPLACE FUNCTION sync_match_stats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed'
     AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN

    -- ── Team records ──────────────────────────────────────────────
    UPDATE teams SET
      record_gf = record_gf + NEW.home_score,
      record_ga = record_ga + NEW.away_score,
      record_w  = record_w  + CASE WHEN NEW.home_score > NEW.away_score THEN 1 ELSE 0 END,
      record_d  = record_d  + CASE WHEN NEW.home_score = NEW.away_score THEN 1 ELSE 0 END,
      record_l  = record_l  + CASE WHEN NEW.home_score < NEW.away_score THEN 1 ELSE 0 END
    WHERE id = NEW.home_team_id;
    UPDATE teams SET
      record_gf = record_gf + NEW.away_score,
      record_ga = record_ga + NEW.home_score,
      record_w  = record_w  + CASE WHEN NEW.away_score > NEW.home_score THEN 1 ELSE 0 END,
      record_d  = record_d  + CASE WHEN NEW.away_score = NEW.home_score THEN 1 ELSE 0 END,
      record_l  = record_l  + CASE WHEN NEW.away_score < NEW.home_score THEN 1 ELSE 0 END
    WHERE id = NEW.away_team_id;

    -- ── Player stats — matches, wins, goals_against ─────────────────
    UPDATE profiles p SET
      stat_matches     = stat_matches + 1,
      stat_wins        = stat_wins + CASE
        WHEN ml.team_id = NEW.home_team_id AND NEW.home_score > NEW.away_score THEN 1
        WHEN ml.team_id = NEW.away_team_id AND NEW.away_score > NEW.home_score THEN 1
        ELSE 0
      END,
      stat_goals_against = stat_goals_against + CASE
        WHEN ml.team_id = NEW.home_team_id THEN NEW.away_score
        ELSE NEW.home_score
      END
    FROM match_lineups ml
    WHERE ml.match_id = NEW.id AND p.id = ml.player_id;

    -- ── Player stats — goals from match_events ───────────────────
    UPDATE profiles p SET
      stat_goals = stat_goals + (
        SELECT count(*) FROM match_events me
        WHERE me.match_id = NEW.id AND me.scorer_id = p.id
      )
    WHERE p.id IN (
      SELECT DISTINCT scorer_id FROM match_events WHERE match_id = NEW.id
    );

    -- ── MVP stat ─────────────────────────────────────────────────
    IF NEW.mvp_id IS NOT NULL THEN
      UPDATE profiles SET stat_mvp = stat_mvp + 1 WHERE id = NEW.mvp_id;
    END IF;

  END IF;
  RETURN NEW;
END;
$$;

-- 3. Update revert_match_stats: subtract goals_against
CREATE OR REPLACE FUNCTION revert_match_stats(p_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match matches%rowtype;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  IF NOT FOUND OR v_match.status <> 'completed'
     OR v_match.home_score IS NULL OR v_match.away_score IS NULL THEN
    RETURN;
  END IF;

  -- Team records (subtract)
  UPDATE teams SET
    record_gf = record_gf - v_match.home_score,
    record_ga = record_ga - v_match.away_score,
    record_w  = record_w  - CASE WHEN v_match.home_score > v_match.away_score THEN 1 ELSE 0 END,
    record_d  = record_d  - CASE WHEN v_match.home_score = v_match.away_score THEN 1 ELSE 0 END,
    record_l  = record_l  - CASE WHEN v_match.home_score < v_match.away_score THEN 1 ELSE 0 END
  WHERE id = v_match.home_team_id;
  UPDATE teams SET
    record_gf = record_gf - v_match.away_score,
    record_ga = record_ga - v_match.home_score,
    record_w  = record_w  - CASE WHEN v_match.away_score > v_match.home_score THEN 1 ELSE 0 END,
    record_d  = record_d  - CASE WHEN v_match.away_score = v_match.home_score THEN 1 ELSE 0 END,
    record_l  = record_l  - CASE WHEN v_match.away_score < v_match.home_score THEN 1 ELSE 0 END
  WHERE id = v_match.away_team_id;

  -- Player stats — matches, wins, goals_against (subtract)
  UPDATE profiles p SET
    stat_matches      = stat_matches - 1,
    stat_wins         = stat_wins - CASE
      WHEN ml.team_id = v_match.home_team_id AND v_match.home_score > v_match.away_score THEN 1
      WHEN ml.team_id = v_match.away_team_id AND v_match.away_score > v_match.home_score THEN 1
      ELSE 0
    END,
    stat_goals_against = stat_goals_against - CASE
      WHEN ml.team_id = v_match.home_team_id THEN v_match.away_score
      ELSE v_match.home_score
    END
  FROM match_lineups ml
  WHERE ml.match_id = p_match_id AND p.id = ml.player_id;

  -- Player stats — goals (subtract)
  UPDATE profiles p SET
    stat_goals = stat_goals - (
      SELECT count(*) FROM match_events me
      WHERE me.match_id = p_match_id AND me.scorer_id = p.id
    )
  WHERE p.id IN (
    SELECT DISTINCT scorer_id FROM match_events WHERE match_id = p_match_id
  );

  -- MVP (subtract)
  IF v_match.mvp_id IS NOT NULL THEN
    UPDATE profiles SET stat_mvp = stat_mvp - 1 WHERE id = v_match.mvp_id;
  END IF;
END;
$$;

-- 4. Update apply_match_stats: add goals_against
CREATE OR REPLACE FUNCTION apply_match_stats(p_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match matches%rowtype;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  IF NOT FOUND OR v_match.status <> 'completed'
     OR v_match.home_score IS NULL OR v_match.away_score IS NULL THEN
    RETURN;
  END IF;

  -- Team records (add)
  UPDATE teams SET
    record_gf = record_gf + v_match.home_score,
    record_ga = record_ga + v_match.away_score,
    record_w  = record_w  + CASE WHEN v_match.home_score > v_match.away_score THEN 1 ELSE 0 END,
    record_d  = record_d  + CASE WHEN v_match.home_score = v_match.away_score THEN 1 ELSE 0 END,
    record_l  = record_l  + CASE WHEN v_match.home_score < v_match.away_score THEN 1 ELSE 0 END
  WHERE id = v_match.home_team_id;
  UPDATE teams SET
    record_gf = record_gf + v_match.away_score,
    record_ga = record_ga + v_match.home_score,
    record_w  = record_w  + CASE WHEN v_match.away_score > v_match.home_score THEN 1 ELSE 0 END,
    record_d  = record_d  + CASE WHEN v_match.away_score = v_match.home_score THEN 1 ELSE 0 END,
    record_l  = record_l  + CASE WHEN v_match.away_score < v_match.home_score THEN 1 ELSE 0 END
  WHERE id = v_match.away_team_id;

  -- Player stats — matches, wins, goals_against (add)
  UPDATE profiles p SET
    stat_matches      = stat_matches + 1,
    stat_wins         = stat_wins + CASE
      WHEN ml.team_id = v_match.home_team_id AND v_match.home_score > v_match.away_score THEN 1
      WHEN ml.team_id = v_match.away_team_id AND v_match.away_score > v_match.home_score THEN 1
      ELSE 0
    END,
    stat_goals_against = stat_goals_against + CASE
      WHEN ml.team_id = v_match.home_team_id THEN v_match.away_score
      ELSE v_match.home_score
    END
  FROM match_lineups ml
  WHERE ml.match_id = p_match_id AND p.id = ml.player_id;

  -- Player stats — goals (add)
  UPDATE profiles p SET
    stat_goals = stat_goals + (
      SELECT count(*) FROM match_events me
      WHERE me.match_id = p_match_id AND me.scorer_id = p.id
    )
  WHERE p.id IN (
    SELECT DISTINCT scorer_id FROM match_events WHERE match_id = p_match_id
  );

  -- MVP (add)
  IF v_match.mvp_id IS NOT NULL THEN
    UPDATE profiles SET stat_mvp = stat_mvp + 1 WHERE id = v_match.mvp_id;
  END IF;
END;
$$;
