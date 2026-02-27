import { supabase } from './supabase';

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (uploadError) return { url: null, error: uploadError.message };

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
