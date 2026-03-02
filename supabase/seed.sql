-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Seed Data
--  Run automatically by: supabase db reset
--  Mirrors the mockData.ts so the UI looks populated on first boot.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Seed auth users (local dev only) ─────────────────────────────
-- Password for all seed users: "kickup123"
-- supabase start creates these in the auth schema via the GoTrue API,
-- but for migrations we insert directly into auth.users.

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  (
    '11111111-0001-0001-0001-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'nikos@kickup.app',
    crypt('kickup123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Nikos Papadopoulos","position":"FWD","area":"Kolonaki","avatar_color":"#2E7D32"}',
    false, 'authenticated', 'authenticated',
    '', '', '', ''
  ),
  (
    '11111111-0002-0002-0002-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'giorgos@kickup.app',
    crypt('kickup123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Giorgos Stavros","position":"GK","area":"Piraeus","avatar_color":"#1565C0"}',
    false, 'authenticated', 'authenticated',
    '', '', '', ''
  ),
  (
    '11111111-0003-0003-0003-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'alexis@kickup.app',
    crypt('kickup123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Alexis Dimos","position":"MID","area":"Exarcheia","avatar_color":"#6A1B9A"}',
    false, 'authenticated', 'authenticated',
    '', '', '', ''
  ),
  (
    '11111111-0004-0004-0004-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'kostas@kickup.app',
    crypt('kickup123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Kostas Nikolaou","position":"DEF","area":"Glyfada","avatar_color":"#BF360C"}',
    false, 'authenticated', 'authenticated',
    '', '', '', ''
  ),
  (
    '11111111-0005-0005-0005-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'yiannis@kickup.app',
    crypt('kickup123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Yiannis Tzanakis","position":"MID","area":"Kifisia","avatar_color":"#E65100"}',
    false, 'authenticated', 'authenticated',
    '', '', '', ''
  ),
  (
    '11111111-0006-0006-0006-000000000006',
    '00000000-0000-0000-0000-000000000000',
    'spyros@kickup.app',
    crypt('kickup123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Spyros Athanasiou","position":"FWD","area":"Pangrati","avatar_color":"#00695C"}',
    false, 'authenticated', 'authenticated',
    '', '', '', ''
  ),
  (
    '11111111-0007-0007-0007-000000000007',
    '00000000-0000-0000-0000-000000000000',
    'christos@kickup.app',
    crypt('kickup123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Christos Melas","position":"GK","area":"Nea Smyrni","avatar_color":"#37474F"}',
    false, 'authenticated', 'authenticated',
    '', '', '', ''
  ),
  (
    '11111111-0008-0008-0008-000000000008',
    '00000000-0000-0000-0000-000000000000',
    'petros@kickup.app',
    crypt('kickup123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Petros Katsaros","position":"DEF","area":"Chalandri","avatar_color":"#558B2F"}',
    false, 'authenticated', 'authenticated',
    '', '', '', ''
  )
on conflict (id) do nothing;

-- Profiles are auto-created by the trigger above.
-- But since we're seeding, we also set extra fields the trigger doesn't handle.
update profiles set
  bio           = 'Striker with a nose for goal. Left foot wizard. Free on weekends.',
  stat_matches  = 42, stat_goals = 28, stat_wins = 24, stat_mvp = 5
where id = '11111111-0001-0001-0001-000000000001';

update profiles set
  bio           = 'Shot-stopper since 2012. Captain of Piraeus Pirates. Organizer.',
  stat_matches  = 55, stat_goals = 0, stat_wins = 30, stat_mvp = 8
where id = '11111111-0002-0002-0002-000000000002';

update profiles set
  bio           = 'Box-to-box midfielder. Vision and stamina. Weekly 5-a-side veteran.',
  stat_matches  = 38, stat_goals = 9, stat_wins = 18, stat_mvp = 4
where id = '11111111-0003-0003-0003-000000000003';

update profiles set
  bio           = 'Centre-back. Reads the game well. Tall and aggressive in the air.',
  stat_matches  = 29, stat_goals = 3, stat_wins = 17, stat_mvp = 2
where id = '11111111-0004-0004-0004-000000000004';

update profiles set
  bio              = 'Freelancer. Available every Saturday. Quick with good technique.',
  is_freelancer    = true,
  freelancer_until = '2026-03-01',
  stat_matches     = 61, stat_goals = 14, stat_wins = 35, stat_mvp = 7
where id = '11111111-0005-0005-0005-000000000005';

update profiles set
  bio              = 'Tricky winger. Fast and direct. Looking for a 5v5 team.',
  is_freelancer    = true,
  freelancer_until = '2026-03-02',
  stat_matches     = 22, stat_goals = 18, stat_wins = 12, stat_mvp = 3
where id = '11111111-0006-0006-0006-000000000006';

update profiles set
  bio              = 'Experienced keeper. Good with feet too. Free agent since Jan.',
  is_freelancer    = true,
  stat_matches     = 47, stat_goals = 0, stat_wins = 28, stat_mvp = 9
where id = '11111111-0007-0007-0007-000000000007';

update profiles set
  bio           = 'Solid left back. Set-piece delivery specialist.',
  stat_matches  = 33, stat_goals = 4, stat_wins = 20, stat_mvp = 1
where id = '11111111-0008-0008-0008-000000000008';

-- ─── TEAMS ────────────────────────────────────────────────────────
insert into teams (id, name, short_name, area, format, emoji, color, banner_url, description, open_spots, searching_for_opponent, record_w, record_d, record_l, record_gf, record_ga, created_by)
values
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Kolonaki Kings',    'KKG', 'Kolonaki',  '5v5',  '👑', '#2E7D32', 'https://images.unsplash.com/photo-1601788505117-18947ac4f2e6?w=800&q=80', 'The original Kings of Kolonaki. We play hard, celebrate harder. Thursdays & Saturdays.', 1, true,  14, 3, 2, 54, 22, '11111111-0001-0001-0001-000000000001'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'Piraeus Pirates',   'PPR', 'Piraeus',   '7v7',  '⚡', '#1565C0', 'https://images.unsplash.com/photo-1764438246710-83c535cada80?w=800&q=80', 'Harbourside warriors. Any weather, any pitch. Just show up with boots.', 2, true,  9,  4, 6, 38, 31, '11111111-0002-0002-0002-000000000002'),
  ('aaaaaaaa-0003-0003-0003-000000000003', 'Glyfada Gladiators','GGL', 'Glyfada',   '6v6',  '🛡️','#BF360C', null,                                                                          'Coastal warriors. Beachside training, pitch-ready always.',                             0, false, 10, 3, 4, 44, 27, '11111111-0004-0004-0004-000000000004'),
  ('aaaaaaaa-0004-0004-0004-000000000004', 'Exarcheia United',  'EXU', 'Exarcheia', '5v5',  '✊', '#6A1B9A', null,                                                                          'Neighbourhood club. Everyone plays, everyone wins together.',                            2, true,  7,  5, 6, 29, 32, '11111111-0003-0003-0003-000000000003'),
  ('aaaaaaaa-0005-0005-0005-000000000005', 'Kifisia FC',        'KFC', 'Kifisia',   '7v7',  '🌿','#33691E', null,                                                                          'Northern Athens finest. Well-organized, technical play preferred.',                      3, true,  16, 3, 1, 62, 14, null),
  ('aaaaaaaa-0006-0006-0006-000000000006', 'Nea Smyrni Stars',  'NSS', 'Nea Smyrni','6v6',  '⭐', '#F9A825', null,                                                                          'Southern Athens crew. Playing every Sunday morning rain or shine.',                      0, false, 5,  7, 8, 25, 38, null),
  ('aaaaaaaa-0007-0007-0007-000000000007', 'Pangrati Panthers', 'PGP', 'Pangrati',  '5v5',  '🐆', '#4E342E', null,                                                                          'Fast and furious. The old-timers of Pangrati. Est. 2015.',                              1, true,  11, 4, 5, 47, 30, '11111111-0006-0006-0006-000000000006'),
  ('aaaaaaaa-0008-0008-0008-000000000008', 'Chalandri Chiefs',  'CHC', 'Chalandri', '8v8',  '🔥', '#B71C1C', null,                                                                          'Northeast Athens stronghold. Big pitch, big ambitions.',                                4, true,  6,  2, 7, 22, 30, '11111111-0008-0008-0008-000000000008')
on conflict (id) do nothing;

-- ─── TEAM MEMBERS ─────────────────────────────────────────────────
insert into team_members (team_id, player_id, role) values
  ('aaaaaaaa-0001-0001-0001-000000000001', '11111111-0001-0001-0001-000000000001', 'captain'),
  ('aaaaaaaa-0001-0001-0001-000000000001', '11111111-0004-0004-0004-000000000004', 'player'),
  ('aaaaaaaa-0002-0002-0002-000000000002', '11111111-0002-0002-0002-000000000002', 'captain'),
  ('aaaaaaaa-0003-0003-0003-000000000003', '11111111-0004-0004-0004-000000000004', 'captain'),
  ('aaaaaaaa-0004-0004-0004-000000000004', '11111111-0003-0003-0003-000000000003', 'captain'),
  ('aaaaaaaa-0007-0007-0007-000000000007', '11111111-0006-0006-0006-000000000006', 'captain'),
  ('aaaaaaaa-0008-0008-0008-000000000008', '11111111-0008-0008-0008-000000000008', 'captain')
on conflict (team_id, player_id) do nothing;

-- ─── MATCHES ──────────────────────────────────────────────────────
insert into matches (
  id, home_team_id, away_team_id, format, status,
  match_date, match_time, location, area,
  home_score, away_score, bet, notes, mvp_id
) values
  (
    'bbbbbbbb-0001-0001-0001-000000000001',
    'aaaaaaaa-0001-0001-0001-000000000001',
    'aaaaaaaa-0002-0002-0002-000000000002',
    '5v5', 'completed',
    '2026-02-12', '19:00', 'SEGAS Indoor, Kolonaki', 'Kolonaki',
    3, 1,
    'Losers buy souvlaki for the whole team!',
    'Dominant win. Defensive unit was solid.',
    '11111111-0001-0001-0001-000000000001'
  ),
  (
    'bbbbbbbb-0002-0002-0002-000000000002',
    'aaaaaaaa-0003-0003-0003-000000000003',
    'aaaaaaaa-0004-0004-0004-000000000004',
    '6v6', 'completed',
    '2026-02-10', '20:30', 'Glyfada Sports Center', 'Glyfada',
    2, 2,
    null, null,
    '11111111-0003-0003-0003-000000000003'
  ),
  (
    'bbbbbbbb-0003-0003-0003-000000000003',
    'aaaaaaaa-0001-0001-0001-000000000001',
    'aaaaaaaa-0005-0005-0005-000000000005',
    '5v5', 'pre_match',
    '2026-03-01', '18:00', 'SEGAS Indoor, Kolonaki', 'Kolonaki',
    null, null,
    'Losers buy coffee for winners',
    null, null
  ),
  (
    'bbbbbbbb-0004-0004-0004-000000000004',
    'aaaaaaaa-0002-0002-0002-000000000002',
    'aaaaaaaa-0007-0007-0007-000000000007',
    '7v7', 'scheduling',
    null, null, null, null,
    null, null, null, null, null
  ),
  (
    'bbbbbbbb-0005-0005-0005-000000000005',
    'aaaaaaaa-0004-0004-0004-000000000004',
    'aaaaaaaa-0008-0008-0008-000000000008',
    '5v5', 'pending_challenge',
    null, null, null, null,
    null, null, null, null, null
  ),
  (
    'bbbbbbbb-0006-0006-0006-000000000006',
    'aaaaaaaa-0005-0005-0005-000000000005',
    'aaaaaaaa-0006-0006-0006-000000000006',
    '7v7', 'completed',
    '2026-02-05', '17:00', 'Kifisia Sports Complex', 'Kifisia',
    5, 0,
    null, null, null
  ),
  (
    'bbbbbbbb-0007-0007-0007-000000000007',
    'aaaaaaaa-0003-0003-0003-000000000003',
    'aaaaaaaa-0001-0001-0001-000000000001',
    '6v6', 'disputed',
    '2026-02-15', null, null, null,
    null, null,
    null,
    'Score disagreement: Gladiators claim 3-2, Kings claim 2-3. Pending admin review.',
    null
  )
on conflict (id) do nothing;

-- ─── MATCH PROPOSALS ──────────────────────────────────────────────
insert into match_proposals (id, match_id, proposed_by_team_id, proposed_date, proposed_time, location, accepted)
values
  (
    'cccccccc-0001-0001-0001-000000000001',
    'bbbbbbbb-0004-0004-0004-000000000004',
    'aaaaaaaa-0002-0002-0002-000000000002',
    '2026-03-02', '19:00', 'Piraeus Municipal Field', false
  ),
  (
    'cccccccc-0002-0002-0002-000000000002',
    'bbbbbbbb-0004-0004-0004-000000000004',
    'aaaaaaaa-0007-0007-0007-000000000007',
    '2026-03-05', '20:00', 'Pangrati Synthetic Pitch', false
  ),
  (
    'cccccccc-0003-0003-0003-000000000003',
    'bbbbbbbb-0004-0004-0004-000000000004',
    'aaaaaaaa-0002-0002-0002-000000000002',
    '2026-03-07', '18:30', 'Piraeus Municipal Field', false
  )
on conflict (id) do nothing;

-- ─── MATCH LINEUPS ────────────────────────────────────────────────
insert into match_lineups (match_id, team_id, player_id)
values
  ('bbbbbbbb-0003-0003-0003-000000000003', 'aaaaaaaa-0001-0001-0001-000000000001', '11111111-0001-0001-0001-000000000001'),
  ('bbbbbbbb-0003-0003-0003-000000000003', 'aaaaaaaa-0001-0001-0001-000000000001', '11111111-0004-0004-0004-000000000004')
on conflict (match_id, player_id) do nothing;

-- ─── MATCH EVENTS (goals in completed matches) ────────────────────
insert into match_events (match_id, team_id, scorer_id, minute)
values
  -- m1: KKG 3-1 PPR
  ('bbbbbbbb-0001-0001-0001-000000000001', 'aaaaaaaa-0001-0001-0001-000000000001', '11111111-0001-0001-0001-000000000001', 12),
  ('bbbbbbbb-0001-0001-0001-000000000001', 'aaaaaaaa-0001-0001-0001-000000000001', '11111111-0001-0001-0001-000000000001', 31),
  ('bbbbbbbb-0001-0001-0001-000000000001', 'aaaaaaaa-0001-0001-0001-000000000001', '11111111-0004-0004-0004-000000000004', 44),
  -- m2: GGL 2-2 EXU
  ('bbbbbbbb-0002-0002-0002-000000000002', 'aaaaaaaa-0004-0004-0004-000000000004', '11111111-0003-0003-0003-000000000003', 20),
  ('bbbbbbbb-0002-0002-0002-000000000002', 'aaaaaaaa-0004-0004-0004-000000000004', '11111111-0003-0003-0003-000000000003', 38)
on conflict do nothing;

-- ─── NOTIFICATIONS ────────────────────────────────────────────────
-- Nikos (user 1) notifications
insert into notifications (id, user_id, type, title, body, read, team_id, match_id, avatar_emoji, avatar_color)
values
  (
    'dddddddd-0001-0001-0001-000000000001',
    '11111111-0001-0001-0001-000000000001',
    'challenge', 'Challenge received!',
    'Pangrati Panthers want to face Kolonaki Kings in a 5v5 match.',
    false,
    'aaaaaaaa-0007-0007-0007-000000000007', null,
    '🐆', '#4E342E'
  ),
  (
    'dddddddd-0002-0002-0002-000000000002',
    '11111111-0001-0001-0001-000000000001',
    'result_confirmed', 'Result confirmed ✅',
    'Kolonaki Kings 3 – 1 Piraeus Pirates. Match result agreed by both teams.',
    false,
    null, 'bbbbbbbb-0001-0001-0001-000000000001',
    '✅', '#2E7D32'
  ),
  (
    'dddddddd-0003-0003-0003-000000000003',
    '11111111-0001-0001-0001-000000000001',
    'scheduling', 'New time slot proposed',
    'Piraeus Pirates propose 7 Mar @ 18:30 – Piraeus Municipal Field.',
    false,
    null, 'bbbbbbbb-0004-0004-0004-000000000004',
    '⚡', '#1565C0'
  ),
  (
    'dddddddd-0004-0004-0004-000000000004',
    '11111111-0001-0001-0001-000000000001',
    'spot_applied', 'Player applied for open spot',
    'Spyros Athanasiou (FWD) applied to join Kolonaki Kings.',
    true,
    'aaaaaaaa-0001-0001-0001-000000000001', null,
    '🏃', '#00695C'
  ),
  (
    'dddddddd-0005-0005-0005-000000000005',
    '11111111-0001-0001-0001-000000000001',
    'bet_reminder', 'Bet reminder ☕',
    'Don''t forget: Piraeus Pirates owe souvlaki for the whole team!',
    true,
    null, 'bbbbbbbb-0001-0001-0001-000000000001',
    '🍖', '#E65100'
  ),
  (
    'dddddddd-0006-0006-0006-000000000006',
    '11111111-0001-0001-0001-000000000001',
    'match_reminder', 'Match in 2 days!',
    'Kolonaki Kings vs Kifisia FC — 1 Mar @ 18:00, SEGAS Indoor.',
    true,
    null, 'bbbbbbbb-0003-0003-0003-000000000003',
    '⚽', '#2E7D32'
  )
on conflict (id) do nothing;
