-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Seed tournament matches (bypasses RLS for seed scripts)
--  Used by seed.sql when auth.uid() is unavailable (pooler/direct).
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.seed_tournament_matches(
  p_tournament_id uuid,
  p_rows jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r jsonb;
BEGIN
  FOR r IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    INSERT INTO tournament_matches (tournament_id, match_id, stage, group_label, match_order)
    VALUES (
      p_tournament_id,
      (r->>0)::uuid,
      r->>1,
      r->>2,
      (r->>3)::int
    );
  END LOOP;
END;
$$;
