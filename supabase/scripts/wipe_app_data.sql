-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Wipe App Data (Preserve Users)
--  Deletes all app data in correct FK order. Keeps auth.users and profiles.
--  Run before seed.sql for a fresh environment with existing users intact.
--  Prerequisite: migrations applied (supabase db push)
-- ═══════════════════════════════════════════════════════════════════

-- Order matters: delete children before parents (respecting FKs)
DELETE FROM notifications;
DELETE FROM match_events;
DELETE FROM match_lineups;
DELETE FROM match_proposals;
DELETE FROM tournament_matches;
DELETE FROM tournament_groups;
DELETE FROM tournament_registrations;
DELETE FROM tournaments;
DELETE FROM matches;
DELETE FROM team_members;
DELETE FROM teams;
DELETE FROM owner_applications;
