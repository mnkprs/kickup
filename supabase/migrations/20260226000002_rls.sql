-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Row-Level Security Policies
--  Migration 002
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS on every table
alter table profiles          enable row level security;
alter table teams             enable row level security;
alter table team_members      enable row level security;
alter table matches           enable row level security;
alter table match_proposals   enable row level security;
alter table match_lineups     enable row level security;
alter table match_events      enable row level security;
alter table notifications     enable row level security;

-- ─── HELPER: is the current user a member of a team? ──────────────
create or replace function is_team_member(p_team_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from team_members
    where team_id = p_team_id and player_id = auth.uid()
  );
$$;

-- is the current user a captain of a team?
create or replace function is_team_captain(p_team_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from team_members
    where team_id = p_team_id and player_id = auth.uid() and role = 'captain'
  );
$$;

-- is the current user involved in a match (either team)?
create or replace function is_match_participant(p_match_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from matches m
    where m.id = p_match_id
      and (is_team_member(m.home_team_id) or is_team_member(m.away_team_id))
  );
$$;

-- ─── PROFILES ─────────────────────────────────────────────────────
-- Anyone (even anon) can read profiles (public leaderboard / discover)
create policy "profiles_select_public"
  on profiles for select using (true);

-- Only the owner can update their own profile
create policy "profiles_update_own"
  on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Insert handled by trigger — block direct inserts
create policy "profiles_insert_trigger_only"
  on profiles for insert with check (auth.uid() = id);

-- ─── TEAMS ────────────────────────────────────────────────────────
-- Everyone can browse teams
create policy "teams_select_public"
  on teams for select using (true);

-- Any authenticated user can create a team
create policy "teams_insert_authenticated"
  on teams for insert with check (auth.uid() is not null);

-- Only a captain of the team can update it
create policy "teams_update_captain"
  on teams for update using (is_team_captain(id)) with check (is_team_captain(id));

-- Only a captain can delete
create policy "teams_delete_captain"
  on teams for delete using (is_team_captain(id));

-- ─── TEAM MEMBERS ─────────────────────────────────────────────────
-- Public read (to show rosters)
create policy "team_members_select_public"
  on team_members for select using (true);

-- Captain can add/remove members
create policy "team_members_insert_captain"
  on team_members for insert with check (is_team_captain(team_id));

create policy "team_members_delete_captain_or_self"
  on team_members for delete using (
    is_team_captain(team_id) or player_id = auth.uid()
  );

-- ─── MATCHES ──────────────────────────────────────────────────────
-- Anyone can view matches (public feed)
create policy "matches_select_public"
  on matches for select using (true);

-- A team captain can create a match challenge
create policy "matches_insert_captain"
  on matches for insert with check (
    is_team_captain(home_team_id) or is_team_captain(away_team_id)
  );

-- Only team captains involved in the match can update it
create policy "matches_update_participant_captain"
  on matches for update using (
    is_team_captain(home_team_id) or is_team_captain(away_team_id)
  );

-- ─── MATCH PROPOSALS ──────────────────────────────────────────────
-- Participants can see proposals for their match
create policy "match_proposals_select_participant"
  on match_proposals for select using (is_match_participant(match_id));

-- Captains of either team can propose
create policy "match_proposals_insert_captain"
  on match_proposals for insert with check (
    exists (
      select 1 from matches m
      where m.id = match_id
        and (is_team_captain(m.home_team_id) or is_team_captain(m.away_team_id))
    )
  );

-- Only the proposing team's captain can delete their proposal
create policy "match_proposals_delete_own"
  on match_proposals for delete using (is_team_captain(proposed_by_team_id));

-- ─── MATCH LINEUPS ────────────────────────────────────────────────
create policy "match_lineups_select_public"
  on match_lineups for select using (true);

create policy "match_lineups_insert_captain"
  on match_lineups for insert with check (
    exists (
      select 1 from matches m
      where m.id = match_id
        and (is_team_captain(m.home_team_id) or is_team_captain(m.away_team_id))
    )
  );

create policy "match_lineups_delete_captain"
  on match_lineups for delete using (is_team_captain(team_id));

-- ─── MATCH EVENTS ─────────────────────────────────────────────────
-- Public read (stats / top scorers)
create policy "match_events_select_public"
  on match_events for select using (true);

-- Any match participant captain can insert events
create policy "match_events_insert_captain"
  on match_events for insert with check (
    exists (
      select 1 from matches m
      where m.id = match_id
        and (is_team_captain(m.home_team_id) or is_team_captain(m.away_team_id))
    )
  );

-- ─── NOTIFICATIONS ────────────────────────────────────────────────
-- Users can only see their own notifications
create policy "notifications_select_own"
  on notifications for select using (user_id = auth.uid());

-- Notifications are inserted by server-side functions (security definer)
-- so we block direct inserts from the client
create policy "notifications_insert_blocked"
  on notifications for insert with check (false);

-- Users can mark their own as read (update only the `read` column)
create policy "notifications_update_own"
  on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── REALTIME ─────────────────────────────────────────────────────
-- Enable realtime for tables users care about
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table match_proposals;
