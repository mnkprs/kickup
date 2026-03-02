-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Notify Organizer on Tournament Application
--  Migration 015: RPC to notify organizer when a team applies (pending)
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION notify_organizer_tournament_application(
  p_tournament_id uuid,
  p_team_id       uuid
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_organizer_id uuid;
  v_tourn_name   text;
  v_team_name    text;
BEGIN
  SELECT organizer_id, name INTO v_organizer_id, v_tourn_name
  FROM tournaments WHERE id = p_tournament_id;

  IF v_organizer_id IS NULL THEN RETURN; END IF;

  SELECT name INTO v_team_name FROM teams WHERE id = p_team_id;

  INSERT INTO notifications (user_id, type, title, body, team_id)
  VALUES (
    v_organizer_id,
    'spot_applied',
    'New tournament registration',
    COALESCE(v_team_name, 'A team') || ' has applied to join ' || COALESCE(v_tourn_name, 'the tournament') || '.',
    p_team_id
  );
END;
$$;
