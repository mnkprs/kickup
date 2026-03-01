-- Add city column to areas and insert Thessaloniki areas

ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT 'Athens';

-- Update existing areas to explicitly set Athens
UPDATE public.areas SET city = 'Athens' WHERE city = 'Athens' OR city IS NULL;

-- Insert Thessaloniki areas (sort 200+ to keep them separate from Athens sort range)
INSERT INTO public.areas (name, city, sort) VALUES
  ('Ampelokipoi',   'Thessaloniki', 201),
  ('Ano Poli',      'Thessaloniki', 202),
  ('Evosmos',       'Thessaloniki', 203),
  ('Kalamaria',     'Thessaloniki', 204),
  ('Kentro',        'Thessaloniki', 205),
  ('Kordelio',      'Thessaloniki', 206),
  ('Ladadika',      'Thessaloniki', 207),
  ('Neapoli',       'Thessaloniki', 208),
  ('Panorama',      'Thessaloniki', 209),
  ('Pylaia',        'Thessaloniki', 210),
  ('Stavroupoli',   'Thessaloniki', 211),
  ('Sykies',        'Thessaloniki', 212),
  ('Thermi',        'Thessaloniki', 213),
  ('Toumpa',        'Thessaloniki', 214),
  ('Vardaris',      'Thessaloniki', 215)
ON CONFLICT (name) DO NOTHING;
