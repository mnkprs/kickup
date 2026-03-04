-- Optional: Add profile_completed_at to track onboarding completion.
-- Apply this migration if you want to track when users complete their profile
-- (position + area filled). Useful for analytics and hiding the "Complete profile" banner.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz;

COMMENT ON COLUMN profiles.profile_completed_at IS 'When the user first completed key profile fields (position, area).';

-- Backfill: set profile_completed_at for existing users who have position and area
UPDATE profiles
SET profile_completed_at = COALESCE(updated_at, created_at)
WHERE position IS NOT NULL
  AND position != ''
  AND area IS NOT NULL
  AND area != ''
  AND profile_completed_at IS NULL;
