-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Core Schema
--  Migration 001: Types, tables, triggers
-- ═══════════════════════════════════════════════════════════════════

-- ─── EXTENSIONS ───────────────────────────────────────────────────
create extension if not exists "pg_trgm"; -- fast ilike search

-- ─── ENUMS ────────────────────────────────────────────────────────
create type player_position as enum ('GK', 'DEF', 'MID', 'FWD');
create type match_format    as enum ('5v5', '6v6', '7v7', '8v8', '11v11');
create type match_status    as enum (
  'pending_challenge',  -- challenge sent, opponent hasn't accepted
  'scheduling',         -- accepted, both teams proposing time/location
  'pre_match',          -- date/location confirmed, not played yet
  'disputed',           -- both teams submitted different scores
  'completed'           -- result confirmed by both sides
);
create type notif_type as enum (
  'challenge',
  'scheduling',
  'spot_applied',
  'result_confirmed',
  'bet_reminder',
  'match_reminder'
);
create type team_member_role as enum ('captain', 'player');
create type result_status    as enum ('pending', 'confirmed', 'disputed');

-- ─── PROFILES ────────────────────────────────────────────────────
-- One row per auth.users row, auto-created on sign-up.
create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  full_name        text        not null default '',
  avatar_initials  text        not null default '?',
  avatar_color     text        not null default '#2E7D32',
  position         player_position,
  area             text,
  bio              text        not null default '',
  is_freelancer    boolean     not null default false,
  freelancer_until date,                             -- show availability until this date
  -- aggregate stats (kept in sync by triggers/functions)
  stat_matches     int         not null default 0,
  stat_goals       int         not null default 0,
  stat_assists     int         not null default 0,
  stat_wins        int         not null default 0,
  stat_mvp         int         not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table profiles is 'Public player profile, extends auth.users 1:1';

-- ─── TEAMS ────────────────────────────────────────────────────────
create table teams (
  id                     uuid        primary key default gen_random_uuid(),
  name                   text        not null,
  short_name             text        not null,         -- 3-char abbreviation
  area                   text        not null,
  format                 match_format not null,
  emoji                  text        not null default '⚽',
  color                  text        not null default '#2E7D32',
  banner_url             text,
  description            text        not null default '',
  open_spots             int         not null default 0 check (open_spots >= 0),
  searching_for_opponent boolean     not null default false,
  -- aggregate record (kept in sync by triggers)
  record_w               int         not null default 0,
  record_d               int         not null default 0,
  record_l               int         not null default 0,
  record_gf              int         not null default 0,  -- goals for
  record_ga              int         not null default 0,  -- goals against
  created_by             uuid        references profiles(id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
comment on table teams is 'Amateur football teams';

-- unique, case-insensitive name per area
create unique index teams_name_area_unique on teams (lower(name), lower(area));

-- ─── TEAM MEMBERS ─────────────────────────────────────────────────
create table team_members (
  id         uuid             primary key default gen_random_uuid(),
  team_id    uuid             not null references teams(id) on delete cascade,
  player_id  uuid             not null references profiles(id) on delete cascade,
  role       team_member_role not null default 'player',
  joined_at  timestamptz      not null default now(),
  unique (team_id, player_id)
);
comment on table team_members is 'M2M between teams and players';

create index team_members_player_idx on team_members (player_id);
create index team_members_team_idx   on team_members (team_id);

-- ─── MATCHES ──────────────────────────────────────────────────────
create table matches (
  id                 uuid         primary key default gen_random_uuid(),
  home_team_id       uuid         not null references teams(id),
  away_team_id       uuid         not null references teams(id),
  format             match_format not null,
  status             match_status not null default 'pending_challenge',
  match_date         date,
  match_time         time,
  location           text,
  area               text,
  bet                text,                           -- informal wager description
  home_score         int          check (home_score >= 0),
  away_score         int          check (away_score >= 0),
  -- result submission tracking (both teams must agree)
  home_result_status result_status not null default 'pending',
  away_result_status result_status not null default 'pending',
  home_score_submit  int,                            -- what home team claimed
  away_score_submit  int,                            -- what away team claimed
  mvp_id             uuid         references profiles(id) on delete set null,
  notes              text,
  created_by         uuid         references profiles(id) on delete set null,
  created_at         timestamptz  not null default now(),
  updated_at         timestamptz  not null default now(),
  check (home_team_id <> away_team_id)
);
comment on table matches is 'Football matches between two teams';

create index matches_home_team_idx on matches (home_team_id);
create index matches_away_team_idx on matches (away_team_id);
create index matches_status_idx    on matches (status);
create index matches_date_idx      on matches (match_date);

-- ─── MATCH PROPOSALS ──────────────────────────────────────────────
-- Scheduling sub-table: proposals until one is accepted
create table match_proposals (
  id                  uuid        primary key default gen_random_uuid(),
  match_id            uuid        not null references matches(id) on delete cascade,
  proposed_by_team_id uuid        not null references teams(id),
  proposed_date       date        not null,
  proposed_time       time        not null,
  location            text        not null,
  accepted            boolean     not null default false,
  created_at          timestamptz not null default now()
);
comment on table match_proposals is 'Time/location proposals during scheduling phase';

create index match_proposals_match_idx on match_proposals (match_id);

-- ─── MATCH LINEUPS ────────────────────────────────────────────────
create table match_lineups (
  id         uuid  primary key default gen_random_uuid(),
  match_id   uuid  not null references matches(id) on delete cascade,
  team_id    uuid  not null references teams(id),
  player_id  uuid  not null references profiles(id),
  unique (match_id, player_id)
);

create index match_lineups_match_idx on match_lineups (match_id);

-- ─── MATCH EVENTS ─────────────────────────────────────────────────
-- Goals and assists per match
create table match_events (
  id         uuid        primary key default gen_random_uuid(),
  match_id   uuid        not null references matches(id) on delete cascade,
  team_id    uuid        not null references teams(id),
  scorer_id  uuid        not null references profiles(id),
  assist_id  uuid        references profiles(id),   -- nullable
  minute     int         check (minute between 0 and 120),
  created_at timestamptz not null default now()
);

create index match_events_match_idx  on match_events (match_id);
create index match_events_scorer_idx on match_events (scorer_id);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────
create table notifications (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references profiles(id) on delete cascade,
  type         notif_type  not null,
  title        text        not null,
  body         text        not null default '',
  read         boolean     not null default false,
  team_id      uuid        references teams(id) on delete cascade,
  match_id     uuid        references matches(id) on delete cascade,
  avatar_emoji text,
  avatar_color text,
  created_at   timestamptz not null default now()
);
comment on table notifications is 'Per-user notification inbox';

create index notifications_user_idx       on notifications (user_id, read, created_at desc);
create index notifications_user_read_idx  on notifications (user_id) where read = false;

-- ═══════════════════════════════════════════════════════════════════
--  TRIGGERS
-- ═══════════════════════════════════════════════════════════════════

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, avatar_color, position, area, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#2E7D32'),
    (new.raw_user_meta_data->>'position')::player_position,
    new.raw_user_meta_data->>'area',
    upper(substring(coalesce(new.raw_user_meta_data->>'full_name', '?') from 1 for 1)) ||
    upper(substring(
      regexp_replace(coalesce(new.raw_user_meta_data->>'full_name', ''), '^[^ ]+ ', '') from 1 for 1
    ))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- updated_at auto-bump
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute procedure set_updated_at();
create trigger teams_updated_at   before update on teams
  for each row execute procedure set_updated_at();
create trigger matches_updated_at  before update on matches
  for each row execute procedure set_updated_at();

-- Auto-update team open_spots when team_members change
create or replace function sync_team_open_spots()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  member_count int;
  spots_for_format int;
  team_fmt match_format;
begin
  -- determine affected team
  if (TG_OP = 'DELETE') then
    select format into team_fmt from teams where id = OLD.team_id;
    select count(*) into member_count from team_members where team_id = OLD.team_id;
    spots_for_format := case team_fmt
      when '5v5'   then 5
      when '6v6'   then 6
      when '7v7'   then 7
      when '8v8'   then 8
      when '11v11' then 11
      else 5
    end;
    update teams set open_spots = greatest(0, spots_for_format - member_count)
    where id = OLD.team_id;
  else
    select format into team_fmt from teams where id = NEW.team_id;
    select count(*) into member_count from team_members where team_id = NEW.team_id;
    spots_for_format := case team_fmt
      when '5v5'   then 5
      when '6v6'   then 6
      when '7v7'   then 7
      when '8v8'   then 8
      when '11v11' then 11
      else 5
    end;
    update teams set open_spots = greatest(0, spots_for_format - member_count)
    where id = NEW.team_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

create trigger sync_team_spots_insert after insert on team_members
  for each row execute procedure sync_team_open_spots();
create trigger sync_team_spots_delete after delete on team_members
  for each row execute procedure sync_team_open_spots();

-- Auto-update team record & player stats when a match is completed
create or replace function sync_match_stats()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Only fire when status flips to 'completed' and scores are set
  if NEW.status = 'completed' and OLD.status <> 'completed'
     and NEW.home_score is not null and NEW.away_score is not null then

    -- ── Team records ──────────────────────────────────────────────
    -- Home team
    update teams set
      record_gf = record_gf + NEW.home_score,
      record_ga = record_ga + NEW.away_score,
      record_w  = record_w  + case when NEW.home_score > NEW.away_score then 1 else 0 end,
      record_d  = record_d  + case when NEW.home_score = NEW.away_score then 1 else 0 end,
      record_l  = record_l  + case when NEW.home_score < NEW.away_score then 1 else 0 end
    where id = NEW.home_team_id;
    -- Away team
    update teams set
      record_gf = record_gf + NEW.away_score,
      record_ga = record_ga + NEW.home_score,
      record_w  = record_w  + case when NEW.away_score > NEW.home_score then 1 else 0 end,
      record_d  = record_d  + case when NEW.away_score = NEW.home_score then 1 else 0 end,
      record_l  = record_l  + case when NEW.away_score < NEW.home_score then 1 else 0 end
    where id = NEW.away_team_id;

    -- ── Player stats — matches & wins ────────────────────────────
    update profiles p set
      stat_matches = stat_matches + 1,
      stat_wins    = stat_wins    + case
        when ml.team_id = NEW.home_team_id and NEW.home_score > NEW.away_score then 1
        when ml.team_id = NEW.away_team_id and NEW.away_score > NEW.home_score then 1
        else 0
      end
    from match_lineups ml
    where ml.match_id = NEW.id and p.id = ml.player_id;

    -- ── Player stats — goals from match_events ───────────────────
    update profiles p set
      stat_goals = stat_goals + (
        select count(*) from match_events me
        where me.match_id = NEW.id and me.scorer_id = p.id
      ),
      stat_assists = stat_assists + (
        select count(*) from match_events me
        where me.match_id = NEW.id and me.assist_id = p.id
      )
    where p.id in (
      select distinct scorer_id from match_events where match_id = NEW.id
      union
      select distinct assist_id  from match_events where match_id = NEW.id and assist_id is not null
    );

    -- ── MVP stat ─────────────────────────────────────────────────
    if NEW.mvp_id is not null then
      update profiles set stat_mvp = stat_mvp + 1 where id = NEW.mvp_id;
    end if;

  end if;
  return NEW;
end;
$$;

create trigger sync_match_stats_trigger
  after update on matches
  for each row execute procedure sync_match_stats();

-- Auto-check dispute resolution: if both teams submit same score, mark completed
create or replace function resolve_match_result()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Both sides submitted
  if NEW.home_result_status = 'confirmed' and NEW.away_result_status = 'confirmed' then
    -- Scores agree → complete
    if NEW.home_score_submit = NEW.away_score_submit then
      update matches set
        status     = 'completed',
        home_score = NEW.home_score_submit,
        away_score = NEW.away_score_submit
      where id = NEW.id;
    else
      -- Scores disagree → disputed
      update matches set status = 'disputed' where id = NEW.id;
    end if;
  end if;
  return NEW;
end;
$$;

create trigger resolve_match_trigger
  after update of home_result_status, away_result_status on matches
  for each row execute procedure resolve_match_result();
