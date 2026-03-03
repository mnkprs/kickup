-- KICKUP — Unknown goals fixes
-- 1. Only skip v_unassigned when client sent Unknown with count > 0 (not when key exists with 0)
-- 2. Case-insensitive key check for Unknown (client may send uppercase UUID)

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
  v_unknown_count int := 0;
  i            int;
BEGIN
  -- Client sent Unknown with count > 0 only when we should NOT add v_unassigned.
  -- Case-insensitive key match; if Unknown has count 0 or is missing, we add v_unassigned.
  SELECT coalesce(nullif(trim(value), '')::int, 0) INTO v_unknown_count
  FROM jsonb_each_text(coalesce(p_goals, '{}'))
  WHERE lower(key) = lower(v_unknown_id::text)
  LIMIT 1;
  v_client_sent_unknown := (v_unknown_count > 0);

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
  -- ONLY when client did NOT send Unknown with count > 0
  IF NOT v_client_sent_unknown THEN
    v_unassigned := greatest(0, p_score - v_sum);
    FOR i IN 1..least(v_unassigned, 20) LOOP
      INSERT INTO match_events (match_id, team_id, scorer_id, minute)
      VALUES (p_match_id, p_team_id, v_unknown_id, 0);
    END LOOP;
  END IF;
END;
$$;
