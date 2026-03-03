-- KICKUP — Guest players for match rosters
-- Captains/organizers can add guest players (non-team-members) to a roster for a specific match.
-- Guests can be assigned goals like regular roster players. Stored in match_lineups on completion.

-- 1. Add pending guest columns (jsonb arrays of player uuids)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS pending_guest_home_ids jsonb NOT NULL DEFAULT '[]';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS pending_guest_away_ids jsonb NOT NULL DEFAULT '[]';

-- 2. Update submit_result: accept p_guest_player_ids for the submitting team
DROP FUNCTION IF EXISTS submit_result(uuid, uuid, int, int, uuid, text, jsonb);

CREATE OR REPLACE FUNCTION submit_result(
  p_match_id           uuid,
  p_team_id            uuid,
  p_home_score         int,
  p_away_score         int,
  p_mvp_id             uuid   DEFAULT null,
  p_notes              text   DEFAULT null,
  p_goals              jsonb  DEFAULT '{}',
  p_guest_player_ids   jsonb  DEFAULT '[]'
)
RETURNS matches LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match   matches%rowtype;
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
      home_score_submit      = p_home_score,
      home_result_status     = 'confirmed',
      mvp_id                 = coalesce(p_mvp_id, mvp_id),
      notes                  = coalesce(p_notes, notes),
      pending_home_goals      = coalesce(p_goals, '{}'),
      pending_guest_home_ids  = coalesce(p_guest_player_ids, '[]')
    WHERE id = p_match_id
    RETURNING * INTO v_match;
  ELSE
    UPDATE matches SET
      away_score_submit      = p_home_score,
      away_result_status     = 'confirmed',
      mvp_id                 = coalesce(p_mvp_id, mvp_id),
      notes                  = coalesce(p_notes, notes),
      pending_away_goals     = coalesce(p_goals, '{}'),
      pending_guest_away_ids  = coalesce(p_guest_player_ids, '[]')
    WHERE id = p_match_id
    RETURNING * INTO v_match;
  END IF;

  RETURN v_match;
END;
$$;

-- 3. Helper: populate match_lineups with roster + guests when match completes
CREATE OR REPLACE FUNCTION populate_match_lineups_on_complete(
  p_match_id       uuid,
  p_home_team_id   uuid,
  p_away_team_id   uuid,
  p_guest_home_ids jsonb,
  p_guest_away_ids jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Insert team members for home team (from team_members, active only)
  INSERT INTO match_lineups (match_id, team_id, player_id)
  SELECT p_match_id, p_home_team_id, tm.player_id
  FROM team_members tm
  WHERE tm.team_id = p_home_team_id AND tm.status = 'active'
  ON CONFLICT (match_id, player_id) DO NOTHING;

  -- Insert team members for away team
  INSERT INTO match_lineups (match_id, team_id, player_id)
  SELECT p_match_id, p_away_team_id, tm.player_id
  FROM team_members tm
  WHERE tm.team_id = p_away_team_id AND tm.status = 'active'
  ON CONFLICT (match_id, player_id) DO NOTHING;

  -- Insert guest players for home team
  FOR v_id IN SELECT (jsonb_array_elements_text(coalesce(p_guest_home_ids, '[]')))::uuid
  LOOP
    INSERT INTO match_lineups (match_id, team_id, player_id)
    VALUES (p_match_id, p_home_team_id, v_id)
    ON CONFLICT (match_id, player_id) DO NOTHING;
  END LOOP;

  -- Insert guest players for away team
  FOR v_id IN SELECT (jsonb_array_elements_text(coalesce(p_guest_away_ids, '[]')))::uuid
  LOOP
    INSERT INTO match_lineups (match_id, team_id, player_id)
    VALUES (p_match_id, p_away_team_id, v_id)
    ON CONFLICT (match_id, player_id) DO NOTHING;
  END LOOP;
END;
$$;

-- 4. Update resolve_match_result: call populate_match_lineups before clearing guests
CREATE OR REPLACE FUNCTION resolve_match_result()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.home_result_status = 'confirmed' AND NEW.away_result_status = 'confirmed' THEN
    IF NEW.home_score_submit IS NOT DISTINCT FROM NEW.away_home_score_submit
       AND NEW.home_away_score_submit IS NOT DISTINCT FROM NEW.away_score_submit THEN

      PERFORM insert_match_events_with_unknown(
        NEW.id, NEW.home_team_id,
        coalesce(NEW.home_score_submit, 0),
        coalesce(NEW.pending_home_goals, '{}')
      );
      PERFORM insert_match_events_with_unknown(
        NEW.id, NEW.away_team_id,
        coalesce(NEW.home_away_score_submit, NEW.away_score_submit, 0),
        coalesce(NEW.pending_away_goals, '{}')
      );

      PERFORM populate_match_lineups_on_complete(
        NEW.id, NEW.home_team_id, NEW.away_team_id,
        coalesce(NEW.pending_guest_home_ids, '[]'),
        coalesce(NEW.pending_guest_away_ids, '[]')
      );

      UPDATE matches SET
        status                = 'completed',
        home_score            = NEW.home_score_submit,
        away_score            = COALESCE(NEW.home_away_score_submit, NEW.away_score_submit, 0),
        pending_home_goals    = '{}',
        pending_away_goals    = '{}',
        pending_guest_home_ids = '[]',
        pending_guest_away_ids = '[]'
      WHERE id = NEW.id;
    ELSE
      UPDATE matches SET status = 'disputed' WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Update organizer_submit_result: accept p_guest_player_ids and populate match_lineups
DROP FUNCTION IF EXISTS organizer_submit_result(uuid, int, int, uuid, text, jsonb);

CREATE OR REPLACE FUNCTION organizer_submit_result(
  p_match_id           uuid,
  p_home_score         int,
  p_away_score         int,
  p_mvp_id             uuid   DEFAULT null,
  p_notes              text   DEFAULT null,
  p_goals              jsonb  DEFAULT '{}',
  p_guest_player_ids   jsonb  DEFAULT '{"home":[],"away":[]}'
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

  IF v_match.status = 'disputed' THEN
    DELETE FROM match_events WHERE match_id = p_match_id;
  END IF;

  PERFORM insert_match_events_with_unknown(
    p_match_id, v_match.home_team_id, p_home_score,
    coalesce(p_goals->'home', '{}')
  );
  PERFORM insert_match_events_with_unknown(
    p_match_id, v_match.away_team_id, p_away_score,
    coalesce(p_goals->'away', '{}')
  );

  UPDATE matches SET
    home_score               = p_home_score,
    away_score               = p_away_score,
    home_score_submit        = p_home_score,
    home_away_score_submit   = p_away_score,
    away_home_score_submit    = p_home_score,
    away_score_submit        = p_away_score,
    home_result_status       = 'confirmed',
    away_result_status       = 'confirmed',
    mvp_id                   = coalesce(p_mvp_id, mvp_id),
    notes                    = coalesce(p_notes, notes),
    status                   = 'completed',
    pending_guest_home_ids   = coalesce(p_guest_player_ids->'home', '[]'),
    pending_guest_away_ids   = coalesce(p_guest_player_ids->'away', '[]')
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  PERFORM populate_match_lineups_on_complete(
    p_match_id, v_match.home_team_id, v_match.away_team_id,
    coalesce(p_guest_player_ids->'home', '[]'),
    coalesce(p_guest_player_ids->'away', '[]')
  );

  INSERT INTO match_action_history (match_id, actor_id, actor_type, score_home, score_away)
  VALUES (p_match_id, auth.uid(), 'organizer', p_home_score, p_away_score);

  RETURN v_match;
END;
$$;

-- 6. Update admin_update_match_result: accept p_guest_player_ids and populate match_lineups
DROP FUNCTION IF EXISTS admin_update_match_result(uuid, int, int, uuid, text, jsonb);

CREATE OR REPLACE FUNCTION admin_update_match_result(
  p_match_id           uuid,
  p_home_score         int,
  p_away_score         int,
  p_mvp_id             uuid   DEFAULT null,
  p_notes              text   DEFAULT null,
  p_goals              jsonb  DEFAULT '{}',
  p_guest_player_ids   jsonb  DEFAULT '{"home":[],"away":[]}'
)
RETURNS matches LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match    matches%rowtype;
  v_was_done boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Only admins can update match result';
  END IF;

  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  v_was_done := (v_match.status = 'completed');

  IF v_was_done THEN
    PERFORM revert_match_stats(p_match_id);
  END IF;

  DELETE FROM match_events WHERE match_id = p_match_id;
  DELETE FROM match_lineups WHERE match_id = p_match_id;

  PERFORM insert_match_events_with_unknown(
    p_match_id, v_match.home_team_id, p_home_score,
    coalesce(p_goals->'home', '{}')
  );
  PERFORM insert_match_events_with_unknown(
    p_match_id, v_match.away_team_id, p_away_score,
    coalesce(p_goals->'away', '{}')
  );

  UPDATE matches SET
    home_score               = p_home_score,
    away_score               = p_away_score,
    home_score_submit        = p_home_score,
    home_away_score_submit   = p_away_score,
    away_home_score_submit    = p_home_score,
    away_score_submit        = p_away_score,
    home_result_status       = 'confirmed',
    away_result_status       = 'confirmed',
    mvp_id                   = coalesce(p_mvp_id, mvp_id),
    notes                    = coalesce(p_notes, notes),
    status                   = 'completed',
    pending_guest_home_ids   = coalesce(p_guest_player_ids->'home', '[]'),
    pending_guest_away_ids   = coalesce(p_guest_player_ids->'away', '[]')
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  INSERT INTO match_action_history (match_id, actor_id, actor_type, score_home, score_away)
  VALUES (p_match_id, auth.uid(), 'admin', p_home_score, p_away_score);

  PERFORM populate_match_lineups_on_complete(
    p_match_id, v_match.home_team_id, v_match.away_team_id,
    coalesce(p_guest_player_ids->'home', '[]'),
    coalesce(p_guest_player_ids->'away', '[]')
  );
  PERFORM apply_match_stats(p_match_id);

  RETURN v_match;
END;
$$;
