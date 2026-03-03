-- Allow admins to update tournaments (same as organizer). Admins have application-level
-- role; is_tournament_organizer() already returns true for admins.
DROP POLICY IF EXISTS "tournaments_update_organizer" ON tournaments;
CREATE POLICY "tournaments_update_organizer" ON tournaments FOR UPDATE
  USING (is_tournament_organizer(id)) WITH CHECK (is_tournament_organizer(id));
