-- ═══════════════════════════════════════════════════════════════════
--  Seed dummy data for a tournament (8 teams, groups, matches, scorers)
--
--  Option 1 — SQL Editor: Replace YOUR-TOURNAMENT-ID below, then run in
--  Supabase Dashboard > SQL Editor.
--
--  Option 2 — CLI: npm run seed:tournament -- YOUR-TOURNAMENT-ID
--  (requires POSTGRES_URL in .env.local; use node --env-file=.env.local
--  if env not loaded)
--
--  Prerequisites: seed_v2.sql, migration 20260302000023
-- ═══════════════════════════════════════════════════════════════════

SELECT seed_tournament_dummy_data('YOUR-TOURNAMENT-ID'::uuid);
