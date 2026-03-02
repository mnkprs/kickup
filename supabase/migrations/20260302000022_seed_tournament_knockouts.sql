-- One-off seed: dummy data for tournament cfa215c6-af0c-4c0b-85d8-4e794764a9bb
-- Safe to run: uses DO blocks, skips if tournament not found.

DO $$
DECLARE
  v_tournament_id uuid := 'cfa215c6-af0c-4c0b-85d8-4e794764a9bb';
  v_organizer_id uuid;
  v_match_format text;
  v_match_id uuid;
  v_match_order int := 0;
  v_teams uuid[] := ARRAY[
    '00000000-0000-0000-0001-000000000001'::uuid, '00000000-0000-0000-0001-000000000002'::uuid,
    '00000000-0000-0000-0001-000000000003'::uuid, '00000000-0000-0000-0001-000000000004'::uuid,
    '00000000-0000-0000-0001-000000000005'::uuid, '00000000-0000-0000-0001-000000000006'::uuid,
    '00000000-0000-0000-0001-000000000007'::uuid, '00000000-0000-0000-0001-000000000008'::uuid
  ];
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
  SELECT organizer_id, match_format::text INTO v_organizer_id, v_match_format
  FROM tournaments WHERE id = v_tournament_id;
  IF NOT FOUND THEN RETURN; END IF;

  DELETE FROM matches WHERE id IN (
    SELECT match_id FROM tournament_matches WHERE tournament_id = v_tournament_id
  );
  DELETE FROM tournament_groups WHERE tournament_id = v_tournament_id;
  DELETE FROM tournament_registrations WHERE tournament_id = v_tournament_id;

  FOR v_i IN 1..8 LOOP
    INSERT INTO tournament_registrations (tournament_id, team_id, status)
    VALUES (v_tournament_id, v_teams[v_i], 'approved')
    ON CONFLICT (tournament_id, team_id) DO UPDATE SET status = 'approved';
  END LOOP;

  INSERT INTO tournament_groups (tournament_id, team_id, group_label) VALUES
    (v_tournament_id, v_teams[1], 'A'), (v_tournament_id, v_teams[2], 'A'),
    (v_tournament_id, v_teams[3], 'A'), (v_tournament_id, v_teams[4], 'A'),
    (v_tournament_id, v_teams[5], 'B'), (v_tournament_id, v_teams[6], 'B'),
    (v_tournament_id, v_teams[7], 'B'), (v_tournament_id, v_teams[8], 'B')
  ON CONFLICT (tournament_id, team_id) DO UPDATE SET group_label = EXCLUDED.group_label;

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

  UPDATE tournaments SET status = 'group_stage' WHERE id = v_tournament_id;
END $$;

DO $$
DECLARE
  v_tournament_id uuid := 'cfa215c6-af0c-4c0b-85d8-4e794764a9bb';
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
  v_side int;
  v_p int;
BEGIN
  FOR v_match IN
    SELECT tm.match_id, tm.match_order FROM tournament_matches tm
    WHERE tm.tournament_id = v_tournament_id AND tm.stage = 'group' ORDER BY tm.match_order
  LOOP
    FOR v_side IN 1..2 LOOP
      v_tidx := v_match_teams[v_match.match_order][v_side + 1];
      v_team_id := ('00000000-0000-0000-0001-' || lpad(v_tidx::text, 12, '0'))::uuid;
      v_p_start := v_starts[v_tidx];
      v_p_n := v_counts[v_tidx];
      FOR v_p IN 0..(v_p_n - 1) LOOP
        v_player_id := ('00000000-0000-0000-0000-' || lpad((v_p_start + v_p)::text, 12, '0'))::uuid;
        INSERT INTO match_lineups (match_id, team_id, player_id)
        VALUES (v_match.match_id, v_team_id, v_player_id)
        ON CONFLICT (match_id, player_id) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

DO $$
DECLARE
  v_tournament_id uuid := 'cfa215c6-af0c-4c0b-85d8-4e794764a9bb';
  v_events jsonb := '[
    {"h":[[1,12],[6,34]],"a":[[14,55]]},{"h":[[16,23],[21,58]],"a":[]},
    {"h":[[1,7],[6,51],[2,78]],"a":[]},{"h":[[11,9],[14,37],[11,70]],"a":[[25,43]]},
    {"h":[[1,7],[1,29],[6,51],[2,78]],"a":[]},{"h":[[14,26]],"a":[[15,14],[21,63]]},
    {"h":[[31,55],[35,79]],"a":[[36,22]]},{"h":[[44,33],[49,61]],"a":[]},
    {"h":[[29,19],[35,68],[31,79]],"a":[]},{"h":[[36,22],[40,65]],"a":[[51,48]]},
    {"h":[[31,15],[35,44],[29,79]],"a":[]},{"h":[[36,28]],"a":[]}
  ]'::jsonb;
  v_match record;
  v_ev jsonb;
  v_goal jsonb;
  v_team_id uuid;
  v_scorer_id uuid;
  v_minute int;
BEGIN
  FOR v_match IN
    SELECT tm.match_id, tm.match_order, m.home_team_id, m.away_team_id
    FROM tournament_matches tm JOIN matches m ON m.id = tm.match_id
    WHERE tm.tournament_id = v_tournament_id AND tm.stage = 'group' ORDER BY tm.match_order
  LOOP
    v_ev := v_events->(v_match.match_order - 1);
    FOR v_goal IN SELECT * FROM jsonb_array_elements(v_ev->'h')
    LOOP
      v_team_id := v_match.home_team_id;
      v_minute := (v_goal->>1)::int;
      v_scorer_id := ('00000000-0000-0000-0000-' || lpad((v_goal->>0)::text, 12, '0'))::uuid;
      INSERT INTO match_events (match_id, team_id, scorer_id, minute)
      VALUES (v_match.match_id, v_team_id, v_scorer_id, v_minute);
    END LOOP;
    FOR v_goal IN SELECT * FROM jsonb_array_elements(v_ev->'a')
    LOOP
      v_team_id := v_match.away_team_id;
      v_minute := (v_goal->>1)::int;
      v_scorer_id := ('00000000-0000-0000-0000-' || lpad((v_goal->>0)::text, 12, '0'))::uuid;
      INSERT INTO match_events (match_id, team_id, scorer_id, minute)
      VALUES (v_match.match_id, v_team_id, v_scorer_id, v_minute);
    END LOOP;
  END LOOP;
END $$;
