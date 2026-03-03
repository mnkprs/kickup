-- KICKUP — Admin Edit Match
-- Admins can edit any match details (schedule, result) regardless of status.

-- Helper: revert stats for a completed match (subtract from teams/profiles)
create or replace function revert_match_stats(p_match_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_match matches%rowtype;
begin
  select * into v_match from matches where id = p_match_id;
  if not found or v_match.status <> 'completed'
     or v_match.home_score is null or v_match.away_score is null then
    return;
  end if;

  -- Team records (subtract)
  update teams set
    record_gf = record_gf - v_match.home_score,
    record_ga = record_ga - v_match.away_score,
    record_w  = record_w  - case when v_match.home_score > v_match.away_score then 1 else 0 end,
    record_d  = record_d  - case when v_match.home_score = v_match.away_score then 1 else 0 end,
    record_l  = record_l  - case when v_match.home_score < v_match.away_score then 1 else 0 end
  where id = v_match.home_team_id;
  update teams set
    record_gf = record_gf - v_match.away_score,
    record_ga = record_ga - v_match.home_score,
    record_w  = record_w  - case when v_match.away_score > v_match.home_score then 1 else 0 end,
    record_d  = record_d  - case when v_match.away_score = v_match.home_score then 1 else 0 end,
    record_l  = record_l  - case when v_match.away_score < v_match.home_score then 1 else 0 end
  where id = v_match.away_team_id;

  -- Player stats — matches & wins (subtract)
  update profiles p set
    stat_matches = stat_matches - 1,
    stat_wins    = stat_wins - case
      when ml.team_id = v_match.home_team_id and v_match.home_score > v_match.away_score then 1
      when ml.team_id = v_match.away_team_id and v_match.away_score > v_match.home_score then 1
      else 0
    end
  from match_lineups ml
  where ml.match_id = p_match_id and p.id = ml.player_id;

  -- Player stats — goals (subtract)
  update profiles p set
    stat_goals = stat_goals - (
      select count(*) from match_events me
      where me.match_id = p_match_id and me.scorer_id = p.id
    )
  where p.id in (
    select distinct scorer_id from match_events where match_id = p_match_id
  );

  -- MVP (subtract)
  if v_match.mvp_id is not null then
    update profiles set stat_mvp = stat_mvp - 1 where id = v_match.mvp_id;
  end if;
end;
$$;

-- Helper: apply stats for a completed match (add to teams/profiles)
create or replace function apply_match_stats(p_match_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_match matches%rowtype;
begin
  select * into v_match from matches where id = p_match_id;
  if not found or v_match.status <> 'completed'
     or v_match.home_score is null or v_match.away_score is null then
    return;
  end if;

  -- Team records (add)
  update teams set
    record_gf = record_gf + v_match.home_score,
    record_ga = record_ga + v_match.away_score,
    record_w  = record_w  + case when v_match.home_score > v_match.away_score then 1 else 0 end,
    record_d  = record_d  + case when v_match.home_score = v_match.away_score then 1 else 0 end,
    record_l  = record_l  + case when v_match.home_score < v_match.away_score then 1 else 0 end
  where id = v_match.home_team_id;
  update teams set
    record_gf = record_gf + v_match.away_score,
    record_ga = record_ga + v_match.home_score,
    record_w  = record_w  + case when v_match.away_score > v_match.home_score then 1 else 0 end,
    record_d  = record_d  + case when v_match.away_score = v_match.home_score then 1 else 0 end,
    record_l  = record_l  + case when v_match.away_score < v_match.home_score then 1 else 0 end
  where id = v_match.away_team_id;

  -- Player stats — matches & wins (add)
  update profiles p set
    stat_matches = stat_matches + 1,
    stat_wins    = stat_wins + case
      when ml.team_id = v_match.home_team_id and v_match.home_score > v_match.away_score then 1
      when ml.team_id = v_match.away_team_id and v_match.away_score > v_match.home_score then 1
      else 0
    end
  from match_lineups ml
  where ml.match_id = p_match_id and p.id = ml.player_id;

  -- Player stats — goals (add)
  update profiles p set
    stat_goals = stat_goals + (
      select count(*) from match_events me
      where me.match_id = p_match_id and me.scorer_id = p.id
    )
  where p.id in (
    select distinct scorer_id from match_events where match_id = p_match_id
  );

  -- MVP (add)
  if v_match.mvp_id is not null then
    update profiles set stat_mvp = stat_mvp + 1 where id = v_match.mvp_id;
  end if;
end;
$$;

-- Admin: update match schedule (date, time, location) — any match, any status
create or replace function admin_update_match_schedule(
  p_match_id uuid,
  p_date     date default null,
  p_time     time default null,
  p_location text default null
)
returns matches language plpgsql security definer set search_path = public as $$
declare
  v_match matches%rowtype;
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Only admins can update match schedule';
  end if;

  select * into v_match from matches where id = p_match_id for update;
  if not found then
    raise exception 'Match not found';
  end if;

  update matches set
    match_date = coalesce(p_date, match_date),
    match_time = coalesce(p_time, match_time),
    location   = coalesce(p_location, location),
    status     = case when status = 'scheduling' then 'pre_match' else status end
  where id = p_match_id
  returning * into v_match;

  return v_match;
end;
$$;

-- Admin: update match result (scores, mvp, notes, goals) — any match, any status including completed
create or replace function admin_update_match_result(
  p_match_id   uuid,
  p_home_score int,
  p_away_score int,
  p_mvp_id     uuid  default null,
  p_notes      text  default null,
  p_goals      jsonb default '{}'
)
returns matches language plpgsql security definer set search_path = public as $$
declare
  v_match    matches%rowtype;
  v_goals    jsonb;
  v_rec      record;
  i          int;
  v_was_done boolean;
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Only admins can update match result';
  end if;

  select * into v_match from matches where id = p_match_id for update;
  if not found then
    raise exception 'Match not found';
  end if;

  v_was_done := (v_match.status = 'completed');

  -- If was completed: revert old stats before changing data
  if v_was_done then
    perform revert_match_stats(p_match_id);
  end if;

  -- Delete existing goals (match_events)
  delete from match_events where match_id = p_match_id;

  -- Insert new goals from p_goals: { "home": { "player_id": count }, "away": { ... } }
  v_goals := coalesce(p_goals, '{}');
  for v_rec in select key, coalesce(nullif(value, '')::int, 0) as cnt
    from jsonb_each_text(coalesce(v_goals->'home', '{}'))
  loop
    for i in 1..least(greatest(0, v_rec.cnt), 20) loop
      insert into match_events (match_id, team_id, scorer_id, minute)
      values (p_match_id, v_match.home_team_id, v_rec.key::uuid, 0);
    end loop;
  end loop;
  for v_rec in select key, coalesce(nullif(value, '')::int, 0) as cnt
    from jsonb_each_text(coalesce(v_goals->'away', '{}'))
  loop
    for i in 1..least(greatest(0, v_rec.cnt), 20) loop
      insert into match_events (match_id, team_id, scorer_id, minute)
      values (p_match_id, v_match.away_team_id, v_rec.key::uuid, 0);
    end loop;
  end loop;

  -- Update match
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

  -- Apply new stats
  perform apply_match_stats(p_match_id);

  return v_match;
end;
$$;
