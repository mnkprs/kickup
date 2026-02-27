-- Config tables: areas, avatar_colors, team_emojis
-- Also adds avatar_url column to profiles

-- Areas
CREATE TABLE public.areas (
  id   serial PRIMARY KEY,
  name text   UNIQUE NOT NULL,
  sort int    NOT NULL DEFAULT 0
);

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read areas" ON public.areas FOR SELECT USING (true);

INSERT INTO public.areas (name, sort) VALUES
  -- Central Athens
  ('Syntagma',        1),
  ('Monastiraki',     2),
  ('Plaka',           3),
  ('Psyrri',          4),
  ('Gazi',            5),
  ('Thissio',         6),
  ('Omonia',          7),
  ('Exarcheia',       8),
  ('Kolonaki',        9),
  ('Pangrati',        10),
  ('Mets',            11),
  ('Koukaki',         12),
  ('Petralona',       13),
  ('Kerameikos',      14),
  ('Neos Kosmos',     15),
  ('Kallithea',       16),
  ('Dafni',           17),
  ('Moschato',        18),
  ('Tavros',          19),
  ('Votanikos',       20),
  -- North Athens
  ('Kifisia',         21),
  ('Chalandri',       22),
  ('Agia Paraskevi',  23),
  ('Maroussi',        24),
  ('Vrilissia',       25),
  ('Nea Erythraia',   26),
  ('Ekali',           27),
  ('Melissia',        28),
  ('Pendeli',         29),
  ('Papagou',         30),
  ('Cholargos',       31),
  ('Metamorfosi',     32),
  ('Nea Ionia',       33),
  ('Nea Filadelfia',  34),
  ('Galatsi',         35),
  -- South Athens
  ('Glyfada',         36),
  ('Voula',           37),
  ('Vari',            38),
  ('Vouliagmeni',     39),
  ('Elliniko',        40),
  ('Alimos',          41),
  ('Argyroupoli',     42),
  ('Nea Smyrni',      43),
  ('Palaio Faliro',   44),
  ('Agios Dimitrios', 45),
  ('Ilioupoli',       46),
  ('Vyronas',         47),
  -- East Athens
  ('Zografou',        48),
  ('Kaisariani',      49),
  ('Gerakas',         50),
  ('Pallini',         51),
  ('Koropi',          52),
  ('Markopoulo',      53),
  ('Spata',           54),
  ('Rafina',          55),
  ('Lavrio',          56),
  -- West Athens
  ('Piraeus',         57),
  ('Peristeri',       58),
  ('Ilion',           59),
  ('Egaleo',          60),
  ('Petroupoli',      61),
  ('Agioi Anargyroi', 62),
  ('Koridallos',      63),
  ('Nikaia',          64),
  ('Keratsini',       65),
  ('Drapetsona',      66),
  -- Other
  ('Other',           99);

-- Avatar colors
CREATE TABLE public.avatar_colors (
  id   serial PRIMARY KEY,
  hex  text   UNIQUE NOT NULL,
  sort int    NOT NULL DEFAULT 0
);

ALTER TABLE public.avatar_colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read avatar_colors" ON public.avatar_colors FOR SELECT USING (true);

INSERT INTO public.avatar_colors (hex, sort) VALUES
  ('#2E7D32', 1),
  ('#1565C0', 2),
  ('#6A1B9A', 3),
  ('#E65100', 4),
  ('#00695C', 5),
  ('#BF360C', 6),
  ('#37474F', 7),
  ('#F9A825', 8);

-- Team emojis
CREATE TABLE public.team_emojis (
  id    serial PRIMARY KEY,
  emoji text   UNIQUE NOT NULL,
  sort  int    NOT NULL DEFAULT 0
);

ALTER TABLE public.team_emojis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read team_emojis" ON public.team_emojis FOR SELECT USING (true);

INSERT INTO public.team_emojis (emoji, sort) VALUES
  ('⚽',  1),
  ('🦁',  2),
  ('🐉',  3),
  ('🦅',  4),
  ('🐺',  5),
  ('🔥',  6),
  ('⚡',  7),
  ('🌊',  8),
  ('🏹',  9),
  ('🦊', 10),
  ('🐯', 11),
  ('🦂', 12);

-- Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN avatar_url text;
