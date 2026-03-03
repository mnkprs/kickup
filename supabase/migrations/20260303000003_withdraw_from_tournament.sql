-- KICKUP — Captain Withdraw from Tournament
-- Captain can withdraw their team from a tournament during registration phase only.

CREATE OR REPLACE FUNCTION withdraw_from_tournament(
  p_tournament_id uuid,
  p_team_id       uuid
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tournament tournaments%rowtype;
  v_reg        tournament_registrations%rowtype;
BEGIN
  IF NOT is_team_captain(p_team_id) THEN
    RAISE EXCEPTION 'Only the team captain can withdraw from a tournament';
  END IF;

  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;

  IF v_tournament.status <> 'registration' THEN
    RAISE EXCEPTION 'Withdrawal is only allowed during the registration phase';
  END IF;

  SELECT * INTO v_reg FROM tournament_registrations
  WHERE tournament_id = p_tournament_id AND team_id = p_team_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Your team is not registered for this tournament';
  END IF;

  IF v_reg.status <> 'approved' THEN
    RAISE EXCEPTION 'Only approved registrations can be withdrawn';
  END IF;

  DELETE FROM tournament_registrations
  WHERE tournament_id = p_tournament_id AND team_id = p_team_id;
END;
$$;

GRANT EXECUTE ON FUNCTION withdraw_from_tournament(uuid, uuid) TO authenticated;
