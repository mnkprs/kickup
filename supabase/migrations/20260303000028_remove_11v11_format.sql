-- ═══════════════════════════════════════════════════════════════════
--  Remove 11v11 from match_format enum everywhere
--  Keeps only 5v5, 6v6, 7v7, 8v8
-- ═══════════════════════════════════════════════════════════════════

-- Create new enum without 11v11
CREATE TYPE match_format_new AS ENUM ('5v5', '6v6', '7v7', '8v8');

-- Convert any existing 11v11 to 5v5 (fallback), then alter columns
ALTER TABLE teams
  ALTER COLUMN format TYPE match_format_new
  USING (CASE format::text WHEN '11v11' THEN '5v5'::match_format_new ELSE format::text::match_format_new END);

ALTER TABLE matches
  ALTER COLUMN format TYPE match_format_new
  USING (CASE format::text WHEN '11v11' THEN '5v5'::match_format_new ELSE format::text::match_format_new END);

ALTER TABLE tournaments
  ALTER COLUMN match_format TYPE match_format_new
  USING (CASE match_format::text WHEN '11v11' THEN '5v5'::match_format_new ELSE match_format::text::match_format_new END);

-- Recreate sync_team_open_spots without 11v11 case
CREATE OR REPLACE FUNCTION sync_team_open_spots()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_count int;
  spots_for_format int;
  team_fmt match_format_new;
  v_team_id uuid;
BEGIN
  v_team_id := COALESCE(NEW.team_id, OLD.team_id);
  SELECT format INTO team_fmt FROM teams WHERE id = v_team_id;
  SELECT COUNT(*) INTO member_count FROM team_members WHERE team_id = v_team_id AND status = 'active';
  spots_for_format := CASE team_fmt
    WHEN '5v5'   THEN 5
    WHEN '6v6'   THEN 6
    WHEN '7v7'   THEN 7
    WHEN '8v8'   THEN 8
    ELSE 5
  END;
  UPDATE teams SET open_spots = GREATEST(0, spots_for_format - member_count)
  WHERE id = v_team_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate send_challenge with match_format_new
CREATE OR REPLACE FUNCTION send_challenge(
  p_home_team_id uuid,
  p_away_team_id uuid,
  p_format       match_format_new,
  p_message      text DEFAULT NULL
)
RETURNS matches LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match matches%rowtype;
BEGIN
  IF NOT is_team_captain(p_home_team_id) THEN
    RAISE EXCEPTION 'Only a team captain can send a challenge';
  END IF;

  INSERT INTO matches (home_team_id, away_team_id, format, status, notes, created_by)
  VALUES (p_home_team_id, p_away_team_id, p_format, 'pending_challenge', p_message, auth.uid())
  RETURNING * INTO v_match;

  INSERT INTO notifications (user_id, type, title, body, match_id, team_id)
  SELECT
    tm.player_id,
    'challenge',
    'You received a challenge!',
    (SELECT name FROM teams WHERE id = p_home_team_id) ||
      ' want to face you in a ' || p_format::text || ' match.' ||
      COALESCE(E'\n' || p_message, ''),
    v_match.id,
    p_home_team_id
  FROM team_members tm
  WHERE tm.team_id = p_away_team_id AND tm.role = 'captain';

  RETURN v_match;
END;
$$;

-- Recreate get_leaderboard with match_format_new
CREATE OR REPLACE FUNCTION get_leaderboard(p_format match_format_new DEFAULT NULL, p_area text DEFAULT NULL)
RETURNS TABLE (
  rank        bigint,
  team_id     uuid,
  team_name   text,
  team_emoji  text,
  area        text,
  format      match_format_new,
  played      int,
  wins        int,
  draws       int,
  losses      int,
  goals_for   int,
  goals_ag    int,
  goal_diff   int,
  points      int
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    row_number() OVER (ORDER BY (record_w * 3 + record_d) DESC, (record_gf - record_ga) DESC) AS rank,
    t.id AS team_id,
    t.name AS team_name,
    t.emoji AS team_emoji,
    t.area,
    t.format,
    (t.record_w + t.record_d + t.record_l)::int AS played,
    t.record_w::int AS wins,
    t.record_d::int AS draws,
    t.record_l::int AS losses,
    t.record_gf::int AS goals_for,
    t.record_ga::int AS goals_ag,
    (t.record_gf - t.record_ga)::int AS goal_diff,
    (t.record_w * 3 + t.record_d)::int AS points
  FROM teams t
  WHERE (p_format IS NULL OR t.format = p_format)
    AND (p_area IS NULL OR lower(t.area) = lower(p_area))
  ORDER BY (record_w * 3 + record_d) DESC, (record_gf - record_ga) DESC;
$$;

-- Recreate create_team_with_captain to use match_format_new
CREATE OR REPLACE FUNCTION create_team_with_captain(
  p_name        text,
  p_short_name  text,
  p_formats     text[],
  p_area        text,
  p_emoji       text,
  p_color       text,
  p_description text DEFAULT ''
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_team_id uuid;
  v_format  match_format_new;
BEGIN
  IF array_length(p_formats, 1) IS NULL OR array_length(p_formats, 1) < 1 THEN
    RAISE EXCEPTION 'At least one format is required';
  END IF;
  v_format := p_formats[1]::match_format_new;

  INSERT INTO teams (name, short_name, format, area, emoji, color, description, created_by)
  VALUES (p_name, p_short_name, v_format, p_area, p_emoji, p_color, p_description, auth.uid())
  RETURNING id INTO v_team_id;

  INSERT INTO team_members (team_id, player_id, role, status)
  VALUES (v_team_id, auth.uid(), 'captain', 'active');

  RETURN v_team_id;
END;
$$;

-- Drop old functions that depend on match_format (CREATE OR REPLACE creates overloads, not replacements)
DROP FUNCTION IF EXISTS send_challenge(uuid, uuid, match_format, text);
DROP FUNCTION IF EXISTS get_leaderboard(match_format, text);

-- Drop old enum and rename new one
DROP TYPE match_format;
ALTER TYPE match_format_new RENAME TO match_format;

-- Recreate functions with match_format (avoids "match_format_new does not exist" when triggers run)
CREATE OR REPLACE FUNCTION sync_team_open_spots()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_count int;
  spots_for_format int;
  team_fmt match_format;
  v_team_id uuid;
BEGIN
  v_team_id := COALESCE(NEW.team_id, OLD.team_id);
  SELECT format INTO team_fmt FROM teams WHERE id = v_team_id;
  SELECT COUNT(*) INTO member_count FROM team_members WHERE team_id = v_team_id AND status = 'active';
  spots_for_format := CASE team_fmt
    WHEN '5v5'   THEN 5
    WHEN '6v6'   THEN 6
    WHEN '7v7'   THEN 7
    WHEN '8v8'   THEN 8
    ELSE 5
  END;
  UPDATE teams SET open_spots = GREATEST(0, spots_for_format - member_count)
  WHERE id = v_team_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION send_challenge(
  p_home_team_id uuid,
  p_away_team_id uuid,
  p_format       match_format,
  p_message      text DEFAULT NULL
)
RETURNS matches LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match matches%rowtype;
BEGIN
  IF NOT is_team_captain(p_home_team_id) THEN
    RAISE EXCEPTION 'Only a team captain can send a challenge';
  END IF;

  INSERT INTO matches (home_team_id, away_team_id, format, status, notes, created_by)
  VALUES (p_home_team_id, p_away_team_id, p_format, 'pending_challenge', p_message, auth.uid())
  RETURNING * INTO v_match;

  INSERT INTO notifications (user_id, type, title, body, match_id, team_id)
  SELECT
    tm.player_id,
    'challenge',
    'You received a challenge!',
    (SELECT name FROM teams WHERE id = p_home_team_id) ||
      ' want to face you in a ' || p_format::text || ' match.' ||
      COALESCE(E'\n' || p_message, ''),
    v_match.id,
    p_home_team_id
  FROM team_members tm
  WHERE tm.team_id = p_away_team_id AND tm.role = 'captain';

  RETURN v_match;
END;
$$;

CREATE OR REPLACE FUNCTION get_leaderboard(p_format match_format DEFAULT NULL, p_area text DEFAULT NULL)
RETURNS TABLE (
  rank        bigint,
  team_id     uuid,
  team_name   text,
  team_emoji  text,
  area        text,
  format      match_format,
  played      int,
  wins        int,
  draws       int,
  losses      int,
  goals_for   int,
  goals_ag    int,
  goal_diff   int,
  points      int
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    row_number() OVER (ORDER BY (record_w * 3 + record_d) DESC, (record_gf - record_ga) DESC) AS rank,
    t.id AS team_id,
    t.name AS team_name,
    t.emoji AS team_emoji,
    t.area,
    t.format,
    (t.record_w + t.record_d + t.record_l)::int AS played,
    t.record_w::int AS wins,
    t.record_d::int AS draws,
    t.record_l::int AS losses,
    t.record_gf::int AS goals_for,
    t.record_ga::int AS goals_ag,
    (t.record_gf - t.record_ga)::int AS goal_diff,
    (t.record_w * 3 + t.record_d)::int AS points
  FROM teams t
  WHERE (p_format IS NULL OR t.format = p_format)
    AND (p_area IS NULL OR lower(t.area) = lower(p_area))
  ORDER BY (record_w * 3 + record_d) DESC, (record_gf - record_ga) DESC;
$$;

CREATE OR REPLACE FUNCTION create_team_with_captain(
  p_name        text,
  p_short_name  text,
  p_formats     text[],
  p_area        text,
  p_emoji       text,
  p_color       text,
  p_description text DEFAULT ''
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_team_id uuid;
  v_format  match_format;
BEGIN
  IF array_length(p_formats, 1) IS NULL OR array_length(p_formats, 1) < 1 THEN
    RAISE EXCEPTION 'At least one format is required';
  END IF;
  v_format := p_formats[1]::match_format;

  INSERT INTO teams (name, short_name, format, area, emoji, color, description, created_by)
  VALUES (p_name, p_short_name, v_format, p_area, p_emoji, p_color, p_description, auth.uid())
  RETURNING id INTO v_team_id;

  INSERT INTO team_members (team_id, player_id, role, status)
  VALUES (v_team_id, auth.uid(), 'captain', 'active');

  RETURN v_team_id;
END;
$$;
