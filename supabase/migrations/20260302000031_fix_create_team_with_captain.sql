-- ═══════════════════════════════════════════════════════════════════
--  Fix create_team_with_captain: accept p_formats (array) to match app
--  Drops old single-format overload and grants execute to authenticated.
-- ═══════════════════════════════════════════════════════════════════

-- Drop old overload (p_format match_format) from migration 006
DROP FUNCTION IF EXISTS create_team_with_captain(text, text, match_format, text, text, text, text);

CREATE OR REPLACE FUNCTION create_team_with_captain(
  p_name        text,
  p_short_name  text,
  p_formats     text[],
  p_area        text,
  p_emoji       text,
  p_color       text,
  p_description text DEFAULT ''
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_team_id uuid;
  v_format  match_format;
BEGIN
  IF array_length(p_formats, 1) IS NULL OR array_length(p_formats, 1) < 1 THEN
    RAISE EXCEPTION 'At least one format is required';
  END IF;
  v_format := p_formats[1]::match_format;

  INSERT INTO teams (name, short_name, format, area, emoji, color, description, created_by)
  VALUES (p_name, p_short_name, v_format, p_area, p_emoji, p_color, p_description, auth.uid())
  RETURNING id INTO v_team_id;

  INSERT INTO team_members (team_id, player_id, role, status)
  VALUES (v_team_id, auth.uid(), 'captain', 'active');

  RETURN v_team_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_team_with_captain(text, text, text[], text, text, text, text) TO authenticated;
