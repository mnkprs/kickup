-- ═══════════════════════════════════════════════════════════════════
--  Full dummy data for tournament cfa215c6-af0c-4c0b-85d8-4e794764a9bb
--  Creates: registrations, groups, matches, lineups, scorers.
--  Run in Supabase SQL Editor (Dashboard > SQL Editor).
--
--  Prerequisites: Run seed_v2.sql first (or have 8 teams with players).
--  Also run migration 20260302000021 to fix the "upper bound" error.
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_tournament_id uuid := 'cfa215c6-af0c-4c0b-85d8-4e794764a9bb';
  v_organizer_id uuid;
  v_match_format text;
  v_match_id uuid;
  v_match_order int := 0;
  -- Team IDs (seed_v2: teams 1-8)
  v_teams uuid[] := ARRAY[
    '00000000-0000-0000-0001-000000000001'::uuid,
    '00000000-0000-0000-0001-000000000002'::uuid,
    '00000000-0000-0000-0001-000000000003'::uuid,
    '00000000-0000-0000-0001-000000000004'::uuid,
    '00000000-0000-0000-0001-000000000005'::uuid,
    '00000000-0000-0000-0001-000000000006'::uuid,
    '00000000-0000-0000-0001-000000000007'::uuid,
    '00000000-0000-0000-0001-000000000008'::uuid
  ];
  -- Round-robin pairs: (home_idx, away_idx) for Group A then B
  v_pairs int[][] := ARRAY[
    ARRAY[1,2], ARRAY[3,4], ARRAY[1,3], ARRAY[2,4], ARRAY[1,4], ARRAY[2,3],
    ARRAY[5,6], ARRAY[7,8], ARRAY[5,7], ARRAY[6,8], ARRAY[5,8], ARRAY[6,7]
  ];
  v_scores int[][] := ARRAY[
    ARRAY[2,1], ARRAY[2,0], ARRAY[3,0], ARRAY[2,1], ARRAY[4,0], ARRAY[1,0],
    ARRAY[2,1], ARRAY[2,0], ARRAY[3,0], ARRAY[2,1], ARRAY[4,0], ARRAY[1,0]
  ];
  v_group_labels text[] := ARRAY['A','A','A','A','A','A','B','B','B','B','B','B'];
  v_i int;
  v_home_id uuid;
  v_away_id uuid;
BEGIN
  -- Get tournament
  SELECT organizer_id, match_format::text INTO v_organizer_id, v_match_format
  FROM tournaments WHERE id = v_tournament_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament % not found', v_tournament_id;
  END IF;

  -- Clear existing tournament data
  DELETE FROM tournament_matches WHERE tournament_id = v_tournament_id;
  DELETE FROM matches WHERE id IN (
    SELECT m.id FROM matches m
    WHERE NOT EXISTS (SELECT 1 FROM tournament_matches tm WHERE tm.match_id = m.id)
    AND m.created_by = v_organizer_id
  );
  -- Re-delete tournament_matches (already done) and delete orphaned matches
  -- Simpler: delete matches that we'll recreate. We don't have them yet. Skip.
  DELETE FROM tournament_groups WHERE tournament_id = v_tournament_id;
  DELETE FROM tournament_registrations WHERE tournament_id = v_tournament_id;

  -- Registrations (approved)
  FOR v_i IN 1..8 LOOP
    INSERT INTO tournament_registrations (tournament_id, team_id, status)
    VALUES (v_tournament_id, v_teams[v_i], 'approved')
    ON CONFLICT (tournament_id, team_id) DO UPDATE SET status = 'approved';
  END LOOP;

  -- Groups: A = t1-t4, B = t5-t8
  INSERT INTO tournament_groups (tournament_id, team_id, group_label) VALUES
    (v_tournament_id, v_teams[1], 'A'), (v_tournament_id, v_teams[2], 'A'),
    (v_tournament_id, v_teams[3], 'A'), (v_tournament_id, v_teams[4], 'A'),
    (v_tournament_id, v_teams[5], 'B'), (v_tournament_id, v_teams[6], 'B'),
    (v_tournament_id, v_teams[7], 'B'), (v_tournament_id, v_teams[8], 'B')
  ON CONFLICT (tournament_id, team_id) DO UPDATE SET group_label = EXCLUDED.group_label;

  -- Matches + tournament_matches
  FOR v_i IN 1..12 LOOP
    v_home_id := v_teams[v_pairs[v_i][1]];
    v_away_id := v_teams[v_pairs[v_i][2]];
    v_match_order := v_i;

    INSERT INTO matches (home_team_id, away_team_id, format, status, created_by, home_score, away_score)
    VALUES (v_home_id, v_away_id, v_match_format::match_format, 'completed', v_organizer_id, v_scores[v_i][1], v_scores[v_i][2])
    RETURNING id INTO v_match_id;

    INSERT INTO tournament_matches (tournament_id, match_id, stage, group_label, match_order)
    VALUES (v_tournament_id, v_match_id, 'group', v_group_labels[v_i], v_match_order);
  END LOOP;

  -- Tournament status
  UPDATE tournaments SET status = 'group_stage' WHERE id = v_tournament_id;
END $$;

-- ─── Match lineups (7 players per team for 7v7) ───────────────────
DO $$
DECLARE
  v_tournament_id uuid := 'cfa215c6-af0c-4c0b-85d8-4e794764a9bb';
  -- match_id, home_team_idx, away_team_idx
  v_match_teams int[][] := ARRAY[
    ARRAY[1,1,2], ARRAY[2,3,4], ARRAY[3,1,3], ARRAY[4,2,4], ARRAY[5,1,4], ARRAY[6,2,3],
    ARRAY[7,5,6], ARRAY[8,7,8], ARRAY[9,5,7], ARRAY[10,6,8], ARRAY[11,5,8], ARRAY[12,6,7]
  ];
  v_starts int[] := ARRAY[1,8,15,22,29,36,43,50];
  v_counts int[] := ARRAY[7,7,7,7,7,7,7,7];
  v_match record;
  v_team_id uuid;
  v_player_id uuid;
  v_tidx int;
  v_p_start int;
  v_p_n int;
  v_j int;
BEGIN
  FOR v_match IN
    SELECT tm.match_id, tm.match_order
    FROM tournament_matches tm
    WHERE tm.tournament_id = v_tournament_id AND tm.stage = 'group'
    ORDER BY tm.match_order
  LOOP
    FOR v_j IN 1..2 LOOP
      v_tidx := v_match_teams[v_match.match_order][v_j + 1];
      v_team_id := ('00000000-0000-0000-0001-' || lpad(v_tidx::text, 12, '0'))::uuid;
      v_p_start := v_starts[v_tidx];
      v_p_n := v_counts[v_tidx];
      FOR v_j IN 0..(v_p_n - 1) LOOP
        v_player_id := ('00000000-0000-0000-0000-' || lpad((v_p_start + v_j)::text, 12, '0'))::uuid;
        INSERT INTO match_lineups (match_id, team_id, player_id)
        VALUES (v_match.match_id, v_team_id, v_player_id)
        ON CONFLICT (match_id, player_id) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- Fix: inner loop variable v_j conflicts. Use different var.
-- Actually the inner FOR v_j shadows the outer. Let me use v_k for inner.
-- Wait, we have two nested loops - outer is FOR v_match, then FOR v_j IN 1..2 (side), then FOR v_j IN 0..(v_p_n-1). The inner v_j would overwrite. Let me fix.
-- Actually in plpgsql the inner loop variable shadows. So when we're in the inner loop, v_j is 0,1,2... and we're trying to use it for "side" in the outer. Let me use v_side and v_k.
-- I need to fix the lineup logic. We have:
-- FOR each match
--   FOR side 1 (home) and 2 (away)
--     get team_id from v_match_teams[match_order][side+1]
--     FOR each player in that team
--       insert lineup
-- The inner loop var needs to be different. Let me use v_side and v_p.
</think>
Fixing the lineup block — inner loop variable conflict:
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
StrReplace