-- Add missing Athens/Attica areas (Paiania, Mesogeia, and other suburbs)

INSERT INTO public.areas (name, city, sort) VALUES
  -- East Athens / Mesogeia
  ('Paiania',            'Athens', 67),
  ('Glyka Nera',         'Athens', 68),
  ('Artemida',           'Athens', 69),
  ('Agios Stefanos',     'Athens', 70),
  ('Anoixi',             'Athens', 71),
  ('Anthousa',           'Athens', 72),
  ('Anavyssos',          'Athens', 73),
  ('Avlonas',            'Athens', 74),
  ('Keratea',             'Athens', 75),
  ('Kropia',              'Athens', 76),
  ('Nea Makri',          'Athens', 77),
  ('Saronida',           'Athens', 78),
  ('Marathon',           'Athens', 79),
  ('Dionysos',           'Athens', 80),
  ('Stamata',            'Athens', 81),
  ('Kryoneri',           'Athens', 82),
  ('Pikermi',            'Athens', 83),
  -- North Athens
  ('Pefki',              'Athens', 84),
  ('Lykovrysi',          'Athens', 85),
  ('Psychiko',           'Athens', 86),
  ('Filothei',           'Athens', 87),
  ('Irakleio',           'Athens', 88),
  ('Kamatero',           'Athens', 89),
  ('Acharnes',           'Athens', 90),
  -- West Athens / Piraeus
  ('Chaidari',           'Athens', 91),
  ('Perama',             'Athens', 92),
  ('Agios Ioannis Rentis','Athens', 93),
  ('Agia Varvara',       'Athens', 94),
  -- West Attica
  ('Eleusis',            'Athens', 95),
  ('Aspropyrgos',        'Athens', 96),
  ('Ano Liosia',         'Athens', 97),
  ('Megara',             'Athens', 98)
ON CONFLICT (name) DO NOTHING;
