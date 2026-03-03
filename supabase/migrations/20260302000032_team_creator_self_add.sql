-- ═══════════════════════════════════════════════════════════════════
--  Allow team creator to add themselves as captain.
--  The existing policy requires is_team_captain(team_id), which is false
--  for a brand-new team. This policy allows the creator to add themselves.
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "team_members_insert_creator"
  ON team_members FOR INSERT
  WITH CHECK (
    player_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM teams
      WHERE id = team_id AND created_by = auth.uid()
    )
  );
