import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Team } from '../types/database';

interface UseTeamsOptions {
  searching_for_opponent?: boolean;
}

export function useTeams(opts?: UseTeamsOptions) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      let q = supabase.from('teams').select('*').order('record_w', { ascending: false });
      if (opts?.searching_for_opponent !== undefined) {
        q = q.eq('searching_for_opponent', opts.searching_for_opponent);
      }
      const { data } = await q;
      setTeams(data ?? []);
      setLoading(false);
    };
    fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.searching_for_opponent]);

  return { teams, loading };
}
