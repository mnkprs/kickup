-- Migration 029: propose_match_time RPC
-- Captains propose date/time/location; opponent must accept for it to become final.

create or replace function propose_match_time(
  p_match_id         uuid,
  p_team_id          uuid,
  p_proposed_date    date,
  p_proposed_time    time,
  p_location         text
)
returns match_proposals language plpgsql security definer set search_path = public as $$
declare
  v_match    matches%rowtype;
  v_proposal match_proposals%rowtype;
  v_opponent_team_id uuid;
  v_team_name text;
begin
  if not is_team_captain(p_team_id) then
    raise exception 'Only a team captain can propose a date and time';
  end if;

  select * into v_match from matches where id = p_match_id;
  if not found then raise exception 'Match not found'; end if;
  if v_match.status <> 'scheduling' then
    raise exception 'Match is not in scheduling phase';
  end if;

  if v_match.home_team_id <> p_team_id and v_match.away_team_id <> p_team_id then
    raise exception 'Your team is not part of this match';
  end if;

  select name into v_team_name from teams where id = p_team_id;

  insert into match_proposals (match_id, proposed_by_team_id, proposed_date, proposed_time, location)
  values (p_match_id, p_team_id, p_proposed_date, p_proposed_time, p_location)
  returning * into v_proposal;

  -- Notify opponent captains
  v_opponent_team_id := case when v_match.home_team_id = p_team_id then v_match.away_team_id else v_match.home_team_id end;

  insert into notifications (user_id, type, title, body, match_id, team_id)
  select
    tm.player_id,
    'scheduling',
    'New time slot proposed',
    v_team_name || ' propose ' || to_char(p_proposed_date, 'fmDD Mon') || ' @ ' || to_char(p_proposed_time, 'HH24:MI') || ' – ' || p_location || '.',
    p_match_id,
    p_team_id
  from team_members tm
  where tm.team_id = v_opponent_team_id and tm.role = 'captain' and tm.status = 'active';

  return v_proposal;
end;
$$;

grant execute on function propose_match_time to authenticated;
