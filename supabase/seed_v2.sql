-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Fresh Environment Seed v2
--  Wipes all user data and inserts clean dummy data.
--  100 players · 10 teams (5v5/6v6/7v7) · 13 completed matches · 1 tournament
--  Password for all accounts: kickup123
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. WIPE ───────────────────────────────────────────────────────
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
DELETE FROM profiles;
DELETE FROM auth.users WHERE aud = 'authenticated';

-- ─── 2. AUTH USERS (DO block — 100 players) ───────────────────────
DO $$
DECLARE
  names      text[] := ARRAY[
    -- Team 1 – Kolonaki Kings 7v7 (p01-07)
    'Nikos Papadopoulos','Giorgos Athanasiou','Dimitris Karamanlis',
    'Kostas Petridis','Alexis Panagiotou','Stelios Kyriakidis','Yannis Tsoukalas',
    -- Team 2 – Piraeus Sharks 7v7 (p08-14)
    'Giorgos Stavridis','Manos Nikolaou','Tasos Giannakis',
    'Christos Bouras','Vasilis Karagiannis','Lefteris Antonopoulos','Spyros Sioutis',
    -- Team 3 – Athens Warriors 7v7 (p15-21)
    'Alexis Dimos','Thanos Theodorakis','Stratos Mavridis',
    'Makis Papadakis','Pantelis Galanis','Fotis Ziogas','Aris Tsakalidis',
    -- Team 4 – South Eagles 7v7 (p22-28)
    'Kostas Balasis','Petros Lamprou','Sakis Papanikolaou',
    'Takis Zacharopoulos','Miltos Hatzigiannakis','Andreas Deligiannis','Vangelis Manolas',
    -- Team 5 – North Stars 7v7 (p29-35)
    'Yannis Kontogiannis','Apostolis Vassilakis','Nikos Kolokythas',
    'Haris Triantafyllou','Giorgos Papageorgiou','Christos Kaklamanis','Dimitris Karanikolas',
    -- Team 6 – Pangrati FC 7v7 (p36-42)
    'Spyros Dimou','Stavros Alexiou','Manos Christopoulos',
    'Tasos Mitsos','Thanasis Vassilakis','Pavlos Giannakis','Vangelis Kyriakidis',
    -- Team 7 – Old City Wolves 7v7 (p43-49)
    'Petros Stavros','Nikos Athanasiou','Kostas Triantafyllou',
    'Giorgos Sioutis','Alexis Theodorakis','Miltos Lamprou','Takis Manolas',
    -- Team 8 – Southside United 7v7 (p50-56)
    'Yannis Papageorgiou','Haris Karagiannis','Christos Nikolaou',
    'Vasilis Dimos','Stratos Kontogiannis','Lefteris Kaklamanis','Sakis Panagiotou',
    -- Team 9 – Maroussi Strikers 5v5 (p57-61)
    'Aris Vassilakis','Fotis Petridis','Apostolis Bouras','Manos Tsakalidis','Stavros Ziogas',
    -- Team 10 – Kallithea FC 6v6 (p62-67)
    'Makis Papadopoulos','Thanos Galanis','Andreas Mavridis',
    'Ntelis Balasis','Giorgos Karanikolas','Petros Deligiannis',
    -- Freelancers (p68-100)
    'Spyros Theodoropoulos','Nikos Vamvakousis','Giorgos Mavroudis','Alexis Sourlas',
    'Dimitris Fountas','Kostas Skouloudelis','Yannis Metaxas','Petros Katsaros',
    'Stelios Panopoulos','Manos Konstantinou','Tasos Athanasiadis','Christos Papadimitriou',
    'Vasilis Sotiropoulos','Lefteris Ekonomou','Spyros Katsikis','Haris Skordas',
    'Giorgos Vrettakos','Nikos Mouratidis','Apostolis Oikonomou','Miltos Chatzipetros',
    'Takis Sarantidis','Pantelis Bampalis','Stratos Georgopoulos','Thanos Boukouvalas',
    'Makis Sideris','Andreas Raptis','Aris Kourelas','Fotis Douros',
    'Vangelis Stathis','Stavros Kapetanakis','Pavlos Nikopoulos','Yannis Mourtzis',
    'Christos Katsoulas'
  ];
  positions  text[] := ARRAY[
    'FWD','MID','DEF','GK','MID','FWD','DEF',   -- t1
    'GK','DEF','MID','FWD','MID','DEF','FWD',   -- t2
    'MID','FWD','DEF','GK','MID','DEF','FWD',   -- t3
    'GK','DEF','MID','FWD','DEF','MID','FWD',   -- t4
    'MID','DEF','FWD','GK','MID','DEF','FWD',   -- t5
    'FWD','GK','DEF','MID','FWD','DEF','MID',   -- t6
    'MID','FWD','DEF','GK','MID','DEF','FWD',   -- t7
    'DEF','FWD','MID','GK','DEF','FWD','MID',   -- t8
    'FWD','GK','DEF','MID','FWD',               -- t9
    'MID','DEF','FWD','GK','MID','DEF',         -- t10
    -- freelancers: varied
    'MID','FWD','DEF','GK','MID','FWD','DEF','MID',
    'GK','FWD','DEF','MID','FWD','DEF','GK','MID',
    'FWD','DEF','MID','GK','FWD','MID','DEF','FWD',
    'MID','DEF','FWD','GK','MID','FWD','DEF','MID',
    'FWD'
  ];
  areas      text[] := ARRAY[
    'Kolonaki','Kolonaki','Kolonaki','Syntagma','Plaka','Kolonaki','Monastiraki', -- t1
    'Piraeus','Piraeus','Piraeus','Nikaia','Keratsini','Piraeus','Koridallos',     -- t2
    'Exarcheia','Exarcheia','Omonia','Exarcheia','Omonia','Exarcheia','Exarcheia', -- t3
    'Glyfada','Glyfada','Voula','Glyfada','Alimos','Elliniko','Glyfada',          -- t4
    'Kifisia','Kifisia','Chalandri','Maroussi','Kifisia','Ekali','Vrilissia',      -- t5
    'Pangrati','Pangrati','Pangrati','Mets','Pangrati','Kaisariani','Vyronas',    -- t6
    'Monastiraki','Psyrri','Monastiraki','Thissio','Kerameikos','Monastiraki','Gazi', -- t7
    'Nea Smyrni','Nea Smyrni','Kallithea','Nea Smyrni','Agios Dimitrios','Nea Smyrni','Moschato', -- t8
    'Maroussi','Maroussi','Chalandri','Maroussi','Maroussi',                      -- t9
    'Kallithea','Kallithea','Nea Smyrni','Kallithea','Kallithea','Alimos',        -- t10
    -- freelancers
    'Zografou','Nea Ionia','Peristeri','Galatsi','Kifisia','Glyfada','Pangrati','Chalandri',
    'Exarcheia','Piraeus','Kolonaki','Maroussi','Nea Smyrni','Kallithea','Vyronas','Psyrri',
    'Thissio','Omonia','Kifisia','Glyfada','Exarcheia','Pangrati','Piraeus','Maroussi',
    'Nea Smyrni','Chalandri','Kolonaki','Galatsi','Zografou','Peristeri','Nea Ionia','Kifisia',
    'Glyfada'
  ];
  colors     text[] := ARRAY['#2E7D32','#1565C0','#6A1B9A','#E65100','#00695C','#BF360C','#37474F','#F9A825'];
  i int;
  uid uuid;
  pos_val text;
BEGIN
  FOR i IN 1..array_length(names, 1) LOOP
    uid := ('00000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid;
    pos_val := positions[i];
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      uid,
      '00000000-0000-0000-0000-000000000000',
      'player' || lpad(i::text, 3, '0') || '@kickup.app',
      crypt('kickup123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object(
        'full_name',    names[i],
        'position',     pos_val,
        'area',         areas[i],
        'avatar_color', colors[((i-1) % 8) + 1]
      )::jsonb,
      false, 'authenticated', 'authenticated',
      '', '', '', ''
    );
  END LOOP;
END$$;

-- ─── 3. ENRICH PROFILES ────────────────────────────────────────────
DO $$
DECLARE
  nationalities text[] := ARRAY['Greek','Greek','Greek','Greek','Greek','Greek','Greek','Greek','Greek','Greek'];
  i int;
  uid uuid;
  nat text;
  dob date;
  ht  int;
  ft  text;
  feet text[] := ARRAY['right','left','both','right','right','left','right','both'];
BEGIN
  FOR i IN 1..100 LOOP
    uid := ('00000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid;
    dob := (DATE '1985-01-01' + (((i * 137 + 41) % (365*15)))::int);  -- ages 24-39
    ht  := 165 + ((i * 7 + 3) % 25);  -- 165-189 cm
    ft  := feet[((i-1) % 8) + 1];
    UPDATE profiles SET
      nationality    = 'Greek',
      date_of_birth  = dob,
      height         = ht,
      preferred_foot = ft,
      bio            = CASE (i % 5)
        WHEN 0 THEN 'Passionate about the game. Looking for good competition.'
        WHEN 1 THEN 'Playing since childhood. Love attacking football.'
        WHEN 2 THEN 'Defensive midfielder who reads the game well.'
        WHEN 3 THEN 'Weekend warrior. Football is life.'
        ELSE 'Always give 100%. Team player first.'
      END
    WHERE id = uid;
  END LOOP;
END$$;

-- ─── 4. ADMIN + FREELANCERS ────────────────────────────────────────
-- p01 is admin
UPDATE profiles SET is_admin = true
WHERE id = '00000000-0000-0000-0000-000000000001';

-- p68-p100 are freelancers (available to join teams)
UPDATE profiles SET
  is_freelancer    = true,
  freelancer_until = CURRENT_DATE + 30
WHERE id IN (
  SELECT ('00000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid
  FROM generate_series(68, 100) AS i
);

-- ─── 5. TEAMS ──────────────────────────────────────────────────────
INSERT INTO teams (id, name, short_name, format, area, emoji, color, description, searching_for_opponent, created_by) VALUES
  ('00000000-0000-0000-0001-000000000001','Kolonaki Kings','KKI','7v7','Kolonaki','🦁','#2E7D32','Top 7v7 squad from Kolonaki. Technically sharp, tactically disciplined.',true,'00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0001-000000000002','Piraeus Sharks','PSH','7v7','Piraeus','🌊','#1565C0','Physical and direct. We press hard and score harder.',false,'00000000-0000-0000-0000-000000000008'),
  ('00000000-0000-0000-0001-000000000003','Athens Warriors','AWR','7v7','Exarcheia','🔥','#E65100','Street football roots, tournament ambitions.',true,'00000000-0000-0000-0000-000000000015'),
  ('00000000-0000-0000-0001-000000000004','South Eagles','SEA','7v7','Glyfada','🦅','#6A1B9A','South side pride. Fast wingers, solid defense.',false,'00000000-0000-0000-0000-000000000022'),
  ('00000000-0000-0000-0001-000000000005','North Stars','NST','7v7','Kifisia','⚡','#00695C','High-energy pressing game from the north suburbs.',true,'00000000-0000-0000-0000-000000000029'),
  ('00000000-0000-0000-0001-000000000006','Pangrati FC','PFC','7v7','Pangrati','🏹','#BF360C','Old school club with modern tactics.',false,'00000000-0000-0000-0000-000000000036'),
  ('00000000-0000-0000-0001-000000000007','Old City Wolves','OCW','7v7','Monastiraki','🐺','#37474F','Central Athens crew. Play together every weekend.',true,'00000000-0000-0000-0000-000000000043'),
  ('00000000-0000-0000-0001-000000000008','Southside United','SUN','7v7','Nea Smyrni','🌟','#F9A825','United from the south. Tournament regulars.',false,'00000000-0000-0000-0000-000000000050'),
  ('00000000-0000-0000-0001-000000000009','Maroussi Strikers','MST','5v5','Maroussi','🦊','#0D47A1','Quick 5v5 specialists. All about pace and pressing.',true,'00000000-0000-0000-0000-000000000057'),
  ('00000000-0000-0000-0001-000000000010','Kallithea FC','KFC','6v6','Kallithea','🐉','#4E342E','6v6 purists. Technical play, patient build-up.',false,'00000000-0000-0000-0000-000000000062');

-- ─── 6. TEAM MEMBERS ───────────────────────────────────────────────
INSERT INTO team_members (team_id, player_id, role, status) VALUES
  -- Team 1 (p01-07)
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000001','captain','active'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000002','player','active'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000003','player','active'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000004','player','active'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000005','player','active'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000006','player','active'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000007','player','active'),
  -- Team 2 (p08-14)
  ('00000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000008','captain','active'),
  ('00000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000009','player','active'),
  ('00000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000010','player','active'),
  ('00000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000011','player','active'),
  ('00000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000012','player','active'),
  ('00000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000013','player','active'),
  ('00000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000014','player','active'),
  -- Team 3 (p15-21)
  ('00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000015','captain','active'),
  ('00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000016','player','active'),
  ('00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000017','player','active'),
  ('00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000018','player','active'),
  ('00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000019','player','active'),
  ('00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000020','player','active'),
  ('00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000021','player','active'),
  -- Team 4 (p22-28)
  ('00000000-0000-0000-0001-000000000004','00000000-0000-0000-0000-000000000022','captain','active'),
  ('00000000-0000-0000-0001-000000000004','00000000-0000-0000-0000-000000000023','player','active'),
  ('00000000-0000-0000-0001-000000000004','00000000-0000-0000-0000-000000000024','player','active'),
  ('00000000-0000-0000-0001-000000000004','00000000-0000-0000-0000-000000000025','player','active'),
  ('00000000-0000-0000-0001-000000000004','00000000-0000-0000-0000-000000000026','player','active'),
  ('00000000-0000-0000-0001-000000000004','00000000-0000-0000-0000-000000000027','player','active'),
  ('00000000-0000-0000-0001-000000000004','00000000-0000-0000-0000-000000000028','player','active'),
  -- Team 5 (p29-35)
  ('00000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000029','captain','active'),
  ('00000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000030','player','active'),
  ('00000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000031','player','active'),
  ('00000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000032','player','active'),
  ('00000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000033','player','active'),
  ('00000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000034','player','active'),
  ('00000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000035','player','active'),
  -- Team 6 (p36-42)
  ('00000000-0000-0000-0001-000000000006','00000000-0000-0000-0000-000000000036','captain','active'),
  ('00000000-0000-0000-0001-000000000006','00000000-0000-0000-0000-000000000037','player','active'),
  ('00000000-0000-0000-0001-000000000006','00000000-0000-0000-0000-000000000038','player','active'),
  ('00000000-0000-0000-0001-000000000006','00000000-0000-0000-0000-000000000039','player','active'),
  ('00000000-0000-0000-0001-000000000006','00000000-0000-0000-0000-000000000040','player','active'),
  ('00000000-0000-0000-0001-000000000006','00000000-0000-0000-0000-000000000041','player','active'),
  ('00000000-0000-0000-0001-000000000006','00000000-0000-0000-0000-000000000042','player','active'),
  -- Team 7 (p43-49)
  ('00000000-0000-0000-0001-000000000007','00000000-0000-0000-0000-000000000043','captain','active'),
  ('00000000-0000-0000-0001-000000000007','00000000-0000-0000-0000-000000000044','player','active'),
  ('00000000-0000-0000-0001-000000000007','00000000-0000-0000-0000-000000000045','player','active'),
  ('00000000-0000-0000-0001-000000000007','00000000-0000-0000-0000-000000000046','player','active'),
  ('00000000-0000-0000-0001-000000000007','00000000-0000-0000-0000-000000000047','player','active'),
  ('00000000-0000-0000-0001-000000000007','00000000-0000-0000-0000-000000000048','player','active'),
  ('00000000-0000-0000-0001-000000000007','00000000-0000-0000-0000-000000000049','player','active'),
  -- Team 8 (p50-56)
  ('00000000-0000-0000-0001-000000000008','00000000-0000-0000-0000-000000000050','captain','active'),
  ('00000000-0000-0000-0001-000000000008','00000000-0000-0000-0000-000000000051','player','active'),
  ('00000000-0000-0000-0001-000000000008','00000000-0000-0000-0000-000000000052','player','active'),
  ('00000000-0000-0000-0001-000000000008','00000000-0000-0000-0000-000000000053','player','active'),
  ('00000000-0000-0000-0001-000000000008','00000000-0000-0000-0000-000000000054','player','active'),
  ('00000000-0000-0000-0001-000000000008','00000000-0000-0000-0000-000000000055','player','active'),
  ('00000000-0000-0000-0001-000000000008','00000000-0000-0000-0000-000000000056','player','active'),
  -- Team 9 (p57-61) 5v5
  ('00000000-0000-0000-0001-000000000009','00000000-0000-0000-0000-000000000057','captain','active'),
  ('00000000-0000-0000-0001-000000000009','00000000-0000-0000-0000-000000000058','player','active'),
  ('00000000-0000-0000-0001-000000000009','00000000-0000-0000-0000-000000000059','player','active'),
  ('00000000-0000-0000-0001-000000000009','00000000-0000-0000-0000-000000000060','player','active'),
  ('00000000-0000-0000-0001-000000000009','00000000-0000-0000-0000-000000000061','player','active'),
  -- Team 10 (p62-67) 6v6
  ('00000000-0000-0000-0001-000000000010','00000000-0000-0000-0000-000000000062','captain','active'),
  ('00000000-0000-0000-0001-000000000010','00000000-0000-0000-0000-000000000063','player','active'),
  ('00000000-0000-0000-0001-000000000010','00000000-0000-0000-0000-000000000064','player','active'),
  ('00000000-0000-0000-0001-000000000010','00000000-0000-0000-0000-000000000065','player','active'),
  ('00000000-0000-0000-0001-000000000010','00000000-0000-0000-0000-000000000066','player','active'),
  ('00000000-0000-0000-0001-000000000010','00000000-0000-0000-0000-000000000067','player','active');

-- ─── 7. TOURNAMENT ─────────────────────────────────────────────────
-- organizer = p01 (admin)
INSERT INTO tournaments (id, name, description, organizer_id, venue, area, match_format, max_teams, teams_per_group, prize, start_date, end_date, status)
VALUES (
  '00000000-0000-0000-0003-000000000001',
  'Athens 7v7 Summer Cup 2026',
  'Annual 7v7 tournament gathering the best amateur clubs from across Athens. Group stage followed by knockout rounds.',
  '00000000-0000-0000-0000-000000000001',
  'Pedion Areos Sports Complex',
  'Exarcheia',
  '7v7', 8, 4,
  '€500 + Trophy',
  '2026-03-15',
  '2026-04-12',
  'group_stage'
);

-- Registrations: teams 1-8 approved (7v7 tournament), teams 9-10 not in it
INSERT INTO tournament_registrations (tournament_id, team_id, status) VALUES
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000001','approved'),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000002','approved'),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000003','approved'),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000004','approved'),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000005','approved'),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000006','approved'),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000007','approved'),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000008','approved');

-- Groups: A = t1-t4, B = t5-t8
INSERT INTO tournament_groups (tournament_id, team_id, group_label) VALUES
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000001','A'),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000002','A'),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000003','A'),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000004','A'),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000005','B'),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000006','B'),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000007','B'),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0001-000000000008','B');

-- ─── 8. MATCHES (pre_match first, completed last via trigger) ───────
-- IDs: m01-m12 = tournament group stage, m13 = 5v5 friendly, m14-m15 = upcoming
INSERT INTO matches (id, home_team_id, away_team_id, format, status, match_date, match_time, location, area, created_by) VALUES
  -- Group A (t1-t4 round-robin, 6 matches)
  ('00000000-0000-0000-0002-000000000001','00000000-0000-0000-0001-000000000001','00000000-0000-0000-0001-000000000002','7v7','pre_match','2026-03-15','11:00','Pedion Areos Field A','Exarcheia','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0002-000000000002','00000000-0000-0000-0001-000000000003','00000000-0000-0000-0001-000000000004','7v7','pre_match','2026-03-15','13:00','Pedion Areos Field A','Exarcheia','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0002-000000000003','00000000-0000-0000-0001-000000000001','00000000-0000-0000-0001-000000000003','7v7','pre_match','2026-03-22','11:00','Pedion Areos Field A','Exarcheia','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0002-000000000004','00000000-0000-0000-0001-000000000002','00000000-0000-0000-0001-000000000004','7v7','pre_match','2026-03-22','13:00','Pedion Areos Field A','Exarcheia','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0002-000000000005','00000000-0000-0000-0001-000000000001','00000000-0000-0000-0001-000000000004','7v7','pre_match','2026-03-29','11:00','Pedion Areos Field A','Exarcheia','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0002-000000000006','00000000-0000-0000-0001-000000000002','00000000-0000-0000-0001-000000000003','7v7','pre_match','2026-03-29','13:00','Pedion Areos Field A','Exarcheia','00000000-0000-0000-0000-000000000001'),
  -- Group B (t5-t8 round-robin, 6 matches)
  ('00000000-0000-0000-0002-000000000007','00000000-0000-0000-0001-000000000005','00000000-0000-0000-0001-000000000006','7v7','pre_match','2026-03-15','11:00','Pedion Areos Field B','Exarcheia','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0002-000000000008','00000000-0000-0000-0001-000000000007','00000000-0000-0000-0001-000000000008','7v7','pre_match','2026-03-15','13:00','Pedion Areos Field B','Exarcheia','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0002-000000000009','00000000-0000-0000-0001-000000000005','00000000-0000-0000-0001-000000000007','7v7','pre_match','2026-03-22','11:00','Pedion Areos Field B','Exarcheia','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0002-000000000010','00000000-0000-0000-0001-000000000006','00000000-0000-0000-0001-000000000008','7v7','pre_match','2026-03-22','13:00','Pedion Areos Field B','Exarcheia','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0002-000000000011','00000000-0000-0000-0001-000000000005','00000000-0000-0000-0001-000000000008','7v7','pre_match','2026-03-29','11:00','Pedion Areos Field B','Exarcheia','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0002-000000000012','00000000-0000-0000-0001-000000000006','00000000-0000-0000-0001-000000000007','7v7','pre_match','2026-03-29','13:00','Pedion Areos Field B','Exarcheia','00000000-0000-0000-0000-000000000001'),
  -- Friendly: t9 vs t10 (5v5)
  ('00000000-0000-0000-0002-000000000013','00000000-0000-0000-0001-000000000009','00000000-0000-0000-0001-000000000010','5v5','pre_match','2026-03-10','10:00','Maroussi Indoor Arena','Maroussi','00000000-0000-0000-0000-000000000057'),
  -- Upcoming non-tournament matches
  ('00000000-0000-0000-0002-000000000014','00000000-0000-0000-0001-000000000001','00000000-0000-0000-0001-000000000005','7v7','scheduling',NULL,NULL,NULL,'Exarcheia','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0002-000000000015','00000000-0000-0000-0001-000000000009','00000000-0000-0000-0001-000000000009','5v5','pre_match','2026-04-05','10:00','Maroussi Indoor Arena','Maroussi','00000000-0000-0000-0000-000000000057');

-- Fix m15: can't have same team vs itself, make it t9 vs a freelancer pickup team — remove it
DELETE FROM matches WHERE id = '00000000-0000-0000-0002-000000000015';

-- ─── 9. TOURNAMENT MATCHES ─────────────────────────────────────────
INSERT INTO tournament_matches (tournament_id, match_id, stage, group_label, match_order) VALUES
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000001','group','A',1),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000002','group','A',2),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000003','group','A',3),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000004','group','A',4),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000005','group','A',5),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000006','group','A',6),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000007','group','B',7),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000008','group','B',8),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000009','group','B',9),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000010','group','B',10),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000011','group','B',11),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000012','group','B',12);

-- ─── 10. LINEUPS ───────────────────────────────────────────────────
-- Each 7v7 match: all 7 players of each team
-- Matches m01-m12 (tournament), m13 (friendly 5v5)
DO $$
DECLARE
  -- team → player range (start, count)
  t1_start int := 1;  t1_n int := 7;
  t2_start int := 8;  t2_n int := 7;
  t3_start int := 15; t3_n int := 7;
  t4_start int := 22; t4_n int := 7;
  t5_start int := 29; t5_n int := 7;
  t6_start int := 36; t6_n int := 7;
  t7_start int := 43; t7_n int := 7;
  t8_start int := 50; t8_n int := 7;
  t9_start int := 57; t9_n int := 5;
  t10_start int := 62; t10_n int := 6;

  match_id uuid;
  team_id  uuid;
  player_id uuid;
  p_start int; p_n int; i int;

  -- match → (home_team_idx, away_team_idx)
  match_teams int[][] := ARRAY[
    ARRAY[1,2], ARRAY[3,4], ARRAY[1,3], ARRAY[2,4],
    ARRAY[1,4], ARRAY[2,3], ARRAY[5,6], ARRAY[7,8],
    ARRAY[5,7], ARRAY[6,8], ARRAY[5,8], ARRAY[6,7],
    ARRAY[9,10]  -- m13 friendly
  ];
  starts int[] := ARRAY[1,8,15,22,29,36,43,50,57,62];
  counts int[] := ARRAY[7,7,7,7,7,7,7,7,5,6];
  m int; side int; tidx int;
BEGIN
  FOR m IN 1..13 LOOP
    match_id := ('00000000-0000-0000-0002-' || lpad(m::text, 12, '0'))::uuid;
    FOR side IN 1..2 LOOP
      tidx   := match_teams[m][side];
      team_id := ('00000000-0000-0000-0001-' || lpad(tidx::text, 12, '0'))::uuid;
      p_start := starts[tidx];
      p_n     := counts[tidx];
      FOR i IN 0..(p_n - 1) LOOP
        player_id := ('00000000-0000-0000-0000-' || lpad((p_start + i)::text, 12, '0'))::uuid;
        INSERT INTO match_lineups (match_id, team_id, player_id)
        VALUES (match_id, team_id, player_id)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END$$;

-- ─── 11. MATCH EVENTS (goals) ────────────────────────────────────────
-- Group A results: m01 t1 3-1 t2 | m02 t3 2-2 t4 | m03 t1 2-1 t3
--                  m04 t2 3-0 t4 | m05 t1 4-1 t4 | m06 t2 1-2 t3
-- Group B results: m07 t5 1-0 t6 | m08 t7 0-2 t8 | m09 t5 2-2 t7
--                  m10 t6 1-3 t8 | m11 t5 3-0 t8 | m12 t6 2-1 t7
-- Friendly:        m13 t9 3-2 t10
-- Team strikers/midfielders used as scorers for realism:
--  t1 scorers: p01(FWD),p06(FWD),p02(MID),p05(MID)
--  t2 scorers: p14(FWD),p11(FWD),p10(MID)
--  t3 scorers: p15(MID),p16(FWD),p21(FWD)
--  t4 scorers: p25(FWD),p28(FWD)
--  t5 scorers: p29(MID),p31(FWD),p35(FWD)
--  t6 scorers: p36(FWD),p40(FWD),p39(MID)
--  t7 scorers: p44(FWD),p49(FWD),p43(MID)
--  t8 scorers: p51(FWD),p55(FWD),p52(MID)
--  t9 scorers: p57(FWD),p61(FWD)
--  t10 scorers: p62(MID),p64(FWD)
INSERT INTO match_events (match_id, team_id, scorer_id, minute) VALUES
  -- m01: t1 3-1 t2
  ('00000000-0000-0000-0002-000000000001','00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000001',12),
  ('00000000-0000-0000-0002-000000000001','00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000006',34),
  ('00000000-0000-0000-0002-000000000001','00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000001',67),
  ('00000000-0000-0000-0002-000000000001','00000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000014',55),
  -- m02: t3 2-2 t4
  ('00000000-0000-0000-0002-000000000002','00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000016',23),
  ('00000000-0000-0000-0002-000000000002','00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000021',58),
  ('00000000-0000-0000-0002-000000000002','00000000-0000-0000-0001-000000000004','00000000-0000-0000-0000-000000000025',31),
  ('00000000-0000-0000-0002-000000000002','00000000-0000-0000-0001-000000000004','00000000-0000-0000-0000-000000000028',72),
  -- m03: t1 2-1 t3
  ('00000000-0000-0000-0002-000000000003','00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000002',18),
  ('00000000-0000-0000-0002-000000000003','00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000006',62),
  ('00000000-0000-0000-0002-000000000003','00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000016',44),
  -- m04: t2 3-0 t4
  ('00000000-0000-0000-0002-000000000004','00000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000011',9),
  ('00000000-0000-0000-0002-000000000004','00000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000014',37),
  ('00000000-0000-0000-0002-000000000004','00000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000011',70),
  -- m05: t1 4-1 t4
  ('00000000-0000-0000-0002-000000000005','00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000001',7),
  ('00000000-0000-0000-0002-000000000005','00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000001',29),
  ('00000000-0000-0000-0002-000000000005','00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000006',51),
  ('00000000-0000-0000-0002-000000000005','00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000002',78),
  ('00000000-0000-0000-0002-000000000005','00000000-0000-0000-0001-000000000004','00000000-0000-0000-0000-000000000025',43),
  -- m06: t2 1-2 t3
  ('00000000-0000-0000-0002-000000000006','00000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000014',26),
  ('00000000-0000-0000-0002-000000000006','00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000015',14),
  ('00000000-0000-0000-0002-000000000006','00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000021',63),
  -- m07: t5 1-0 t6
  ('00000000-0000-0000-0002-000000000007','00000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000031',55),
  -- m08: t7 0-2 t8
  ('00000000-0000-0000-0002-000000000008','00000000-0000-0000-0001-000000000008','00000000-0000-0000-0000-000000000051',33),
  ('00000000-0000-0000-0002-000000000008','00000000-0000-0000-0001-000000000008','00000000-0000-0000-0000-000000000055',61),
  -- m09: t5 2-2 t7
  ('00000000-0000-0000-0002-000000000009','00000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000029',19),
  ('00000000-0000-0000-0002-000000000009','00000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000035',68),
  ('00000000-0000-0000-0002-000000000009','00000000-0000-0000-0001-000000000007','00000000-0000-0000-0000-000000000044',41),
  ('00000000-0000-0000-0002-000000000009','00000000-0000-0000-0001-000000000007','00000000-0000-0000-0000-000000000049',77),
  -- m10: t6 1-3 t8
  ('00000000-0000-0000-0002-000000000010','00000000-0000-0000-0001-000000000006','00000000-0000-0000-0000-000000000036',22),
  ('00000000-0000-0000-0002-000000000010','00000000-0000-0000-0001-000000000008','00000000-0000-0000-0000-000000000051',11),
  ('00000000-0000-0000-0002-000000000010','00000000-0000-0000-0001-000000000008','00000000-0000-0000-0000-000000000055',48),
  ('00000000-0000-0000-0002-000000000010','00000000-0000-0000-0001-000000000008','00000000-0000-0000-0000-000000000052',74),
  -- m11: t5 3-0 t8
  ('00000000-0000-0000-0002-000000000011','00000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000031',15),
  ('00000000-0000-0000-0002-000000000011','00000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000035',44),
  ('00000000-0000-0000-0002-000000000011','00000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000029',79),
  -- m12: t6 2-1 t7
  ('00000000-0000-0000-0002-000000000012','00000000-0000-0000-0001-000000000006','00000000-0000-0000-0000-000000000040',28),
  ('00000000-0000-0000-0002-000000000012','00000000-0000-0000-0001-000000000006','00000000-0000-0000-0000-000000000036',65),
  ('00000000-0000-0000-0002-000000000012','00000000-0000-0000-0001-000000000007','00000000-0000-0000-0000-000000000044',52),
  -- m13: t9 3-2 t10 (friendly 5v5)
  ('00000000-0000-0000-0002-000000000013','00000000-0000-0000-0001-000000000009','00000000-0000-0000-0000-000000000057',8),
  ('00000000-0000-0000-0002-000000000013','00000000-0000-0000-0001-000000000009','00000000-0000-0000-0000-000000000061',31),
  ('00000000-0000-0000-0002-000000000013','00000000-0000-0000-0001-000000000009','00000000-0000-0000-0000-000000000057',54),
  ('00000000-0000-0000-0002-000000000013','00000000-0000-0000-0001-000000000010','00000000-0000-0000-0000-000000000064',20),
  ('00000000-0000-0000-0002-000000000013','00000000-0000-0000-0001-000000000010','00000000-0000-0000-0000-000000000062',47);

-- ─── 12. COMPLETE MATCHES (triggers update all stats) ──────────────
-- NOTE: Do NOT set home_result_status/away_result_status='confirmed' here.
--       The resolve_match_result trigger fires on that and marks non-draws
--       as 'disputed' (it compares home_score_submit vs away_score_submit).
--       Directly setting status='completed' bypasses it and fires sync_match_stats.
-- Group A
UPDATE matches SET status='completed', home_score=3, away_score=1 WHERE id='00000000-0000-0000-0002-000000000001';
UPDATE matches SET status='completed', home_score=2, away_score=2 WHERE id='00000000-0000-0000-0002-000000000002';
UPDATE matches SET status='completed', home_score=2, away_score=1 WHERE id='00000000-0000-0000-0002-000000000003';
UPDATE matches SET status='completed', home_score=3, away_score=0 WHERE id='00000000-0000-0000-0002-000000000004';
UPDATE matches SET status='completed', home_score=4, away_score=1 WHERE id='00000000-0000-0000-0002-000000000005';
UPDATE matches SET status='completed', home_score=1, away_score=2 WHERE id='00000000-0000-0000-0002-000000000006';
-- Group B
UPDATE matches SET status='completed', home_score=1, away_score=0 WHERE id='00000000-0000-0000-0002-000000000007';
UPDATE matches SET status='completed', home_score=0, away_score=2 WHERE id='00000000-0000-0000-0002-000000000008';
UPDATE matches SET status='completed', home_score=2, away_score=2 WHERE id='00000000-0000-0000-0002-000000000009';
UPDATE matches SET status='completed', home_score=1, away_score=3 WHERE id='00000000-0000-0000-0002-000000000010';
UPDATE matches SET status='completed', home_score=3, away_score=0 WHERE id='00000000-0000-0000-0002-000000000011';
UPDATE matches SET status='completed', home_score=2, away_score=1 WHERE id='00000000-0000-0000-0002-000000000012';
-- Friendly
UPDATE matches SET status='completed', home_score=3, away_score=2 WHERE id='00000000-0000-0000-0002-000000000013';
