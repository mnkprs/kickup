ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS height int,
  ADD COLUMN IF NOT EXISTS preferred_foot text CHECK (preferred_foot IN ('left', 'right', 'both'));
