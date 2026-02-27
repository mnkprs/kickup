import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TeamWithMembers } from '../types/database';

export function useTeam(id: string | undefined) {
  const [team, setTeam] = useState<TeamWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('teams')
        .select('*, team_members(*, profiles(*))')
        .eq('id', id)
        .single();
      setTeam(data as TeamWithMembers | null);
      setLoading(false);
    };
    fetch();
  }, [id, key]);

  const refresh = useCallback(() => setKey(k => k + 1), []);

  return { team, loading, refresh };
}
