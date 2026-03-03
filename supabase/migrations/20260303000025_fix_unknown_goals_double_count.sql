-- KICKUP — Fix Unknown goals double-count
-- When client sends Unknown explicitly in goals payload, do NOT add v_unassigned.
-- The client's payload is the complete breakdown. Only add unassigned when client
-- omits Unknown (e.g. only sends known players).

CREATE OR REPLACE FUNCTION insert_match_events_with_unknown(
  p_match_id   uuid,
  p_team_id    uuid,
  p_score      int,
  p_goals      jsonb
)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_unknown_id uuid := get_unknown_player_id();
  v_rec        record;
  v_sum        int := 0;
  v_unassigned int;
  v_client_sent_unknown boolean;
  i            int;
BEGIN
  -- Check if client explicitly sent Unknown in payload (complete breakdown)
  v_client_sent_unknown := (coalesce(p_goals, '{}') ? v_unknown_id::text);

  -- Sum assigned goals
  SELECT coalesce(sum((value::text)::int), 0) INTO v_sum
  FROM jsonb_each_text(coalesce(p_goals, '{}'));

  -- Insert assigned goals (including explicit Unknown if client sends it)
  FOR v_rec IN SELECT key, coalesce(nullif(value, '')::int, 0) AS cnt
    FROM jsonb_each_text(coalesce(p_goals, '{}'))
  LOOP
    FOR i IN 1..least(greatest(0, v_rec.cnt), 20) LOOP
      INSERT INTO match_events (match_id, team_id, scorer_id, minute)
      VALUES (p_match_id, p_team_id, v_rec.key::uuid, 0);
    END LOOP;
  END LOOP;

  -- Unassigned goals (total - sum of assigned) → Unknown
  -- ONLY when client did NOT send Unknown in payload (client sends known players only)
  IF NOT v_client_sent_unknown THEN
    v_unassigned := greatest(0, p_score - v_sum);
    FOR i IN 1..least(v_unassigned, 20) LOOP
      INSERT INTO match_events (match_id, team_id, scorer_id, minute)
      VALUES (p_match_id, p_team_id, v_unknown_id, 0);
    END LOOP;
  END IF;
END;
$$;
