-- ═══════════════════════════════════════════════════════════════════
--  KICKUP — Disable "Looking for team" for inactive players
--  Run this periodically (e.g. weekly) via Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════
--
-- Inactive = players with permanent "looking for team" (freelancer_until IS NULL)
-- who haven't signed in for 30+ days.
--
-- To preview affected rows before updating, run the SELECT below first.
-- Then run the UPDATE to apply changes.
--

-- ─── PREVIEW: See who would be affected ─────────────────────────
-- SELECT p.id, p.full_name, p.is_freelancer, p.freelancer_until,
--        u.last_sign_in_at,
--        (now() - u.last_sign_in_at)::interval as days_since_login
-- FROM profiles p
-- JOIN auth.users u ON u.id = p.id
-- WHERE p.is_freelancer = true
--   AND p.freelancer_until IS NULL
--   AND (u.last_sign_in_at IS NULL OR u.last_sign_in_at < now() - interval '30 days')
-- ORDER BY u.last_sign_in_at ASC NULLS FIRST;

-- ─── EXECUTE: Turn off looking-for-team for inactive players ──────
UPDATE profiles p
SET
  is_freelancer = false,
  freelancer_until = null,
  updated_at = now()
FROM auth.users u
WHERE p.id = u.id
  AND p.is_freelancer = true
  AND p.freelancer_until IS NULL
  AND (u.last_sign_in_at IS NULL OR u.last_sign_in_at < now() - interval '30 days');
