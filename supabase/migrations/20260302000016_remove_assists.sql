-- Remove assists from the app: profiles.stat_assists, match_events.assist_id,
-- sync_match_stats trigger, and get_player_scoreboard function.

-- 1. Update sync_match_stats: remove stat_assists logic
create or replace function sync_match_stats()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.status = 'completed' and OLD.status <> 'completed'
     and NEW.home_score is not null and NEW.away_score is not null then

    -- ── Team records ──────────────────────────────────────────────
    update teams set
      record_gf = record_gf + NEW.home_score,
      record_ga = record_ga + NEW.away_score,
      record_w  = record_w  + case when NEW.home_score > NEW.away_score then 1 else 0 end,
      record_d  = record_d  + case when NEW.home_score = NEW.away_score then 1 else 0 end,
      record_l  = record_l  + case when NEW.home_score < NEW.away_score then 1 else 0 end
    where id = NEW.home_team_id;
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
      )
    where p.id in (
      select distinct scorer_id from match_events where match_id = NEW.id
    );

    -- ── MVP stat ─────────────────────────────────────────────────
    if NEW.mvp_id is not null then
      update profiles set stat_mvp = stat_mvp + 1 where id = NEW.mvp_id;
    end if;

  end if;
  return NEW;
end;
$$;

-- 2. Drop assist_id from match_events
alter table match_events drop column if exists assist_id;

-- 3. Drop stat_assists from profiles
alter table profiles drop column if exists stat_assists;

-- 4. Update get_player_scoreboard: remove assists column and stat_assists
-- Must drop first: PostgreSQL cannot change return type with create or replace
drop function if exists get_player_scoreboard(text);
create or replace function get_player_scoreboard(p_area text default null)
returns table (
  rank      bigint,
  player_id uuid,
  full_name text,
  "position"  player_position,
  area      text,
  goals     int,
  matches   int,
  mvp       int
) language sql stable security definer set search_path = public as $$
  select
    row_number() over (order by stat_goals desc) as rank,
    id, full_name, p.position, p.area,
    stat_goals, stat_matches, stat_mvp
  from profiles p
  where
    (p_area is null or lower(p.area) = lower(p_area))
  order by stat_goals desc;
$$;
