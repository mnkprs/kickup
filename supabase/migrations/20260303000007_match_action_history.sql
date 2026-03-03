-- KICKUP — Match action history
-- Log score submissions (captain, admin, organizer) for audit trail under match details.

-- 1. Create match_action_history table
create table match_action_history (
  id          uuid        primary key default gen_random_uuid(),
  match_id    uuid        not null references matches(id) on delete cascade,
  actor_id    uuid        references profiles(id) on delete set null,
  actor_type  text        not null check (actor_type in ('captain', 'admin', 'organizer')),
  score_home  int         not null check (score_home >= 0),
  score_away  int         not null check (score_away >= 0),
  created_at  timestamptz not null default now()
);

create index match_action_history_match_idx on match_action_history (match_id);
create index match_action_history_created_idx on match_action_history (match_id, created_at desc);

comment on table match_action_history is 'Audit log of score submissions per match (captain, admin, organizer)';

alter table match_action_history enable row level security;

-- Public read (matches are public; history is shown on match detail)
create policy "match_action_history_select_public"
  on match_action_history for select using (true);

-- Inserts done only by SECURITY DEFINER functions (submit_result, admin_update_match_result, organizer_submit_result)

-- 2. Update submit_result: log captain submission
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
  v_match  matches%rowtype;
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
      home_score_submit     = p_home_score,
      home_away_score_submit = p_away_score,
      home_result_status    = 'confirmed',
      mvp_id                = coalesce(p_mvp_id, mvp_id),
      notes                 = coalesce(p_notes, notes),
      pending_home_goals    = coalesce(p_goals, '{}')
    where id = p_match_id
    returning * into v_match;
  else
    update matches set
      away_home_score_submit = p_home_score,
      away_score_submit     = p_away_score,
      away_result_status    = 'confirmed',
      mvp_id                = coalesce(p_mvp_id, mvp_id),
      notes                 = coalesce(p_notes, notes),
      pending_away_goals    = coalesce(p_goals, '{}')
    where id = p_match_id
    returning * into v_match;
  end if;

  insert into match_action_history (match_id, actor_id, actor_type, score_home, score_away)
  values (p_match_id, auth.uid(), 'captain', p_home_score, p_away_score);

  return v_match;
end;
$$;

-- 3. Update admin_update_match_result: log admin submission
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

  insert into match_action_history (match_id, actor_id, actor_type, score_home, score_away)
  values (p_match_id, auth.uid(), 'admin', p_home_score, p_away_score);

  perform apply_match_stats(p_match_id);

  return v_match;
end;
$$;

-- 4. Update organizer_submit_result: log organizer submission
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

  insert into match_action_history (match_id, actor_id, actor_type, score_home, score_away)
  values (p_match_id, auth.uid(), 'organizer', p_home_score, p_away_score);

  return v_match;
end;
$$;
