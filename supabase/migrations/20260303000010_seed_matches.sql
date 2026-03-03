-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Seed matches (bypasses RLS for seed scripts)
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.seed_matches(p_rows jsonb)
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
    INSERT INTO matches (id, home_team_id, away_team_id, format, status, match_date, match_time, location, area, created_by)
    VALUES (
      (r->>0)::uuid,
      (r->>1)::uuid,
      (r->>2)::uuid,
      (r->>3)::match_format,
      r->>4,
      (r->>5)::date,
      (r->>6)::time,
      r->>7,
      r->>8,
      (r->>9)::uuid
    );
  END LOOP;
END;
$$;
