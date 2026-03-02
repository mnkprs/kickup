-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Admin Tournament Permissions
--  Migration 014: Admins have same tournament permissions as organizers
--  (for all tournaments, not just ones they created)
-- ═══════════════════════════════════════════════════════════════════

-- is_tournament_organizer: true if caller is organizer OR admin
CREATE OR REPLACE FUNCTION is_tournament_organizer(p_tournament_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM tournaments t
    WHERE t.id = p_tournament_id
      AND (t.organizer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.is_admin = true
      ))
  );
$$;

-- is_tournament_match_organizer: true if caller is organizer OR admin
CREATE OR REPLACE FUNCTION is_tournament_match_organizer(p_match_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM tournament_matches tm
    JOIN tournaments t ON t.id = tm.tournament_id
    WHERE tm.match_id = p_match_id
      AND (t.organizer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.is_admin = true
      ))
  );
$$;
