import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAreas() {
  const [areas, setAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('areas').select('name').order('sort');
      setAreas((data ?? []).map((r: { name: string }) => r.name));
      setLoading(false);
    };
    fetch();
  }, []);

  return { areas, loading };
}

export function useAvatarColors() {
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('avatar_colors').select('hex').order('sort');
      setColors((data ?? []).map((r: { hex: string }) => r.hex));
      setLoading(false);
    };
    fetch();
  }, []);

  return { colors, loading };
}

export function useTeamEmojis() {
  const [emojis, setEmojis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('team_emojis').select('emoji').order('sort');
      setEmojis((data ?? []).map((r: { emoji: string }) => r.emoji));
      setLoading(false);
    };
    fetch();
  }, []);

  return { emojis, loading };
}
