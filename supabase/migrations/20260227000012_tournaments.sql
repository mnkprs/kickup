-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Tournament Mode
--  Migration 012
-- ═══════════════════════════════════════════════════════════════════

-- ─── NEW ENUM ─────────────────────────────────────────────────────
CREATE TYPE tournament_status AS ENUM (
  'registration',
  'group_stage',
  'knockout_stage',
  'completed'
);

-- ─── EXTEND notif_type ────────────────────────────────────────────
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'tournament_approved';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'tournament_rejected';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'tournament_invite';

-- ─── TOURNAMENTS ──────────────────────────────────────────────────
CREATE TABLE tournaments (
  id              uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text              NOT NULL,
  description     text              NOT NULL DEFAULT '',
  organizer_id    uuid              NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue           text              NOT NULL DEFAULT '',
  area            text              NOT NULL DEFAULT '',
  match_format    match_format      NOT NULL,
  max_teams       int               NOT NULL DEFAULT 8 CHECK (max_teams >= 2),
  teams_per_group int               NOT NULL DEFAULT 4 CHECK (teams_per_group >= 2),
  prize           text              NOT NULL DEFAULT '',
  start_date      date,
  end_date        date,
  status          tournament_status NOT NULL DEFAULT 'registration',
  created_at      timestamptz       NOT NULL DEFAULT now(),
  updated_at      timestamptz       NOT NULL DEFAULT now()
);

CREATE TRIGGER tournaments_updated_at BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE INDEX tournaments_organizer_idx ON tournaments (organizer_id);
CREATE INDEX tournaments_status_idx    ON tournaments (status);

-- ─── TOURNAMENT REGISTRATIONS ─────────────────────────────────────
CREATE TABLE tournament_registrations (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id  uuid        NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id        uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','approved','rejected')),
  applied_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, team_id)
);

CREATE INDEX tournament_registrations_tournament_idx ON tournament_registrations (tournament_id);
CREATE INDEX tournament_registrations_team_idx       ON tournament_registrations (team_id);

-- ─── TOURNAMENT GROUPS ────────────────────────────────────────────
-- Populated by start_group_stage() RPC
CREATE TABLE tournament_groups (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id  uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id        uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  group_label    text NOT NULL,
  UNIQUE(tournament_id, team_id)
);

CREATE INDEX tournament_groups_tournament_idx ON tournament_groups (tournament_id);

-- ─── TOURNAMENT MATCHES ───────────────────────────────────────────
-- Links existing matches to tournament context
CREATE TABLE tournament_matches (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id  uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  match_id       uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  stage          text NOT NULL CHECK (stage IN ('group','semi_final','final')),
  group_label    text,           -- only set for stage = 'group'
  match_order    int  NOT NULL DEFAULT 0,
  UNIQUE(match_id)
);

CREATE INDEX tournament_matches_tournament_idx ON tournament_matches (tournament_id);

-- ─── RLS ──────────────────────────────────────────────────────────
ALTER TABLE tournaments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches      ENABLE ROW LEVEL SECURITY;

-- Helper: is the caller the organizer of a tournament?
CREATE OR REPLACE FUNCTION is_tournament_organizer(p_tournament_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM tournaments
    WHERE id = p_tournament_id AND organizer_id = auth.uid()
  );
$$;

-- Helper: is the caller the organizer of the tournament linked to a match?
CREATE OR REPLACE FUNCTION is_tournament_match_organizer(p_match_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM tournament_matches tm
    JOIN tournaments t ON t.id = tm.tournament_id
    WHERE tm.match_id = p_match_id AND t.organizer_id = auth.uid()
  );
$$;

-- tournaments
CREATE POLICY "tournaments_select_public"    ON tournaments FOR SELECT USING (true);
CREATE POLICY "tournaments_insert_organizer" ON tournaments FOR INSERT WITH CHECK (organizer_id = auth.uid());
CREATE POLICY "tournaments_update_organizer" ON tournaments FOR UPDATE
  USING (organizer_id = auth.uid()) WITH CHECK (organizer_id = auth.uid());

-- tournament_registrations
CREATE POLICY "tournament_registrations_select_public"    ON tournament_registrations FOR SELECT USING (true);
CREATE POLICY "tournament_registrations_insert_captain"   ON tournament_registrations FOR INSERT
  WITH CHECK (is_team_captain(team_id));
CREATE POLICY "tournament_registrations_update_organizer" ON tournament_registrations FOR UPDATE
  USING (is_tournament_organizer(tournament_id));

-- tournament_groups
CREATE POLICY "tournament_groups_select_public"    ON tournament_groups FOR SELECT USING (true);
CREATE POLICY "tournament_groups_insert_organizer" ON tournament_groups FOR INSERT
  WITH CHECK (is_tournament_organizer(tournament_id));
CREATE POLICY "tournament_groups_update_organizer" ON tournament_groups FOR UPDATE
  USING (is_tournament_organizer(tournament_id));

-- tournament_matches
CREATE POLICY "tournament_matches_select_public"    ON tournament_matches FOR SELECT USING (true);
CREATE POLICY "tournament_matches_insert_organizer" ON tournament_matches FOR INSERT
  WITH CHECK (is_tournament_organizer(tournament_id));
CREATE POLICY "tournament_matches_update_organizer" ON tournament_matches FOR UPDATE
  USING (is_tournament_organizer(tournament_id));

-- Extend existing matches UPDATE policy to also allow tournament organizer
-- (organizer needs to update match schedule/status for tournament matches)
CREATE POLICY "matches_update_tournament_organizer" ON matches FOR UPDATE
  USING (is_tournament_match_organizer(id));

-- ═══════════════════════════════════════════════════════════════════
--  RPCs (security definer)
-- ═══════════════════════════════════════════════════════════════════

-- ─── register_for_tournament ──────────────────────────────────────
CREATE OR REPLACE FUNCTION register_for_tournament(
  p_tournament_id uuid,
  p_team_id       uuid
)
RETURNS tournament_registrations LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_reg          tournament_registrations%rowtype;
  v_organizer_id uuid;
  v_team_name    text;
  v_tourn_name   text;
BEGIN
  IF NOT is_team_captain(p_team_id) THEN
    RAISE EXCEPTION 'Only a team captain can register for a tournament';
  END IF;

  SELECT organizer_id, name INTO v_organizer_id, v_tourn_name
  FROM tournaments WHERE id = p_tournament_id;

  SELECT name INTO v_team_name FROM teams WHERE id = p_team_id;

  INSERT INTO tournament_registrations (tournament_id, team_id)
  VALUES (p_tournament_id, p_team_id)
  RETURNING * INTO v_reg;

  -- Notify organizer
  INSERT INTO notifications (user_id, type, title, body, team_id)
  VALUES (
    v_organizer_id,
    'spot_applied',
    'New tournament registration',
    v_team_name || ' has applied to join ' || v_tourn_name || '.',
    p_team_id
  );

  RETURN v_reg;
END;
$$;

-- ─── approve_tournament_registration ─────────────────────────────
CREATE OR REPLACE FUNCTION approve_tournament_registration(p_registration_id uuid)
RETURNS tournament_registrations LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_reg        tournament_registrations%rowtype;
  v_tourn_name text;
BEGIN
  SELECT * INTO v_reg FROM tournament_registrations WHERE id = p_registration_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Registration not found'; END IF;

  IF NOT is_tournament_organizer(v_reg.tournament_id) THEN
    RAISE EXCEPTION 'Only the tournament organizer can approve registrations';
  END IF;

  UPDATE tournament_registrations SET status = 'approved'
  WHERE id = p_registration_id RETURNING * INTO v_reg;

  SELECT name INTO v_tourn_name FROM tournaments WHERE id = v_reg.tournament_id;

  INSERT INTO notifications (user_id, type, title, body, team_id)
  SELECT
    tm.player_id,
    'tournament_approved',
    'Tournament registration approved! 🏆',
    'Your team has been approved to join ' || v_tourn_name || '. Get ready!',
    v_reg.team_id
  FROM team_members tm
  WHERE tm.team_id = v_reg.team_id AND tm.role = 'captain';

  RETURN v_reg;
END;
$$;

-- ─── reject_tournament_registration ──────────────────────────────
CREATE OR REPLACE FUNCTION reject_tournament_registration(p_registration_id uuid)
RETURNS tournament_registrations LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_reg        tournament_registrations%rowtype;
  v_tourn_name text;
BEGIN
  SELECT * INTO v_reg FROM tournament_registrations WHERE id = p_registration_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Registration not found'; END IF;

  IF NOT is_tournament_organizer(v_reg.tournament_id) THEN
    RAISE EXCEPTION 'Only the tournament organizer can reject registrations';
  END IF;

  UPDATE tournament_registrations SET status = 'rejected'
  WHERE id = p_registration_id RETURNING * INTO v_reg;

  SELECT name INTO v_tourn_name FROM tournaments WHERE id = v_reg.tournament_id;

  INSERT INTO notifications (user_id, type, title, body, team_id)
  SELECT
    tm.player_id,
    'tournament_rejected',
    'Tournament registration not approved',
    'Your application to join ' || v_tourn_name || ' was not approved.',
    v_reg.team_id
  FROM team_members tm
  WHERE tm.team_id = v_reg.team_id AND tm.role = 'captain';

  RETURN v_reg;
END;
$$;

-- ─── start_group_stage ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION start_group_stage(p_tournament_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tournament  tournaments%rowtype;
  v_teams       uuid[];
  v_match_id    uuid;
  v_group_labels text[] := ARRAY['A','B','C','D','E','F','G','H'];
  v_group_idx   int;
  v_group_label text;
  v_match_order int := 0;
  v_i           int;
  v_j           int;
  v_group_a     text;
  v_group_b     text;
BEGIN
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;

  IF NOT is_tournament_organizer(p_tournament_id) THEN
    RAISE EXCEPTION 'Only the organizer can start the group stage';
  END IF;

  IF v_tournament.status <> 'registration' THEN
    RAISE EXCEPTION 'Tournament is not in registration phase';
  END IF;

  SELECT ARRAY(
    SELECT team_id FROM tournament_registrations
    WHERE tournament_id = p_tournament_id AND status = 'approved'
    ORDER BY applied_at
  ) INTO v_teams;

  IF array_length(v_teams, 1) IS NULL OR array_length(v_teams, 1) < 2 THEN
    RAISE EXCEPTION 'Need at least 2 approved teams to start the group stage';
  END IF;

  -- Assign teams to groups (sequential fill: teams 1..N per group)
  FOR v_i IN 1..array_length(v_teams, 1) LOOP
    v_group_idx   := (v_i - 1) / v_tournament.teams_per_group;
    v_group_label := v_group_labels[v_group_idx + 1];

    INSERT INTO tournament_groups (tournament_id, team_id, group_label)
    VALUES (p_tournament_id, v_teams[v_i], v_group_label)
    ON CONFLICT (tournament_id, team_id) DO UPDATE SET group_label = EXCLUDED.group_label;
  END LOOP;

  -- Create round-robin matches within each group
  FOR v_i IN 1..array_length(v_teams, 1) LOOP
    FOR v_j IN (v_i + 1)..array_length(v_teams, 1) LOOP
      SELECT group_label INTO v_group_a FROM tournament_groups
      WHERE tournament_id = p_tournament_id AND team_id = v_teams[v_i];

      SELECT group_label INTO v_group_b FROM tournament_groups
      WHERE tournament_id = p_tournament_id AND team_id = v_teams[v_j];

      IF v_group_a = v_group_b THEN
        v_match_order := v_match_order + 1;

        INSERT INTO matches (home_team_id, away_team_id, format, status, created_by)
        VALUES (v_teams[v_i], v_teams[v_j], v_tournament.match_format, 'pre_match', v_tournament.organizer_id)
        RETURNING id INTO v_match_id;

        INSERT INTO tournament_matches (tournament_id, match_id, stage, group_label, match_order)
        VALUES (p_tournament_id, v_match_id, 'group', v_group_a, v_match_order);
      END IF;
    END LOOP;
  END LOOP;

  UPDATE tournaments SET status = 'group_stage' WHERE id = p_tournament_id;
END;
$$;

-- ─── get_tournament_standings ─────────────────────────────────────
CREATE OR REPLACE FUNCTION get_tournament_standings(
  p_tournament_id uuid,
  p_group_label   text
)
RETURNS TABLE (
  rank    bigint,
  team_id uuid,
  name    text,
  emoji   text,
  played  int,
  w       int,
  d       int,
  l       int,
  gf      int,
  ga      int,
  gd      int,
  pts     int
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH group_matches AS (
    SELECT m.*
    FROM tournament_matches tm
    JOIN matches m ON m.id = tm.match_id
    WHERE tm.tournament_id = p_tournament_id
      AND tm.stage = 'group'
      AND tm.group_label = p_group_label
      AND m.status = 'completed'
  ),
  teams_in_group AS (
    SELECT tg.team_id, t.name, t.emoji
    FROM tournament_groups tg
    JOIN teams t ON t.id = tg.team_id
    WHERE tg.tournament_id = p_tournament_id
      AND tg.group_label = p_group_label
  ),
  stats AS (
    SELECT
      tig.team_id,
      tig.name,
      tig.emoji,
      COUNT(gm.id)::int AS played,
      COALESCE(SUM(CASE
        WHEN gm.home_team_id = tig.team_id AND gm.home_score > gm.away_score THEN 1
        WHEN gm.away_team_id = tig.team_id AND gm.away_score > gm.home_score THEN 1
        ELSE 0 END), 0)::int AS w,
      COALESCE(SUM(CASE
        WHEN gm.id IS NOT NULL AND gm.home_score = gm.away_score THEN 1
        ELSE 0 END), 0)::int AS d,
      COALESCE(SUM(CASE
        WHEN gm.home_team_id = tig.team_id AND gm.home_score < gm.away_score THEN 1
        WHEN gm.away_team_id = tig.team_id AND gm.away_score < gm.home_score THEN 1
        ELSE 0 END), 0)::int AS l,
      COALESCE(SUM(CASE
        WHEN gm.home_team_id = tig.team_id THEN gm.home_score
        WHEN gm.away_team_id = tig.team_id THEN gm.away_score
        ELSE 0 END), 0)::int AS gf,
      COALESCE(SUM(CASE
        WHEN gm.home_team_id = tig.team_id THEN gm.away_score
        WHEN gm.away_team_id = tig.team_id THEN gm.home_score
        ELSE 0 END), 0)::int AS ga
    FROM teams_in_group tig
    LEFT JOIN group_matches gm ON gm.home_team_id = tig.team_id OR gm.away_team_id = tig.team_id
    GROUP BY tig.team_id, tig.name, tig.emoji
  )
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY (w * 3 + d) DESC, (gf - ga) DESC, gf DESC
    ) AS rank,
    team_id,
    name,
    emoji,
    played,
    w, d, l,
    gf, ga,
    (gf - ga) AS gd,
    (w * 3 + d) AS pts
  FROM stats
  ORDER BY rank;
$$;

-- ─── advance_to_knockouts ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION advance_to_knockouts(p_tournament_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tournament  tournaments%rowtype;
  v_groups      text[];
  v_group       text;
  v_match_id    uuid;
  v_match_order int := 0;
  v_winners     uuid[] := ARRAY[]::uuid[];
  v_runners     uuid[] := ARRAY[]::uuid[];
  v_row         record;
  v_home        uuid;
  v_away        uuid;
  v_paired_idx  int;
  v_n           int;
BEGIN
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;

  IF NOT is_tournament_organizer(p_tournament_id) THEN
    RAISE EXCEPTION 'Only the organizer can advance to knockouts';
  END IF;

  IF v_tournament.status <> 'group_stage' THEN
    RAISE EXCEPTION 'Tournament is not in group stage';
  END IF;

  -- Get unique group labels ordered
  SELECT ARRAY(
    SELECT DISTINCT group_label FROM tournament_groups
    WHERE tournament_id = p_tournament_id
    ORDER BY group_label
  ) INTO v_groups;

  -- Collect top 2 from each group
  FOR v_i IN 1..array_length(v_groups, 1) LOOP
    v_group := v_groups[v_i];
    FOR v_row IN
      SELECT * FROM get_tournament_standings(p_tournament_id, v_group) LIMIT 2
    LOOP
      IF v_row.rank = 1 THEN
        v_winners := array_append(v_winners, v_row.team_id);
      ELSE
        v_runners := array_append(v_runners, v_row.team_id);
      END IF;
    END LOOP;
  END LOOP;

  v_n := array_length(v_winners, 1);

  -- Create semi-finals: cross-pair winners[i] vs runners[n+1-i]
  FOR v_i IN 1..v_n LOOP
    v_home       := v_winners[v_i];
    v_paired_idx := v_n + 1 - v_i;
    -- Clamp in case groups are uneven
    IF v_paired_idx > array_length(v_runners, 1) THEN
      v_paired_idx := array_length(v_runners, 1);
    END IF;
    v_away := v_runners[v_paired_idx];

    v_match_order := v_match_order + 1;

    INSERT INTO matches (home_team_id, away_team_id, format, status, created_by)
    VALUES (v_home, v_away, v_tournament.match_format, 'pre_match', v_tournament.organizer_id)
    RETURNING id INTO v_match_id;

    INSERT INTO tournament_matches (tournament_id, match_id, stage, match_order)
    VALUES (p_tournament_id, v_match_id, 'semi_final', v_match_order);
  END LOOP;

  UPDATE tournaments SET status = 'knockout_stage' WHERE id = p_tournament_id;
END;
$$;

-- ─── complete_tournament ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION complete_tournament(p_tournament_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_tournament_organizer(p_tournament_id) THEN
    RAISE EXCEPTION 'Only the organizer can complete the tournament';
  END IF;

  UPDATE tournaments SET status = 'completed' WHERE id = p_tournament_id;
END;
$$;

-- ─── set_tournament_match_schedule ────────────────────────────────
CREATE OR REPLACE FUNCTION set_tournament_match_schedule(
  p_match_id uuid,
  p_date     date,
  p_time     time
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
  SET match_date = p_date, match_time = p_time, status = 'pre_match'
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  RETURN v_match;
END;
$$;
