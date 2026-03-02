--  KICKUP — Goals per player when submitting result
--  Migration 026: Tournament organizer and team captains can assign goals to players
--  when submitting a match result. Uses -/+ UI; goals stored in match_events on completion.

-- 1. Add pending goals columns (jsonb: { "scorer_id": count, ... })
alter table matches add column if not exists pending_home_goals jsonb not null default '{}';
alter table matches add column if not exists pending_away_goals jsonb not null default '{}';

-- 2. Update submit_result: accept p_goals (jsonb) for the submitting team
create or replace function submit_result(
  p_match_id   uuid,
  p_team_id    uuid,
  p_home_score int,
  p_away_score int,
  p_mvp_id     uuid   default null,
  p_notes      text   default null,
  p_goals      jsonb  default '{}'
)
returns matches language plpgsql security definer set search_path = public as $$
declare
  v_match matches%rowtype;
  v_is_home boolean;
begin
  if not is_team_captain(p_team_id) then
    raise exception 'Only a team captain can submit a result';
  end if;

  select * into v_match from matches where id = p_match_id for update;
  if not found then
    raise exception 'Match not found';
  end if;

  if v_match.home_team_id <> p_team_id and v_match.away_team_id <> p_team_id then
    raise exception 'Your team is not part of this match';
  end if;

  v_is_home := (v_match.home_team_id = p_team_id);

  if v_is_home then
    update matches set
      home_score_submit   = p_home_score,
      home_result_status  = 'confirmed',
      mvp_id              = coalesce(p_mvp_id, mvp_id),
      notes               = coalesce(p_notes, notes),
      pending_home_goals  = coalesce(p_goals, '{}')
    where id = p_match_id
    returning * into v_match;
  else
    update matches set
      away_score_submit   = p_home_score,
      away_result_status  = 'confirmed',
      mvp_id              = coalesce(p_mvp_id, mvp_id),
      notes               = coalesce(p_notes, notes),
      pending_away_goals  = coalesce(p_goals, '{}')
    where id = p_match_id
    returning * into v_match;
  end if;

  return v_match;
end;
$$;

-- 3. Update resolve_match_result: insert match_events from pending goals before completing
create or replace function resolve_match_result()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_rec record;
  i int;
begin
  if NEW.home_result_status = 'confirmed' and NEW.away_result_status = 'confirmed' then
    if NEW.home_score_submit = NEW.away_score_submit then
      -- Insert match_events from pending_home_goals
      for v_rec in select key, coalesce(nullif(value, '')::int, 0) as cnt
        from jsonb_each_text(NEW.pending_home_goals)
      loop
        for i in 1..least(greatest(0, v_rec.cnt), 20) loop
          insert into match_events (match_id, team_id, scorer_id, minute)
          values (NEW.id, NEW.home_team_id, v_rec.key::uuid, 0);
        end loop;
      end loop;
      -- Insert match_events from pending_away_goals
      for v_rec in select key, coalesce(nullif(value, '')::int, 0) as cnt
        from jsonb_each_text(NEW.pending_away_goals)
      loop
        for i in 1..least(greatest(0, v_rec.cnt), 20) loop
          insert into match_events (match_id, team_id, scorer_id, minute)
          values (NEW.id, NEW.away_team_id, v_rec.key::uuid, 0);
        end loop;
      end loop;

      update matches set
        status             = 'completed',
        home_score         = NEW.home_score_submit,
        away_score         = NEW.away_score_submit,
        pending_home_goals = '{}',
        pending_away_goals = '{}'
      where id = NEW.id;
    else
      update matches set status = 'disputed' where id = NEW.id;
    end if;
  end if;
  return NEW;
end;
$$;

-- 4. Update organizer_submit_result: accept p_goals and insert match_events directly
create or replace function organizer_submit_result(
  p_match_id   uuid,
  p_home_score int,
  p_away_score int,
  p_mvp_id     uuid  default null,
  p_notes      text  default null,
  p_goals      jsonb default '{}'
)
returns matches language plpgsql security definer set search_path = public as $$
declare
  v_match matches%rowtype;
  v_home_goals jsonb;
  v_away_goals jsonb;
  v_rec record;
  i int;
begin
  if not is_tournament_match_organizer(p_match_id) then
    raise exception 'Only the tournament organizer can submit results for this match';
  end if;

  select * into v_match from matches where id = p_match_id for update;
  if not found then
    raise exception 'Match not found';
  end if;

  if v_match.status = 'completed' then
    raise exception 'Match is already completed';
  end if;

  v_home_goals := coalesce(p_goals->'home', '{}');
  v_away_goals := coalesce(p_goals->'away', '{}');

  -- Insert home team goals
  for v_rec in select key, coalesce(nullif(value, '')::int, 0) as cnt
    from jsonb_each_text(v_home_goals)
  loop
    for i in 1..least(greatest(0, v_rec.cnt), 20) loop
      insert into match_events (match_id, team_id, scorer_id, minute)
      values (p_match_id, v_match.home_team_id, v_rec.key::uuid, 0);
    end loop;
  end loop;

  -- Insert away team goals
  for v_rec in select key, coalesce(nullif(value, '')::int, 0) as cnt
    from jsonb_each_text(v_away_goals)
  loop
    for i in 1..least(greatest(0, v_rec.cnt), 20) loop
      insert into match_events (match_id, team_id, scorer_id, minute)
      values (p_match_id, v_match.away_team_id, v_rec.key::uuid, 0);
    end loop;
  end loop;

  update matches set
    home_score         = p_home_score,
    away_score         = p_away_score,
    home_score_submit  = p_home_score,
    away_score_submit  = p_away_score,
    home_result_status = 'confirmed',
    away_result_status = 'confirmed',
    mvp_id             = coalesce(p_mvp_id, mvp_id),
    notes              = coalesce(p_notes, notes),
    status             = 'completed'
  where id = p_match_id
  returning * into v_match;

  return v_match;
end;
$$;
