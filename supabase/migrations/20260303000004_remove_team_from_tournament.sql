-- KICKUP — Organizer Remove Team from Tournament
-- Organizer or admin can remove an approved team during registration phase only.

CREATE OR REPLACE FUNCTION remove_team_from_tournament(
  p_tournament_id uuid,
  p_team_id       uuid
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tournament tournaments%rowtype;
  v_is_admin boolean;
BEGIN
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;

  IF v_tournament.status <> 'registration' THEN
    RAISE EXCEPTION 'Teams can only be removed during the registration phase';
  END IF;

  SELECT COALESCE(p.is_admin, false) INTO v_is_admin
  FROM profiles p WHERE p.id = auth.uid();

  IF v_tournament.organizer_id <> auth.uid() AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Only the tournament organizer or an admin can remove teams';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM tournament_registrations
    WHERE tournament_id = p_tournament_id AND team_id = p_team_id AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Team is not approved for this tournament';
  END IF;

  DELETE FROM tournament_registrations
  WHERE tournament_id = p_tournament_id AND team_id = p_team_id;
END;
$$;

GRANT EXECUTE ON FUNCTION remove_team_from_tournament(uuid, uuid) TO authenticated;
