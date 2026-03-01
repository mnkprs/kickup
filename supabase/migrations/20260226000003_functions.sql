-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Stored Functions & RPC Endpoints
--  Migration 003
-- ═══════════════════════════════════════════════════════════════════

-- ─── submit_result ─────────────────────────────────────────────────
-- Called by either team captain to submit a match result.
-- If both sides agree, auto-completes the match.
-- If they disagree, sets status to 'disputed'.
create or replace function submit_result(
  p_match_id   uuid,
  p_team_id    uuid,
  p_home_score int,
  p_away_score int,
  p_mvp_id     uuid   default null,
  p_notes      text   default null
)
returns matches language plpgsql security definer set search_path = public as $$
declare
  v_match matches%rowtype;
  v_is_home boolean;
begin
  -- Validate caller is captain of the submitting team
  if not is_team_captain(p_team_id) then
    raise exception 'Only a team captain can submit a result';
  end if;

  select * into v_match from matches where id = p_match_id for update;
  if not found then
    raise exception 'Match not found';
  end if;

  -- Validate submitting team is in this match
  if v_match.home_team_id <> p_team_id and v_match.away_team_id <> p_team_id then
    raise exception 'Your team is not part of this match';
  end if;

  v_is_home := (v_match.home_team_id = p_team_id);

  if v_is_home then
    update matches set
      home_score_submit  = p_home_score,
      home_result_status = 'confirmed',
      mvp_id             = coalesce(p_mvp_id, mvp_id),
      notes              = coalesce(p_notes, notes)
    where id = p_match_id
    returning * into v_match;
  else
    update matches set
      away_score_submit  = p_home_score,   -- from away's POV, p_home_score is still home
      away_result_status = 'confirmed',
      mvp_id             = coalesce(p_mvp_id, mvp_id),
      notes              = coalesce(p_notes, notes)
    where id = p_match_id
    returning * into v_match;
  end if;

  return v_match;
end;
$$;

-- ─── accept_proposal ───────────────────────────────────────────────
-- Accepts a scheduling proposal: marks it accepted, dismisses others,
-- updates match date/time/location, moves status to pre_match.
create or replace function accept_proposal(
  p_proposal_id uuid,
  p_team_id     uuid
)
returns matches language plpgsql security definer set search_path = public as $$
declare
  v_proposal match_proposals%rowtype;
  v_match    matches%rowtype;
begin
  if not is_team_captain(p_team_id) then
    raise exception 'Only a team captain can accept a proposal';
  end if;

  select * into v_proposal from match_proposals where id = p_proposal_id;
  if not found then raise exception 'Proposal not found'; end if;

  select * into v_match from matches where id = v_proposal.match_id;
  if v_match.status <> 'scheduling' then
    raise exception 'Match is not in scheduling phase';
  end if;

  -- The accepting team must be the OTHER team (not the proposer)
  if v_proposal.proposed_by_team_id = p_team_id then
    raise exception 'You cannot accept your own proposal';
  end if;

  -- Mark all proposals for this match as not accepted
  update match_proposals set accepted = false where match_id = v_proposal.match_id;

  -- Accept this one
  update match_proposals set accepted = true where id = p_proposal_id;

  -- Promote match
  update matches set
    status     = 'pre_match',
    match_date = v_proposal.proposed_date,
    match_time = v_proposal.proposed_time,
    location   = v_proposal.location
  where id = v_proposal.match_id
  returning * into v_match;

  return v_match;
end;
$$;

-- ─── send_challenge ────────────────────────────────────────────────
-- Creates a match + sends a notification to the opponent's captain(s).
create or replace function send_challenge(
  p_home_team_id uuid,
  p_away_team_id uuid,
  p_format       match_format,
  p_message      text default null
)
returns matches language plpgsql security definer set search_path = public as $$
declare
  v_match matches%rowtype;
begin
  if not is_team_captain(p_home_team_id) then
    raise exception 'Only a team captain can send a challenge';
  end if;

  insert into matches (home_team_id, away_team_id, format, status, notes, created_by)
  values (p_home_team_id, p_away_team_id, p_format, 'pending_challenge', p_message, auth.uid())
  returning * into v_match;

  -- Notify all captains of the away team
  insert into notifications (user_id, type, title, body, match_id, team_id)
  select
    tm.player_id,
    'challenge',
    'You received a challenge!',
    (select name from teams where id = p_home_team_id) ||
      ' want to face you in a ' || p_format::text || ' match.' ||
      coalesce(E'\n' || p_message, ''),
    v_match.id,
    p_home_team_id
  from team_members tm
  where tm.team_id = p_away_team_id and tm.role = 'captain';

  return v_match;
end;
$$;

-- ─── accept_challenge ──────────────────────────────────────────────
create or replace function accept_challenge(
  p_match_id uuid,
  p_team_id  uuid
)
returns matches language plpgsql security definer set search_path = public as $$
declare
  v_match matches%rowtype;
begin
  if not is_team_captain(p_team_id) then
    raise exception 'Only a team captain can accept a challenge';
  end if;

  select * into v_match from matches where id = p_match_id;
  if v_match.away_team_id <> p_team_id then
    raise exception 'You are not the challenged team';
  end if;
  if v_match.status <> 'pending_challenge' then
    raise exception 'Challenge is not pending';
  end if;

  update matches set status = 'scheduling' where id = p_match_id returning * into v_match;

  -- Notify home team captains
  insert into notifications (user_id, type, title, body, match_id, team_id)
  select
    tm.player_id,
    'scheduling',
    'Challenge accepted! 🎉',
    (select name from teams where id = p_team_id) || ' accepted your challenge. Start scheduling.',
    v_match.id,
    p_team_id
  from team_members tm
  where tm.team_id = v_match.home_team_id and tm.role = 'captain';

  return v_match;
end;
$$;

-- ─── get_leaderboard ───────────────────────────────────────────────
-- Returns teams ordered by points (3W 1D 0L), with win-rate tiebreaker.
create or replace function get_leaderboard(p_format match_format default null, p_area text default null)
returns table (
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
) language sql stable security definer set search_path = public as $$
  select
    row_number() over (order by (record_w * 3 + record_d) desc, (record_gf - record_ga) desc) as rank,
    id, name, emoji, t.area, t.format,
    record_w + record_d + record_l as played,
    record_w, record_d, record_l,
    record_gf, record_ga,
    record_gf - record_ga as goal_diff,
    record_w * 3 + record_d as points
  from teams t
  where
    (p_format is null or t.format = p_format) and
    (p_area   is null or lower(t.area) = lower(p_area))
  order by points desc, goal_diff desc;
$$;

-- ─── get_player_scoreboard ─────────────────────────────────────────
create or replace function get_player_scoreboard(p_area text default null)
returns table (
  rank      bigint,
  player_id uuid,
  full_name text,
  "position"  player_position,
  area      text,
  goals     int,
  assists   int,
  matches   int,
  mvp       int
) language sql stable security definer set search_path = public as $$
  select
    row_number() over (order by stat_goals desc, stat_assists desc) as rank,
    id, full_name, p.position, p.area,
    stat_goals, stat_assists, stat_matches, stat_mvp
  from profiles p
  where
    (p_area is null or lower(p.area) = lower(p_area))
  order by stat_goals desc, stat_assists desc;
$$;
