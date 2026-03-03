-- KICKUP — Unknown placeholder player
-- For goals scored by non-registered players. Similar to TBD teams.
-- When admin/captain enters a score with unassigned goals, they go to Unknown.

-- ─── Unknown placeholder profile ───────────────────────────────────
-- UUID chosen to avoid collision with real users (b0... vs 00...)
-- Profile references auth.users, so we must create both.

-- 1. Insert auth user for Unknown (handle_new_user will create profile; we update it after)
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'unknown@system.kickup.local',
  crypt('x', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Unknown","avatar_color":"#9E9E9E"}'::jsonb,
  false, 'authenticated', 'authenticated',
  '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure profile exists and has correct display values
INSERT INTO profiles (id, full_name, avatar_initials, avatar_color, bio)
VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'Unknown',
  '?',
  '#9E9E9E',
  'Placeholder for goals by non-registered players'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Unknown',
  avatar_initials = '?',
  avatar_color = '#9E9E9E',
  bio = 'Placeholder for goals by non-registered players';

-- 3. Helper: get unknown player ID (for use in functions)
CREATE OR REPLACE FUNCTION get_unknown_player_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT 'b0000000-0000-0000-0000-000000000001'::uuid;
$$;

-- 4. Helper: insert match_events from goals jsonb, filling unassigned with Unknown
CREATE OR REPLACE FUNCTION insert_match_events_with_unknown(
  p_match_id   uuid,
  p_team_id    uuid,
  p_score      int,
  p_goals      jsonb
)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_unknown_id uuid := get_unknown_player_id();
  v_rec        record;
  v_sum        int := 0;
  v_unassigned int;
  i            int;
BEGIN
  -- Sum assigned goals
  SELECT coalesce(sum((value::text)::int), 0) INTO v_sum
  FROM jsonb_each_text(coalesce(p_goals, '{}'));

  -- Insert assigned goals (including explicit Unknown if client sends it)
  FOR v_rec IN SELECT key, coalesce(nullif(value, '')::int, 0) AS cnt
    FROM jsonb_each_text(coalesce(p_goals, '{}'))
  LOOP
    FOR i IN 1..least(greatest(0, v_rec.cnt), 20) LOOP
      INSERT INTO match_events (match_id, team_id, scorer_id, minute)
      VALUES (p_match_id, p_team_id, v_rec.key::uuid, 0);
    END LOOP;
  END LOOP;

  -- Unassigned goals (total - sum of assigned) → Unknown
  v_unassigned := greatest(0, p_score - v_sum);
  FOR i IN 1..least(v_unassigned, 20) LOOP
    INSERT INTO match_events (match_id, team_id, scorer_id, minute)
    VALUES (p_match_id, p_team_id, v_unknown_id, 0);
  END LOOP;
END;
$$;

-- 5. Update resolve_match_result to use the helper (fills unassigned with Unknown)
CREATE OR REPLACE FUNCTION resolve_match_result()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_home_sum int;
  v_away_sum int;
BEGIN
  IF NEW.home_result_status = 'confirmed' AND NEW.away_result_status = 'confirmed' THEN
    IF NEW.home_score_submit IS NOT DISTINCT FROM NEW.away_home_score_submit
       AND NEW.home_away_score_submit IS NOT DISTINCT FROM NEW.away_score_submit THEN

      -- Use helper to insert goals (unassigned → Unknown)
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

      UPDATE matches SET
        status              = 'completed',
        home_score          = NEW.home_score_submit,
        away_score          = COALESCE(NEW.home_away_score_submit, NEW.away_score_submit, 0),
        pending_home_goals  = '{}',
        pending_away_goals  = '{}'
      WHERE id = NEW.id;
    ELSE
      UPDATE matches SET status = 'disputed' WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Update admin_update_match_result
CREATE OR REPLACE FUNCTION admin_update_match_result(
  p_match_id   uuid,
  p_home_score int,
  p_away_score int,
  p_mvp_id     uuid  default null,
  p_notes      text  default null,
  p_goals      jsonb default '{}'
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

  PERFORM insert_match_events_with_unknown(
    p_match_id, v_match.home_team_id, p_home_score,
    coalesce(p_goals->'home', '{}')
  );
  PERFORM insert_match_events_with_unknown(
    p_match_id, v_match.away_team_id, p_away_score,
    coalesce(p_goals->'away', '{}')
  );

  UPDATE matches SET
    home_score             = p_home_score,
    away_score             = p_away_score,
    home_score_submit      = p_home_score,
    home_away_score_submit = p_away_score,
    away_home_score_submit = p_home_score,
    away_score_submit      = p_away_score,
    home_result_status     = 'confirmed',
    away_result_status     = 'confirmed',
    mvp_id                 = coalesce(p_mvp_id, mvp_id),
    notes                  = coalesce(p_notes, notes),
    status                 = 'completed'
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  INSERT INTO match_action_history (match_id, actor_id, actor_type, score_home, score_away)
  VALUES (p_match_id, auth.uid(), 'admin', p_home_score, p_away_score);

  PERFORM apply_match_stats(p_match_id);

  RETURN v_match;
END;
$$;

-- 7. Update organizer_submit_result
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
    home_score             = p_home_score,
    away_score             = p_away_score,
    home_score_submit      = p_home_score,
    home_away_score_submit = p_away_score,
    away_home_score_submit = p_home_score,
    away_score_submit      = p_away_score,
    home_result_status    = 'confirmed',
    away_result_status    = 'confirmed',
    mvp_id                 = coalesce(p_mvp_id, mvp_id),
    notes                  = coalesce(p_notes, notes),
    status                 = 'completed'
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  INSERT INTO match_action_history (match_id, actor_id, actor_type, score_home, score_away)
  VALUES (p_match_id, auth.uid(), 'organizer', p_home_score, p_away_score);

  RETURN v_match;
END;
$$;
