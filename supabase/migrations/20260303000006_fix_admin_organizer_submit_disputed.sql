-- KICKUP — Fix admin/organizer submit incorrectly setting disputed
-- When admin or organizer submits a score, we set home_result_status and away_result_status
-- to 'confirmed', which fires resolve_match_result. The trigger compares:
--   home_score_submit vs away_home_score_submit
--   home_away_score_submit vs away_score_submit
-- We were only setting home_score_submit and away_score_submit, leaving the other two NULL.
-- The trigger saw NULL vs value as "disagree" and set status = 'disputed'.
-- Fix: set all four submit columns so the trigger sees agreement and keeps status = 'completed'.

-- 1. Fix admin_update_match_result
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

  if v_was_done then
    perform revert_match_stats(p_match_id);
  end if;

  delete from match_events where match_id = p_match_id;

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

  -- Set all four submit columns so resolve_match_result trigger sees agreement
  update matches set
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
  where id = p_match_id
  returning * into v_match;

  perform apply_match_stats(p_match_id);

  return v_match;
end;
$$;

-- 2. Fix organizer_submit_result
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
  v_match      matches%rowtype;
  v_home_goals jsonb;
  v_away_goals jsonb;
  v_rec        record;
  i            int;
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

  if v_match.status = 'disputed' then
    delete from match_events where match_id = p_match_id;
  end if;

  v_home_goals := coalesce(p_goals->'home', '{}');
  v_away_goals := coalesce(p_goals->'away', '{}');

  for v_rec in select key, coalesce(nullif(value, '')::int, 0) as cnt
    from jsonb_each_text(v_home_goals)
  loop
    for i in 1..least(greatest(0, v_rec.cnt), 20) loop
      insert into match_events (match_id, team_id, scorer_id, minute)
      values (p_match_id, v_match.home_team_id, v_rec.key::uuid, 0);
    end loop;
  end loop;

  for v_rec in select key, coalesce(nullif(value, '')::int, 0) as cnt
    from jsonb_each_text(v_away_goals)
  loop
    for i in 1..least(greatest(0, v_rec.cnt), 20) loop
      insert into match_events (match_id, team_id, scorer_id, minute)
      values (p_match_id, v_match.away_team_id, v_rec.key::uuid, 0);
    end loop;
  end loop;

  -- Set all four submit columns so resolve_match_result trigger sees agreement
  update matches set
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
  where id = p_match_id
  returning * into v_match;

  return v_match;
end;
$$;
