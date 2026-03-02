-- Add avatar_url to teams table
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create team_avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team_avatars',
  'team_avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for team_avatars
-- Path format: {team_id}/avatar.{ext}
-- Only team captains can upload/update/delete their team's avatar
CREATE POLICY "Public read team_avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'team_avatars');

CREATE POLICY "Captain upload team_avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'team_avatars'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = ((storage.foldername(name))[1])::uuid
        AND player_id = auth.uid()
        AND role = 'captain'
        AND status = 'active'
    )
  );

CREATE POLICY "Captain update team_avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'team_avatars'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = ((storage.foldername(name))[1])::uuid
        AND player_id = auth.uid()
        AND role = 'captain'
        AND status = 'active'
    )
  );

CREATE POLICY "Captain delete team_avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'team_avatars'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = ((storage.foldername(name))[1])::uuid
        AND player_id = auth.uid()
        AND role = 'captain'
        AND status = 'active'
    )
  );
