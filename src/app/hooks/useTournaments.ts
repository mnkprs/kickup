import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Tournament, TournamentStatus, MatchFormat } from '../types/database';

interface UseTournamentsOptions {
  status?: TournamentStatus;
  format?: MatchFormat;
}

export function useTournaments(opts?: UseTournamentsOptions) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let q = supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (opts?.status) q = q.eq('status', opts.status);
      if (opts?.format) q = q.eq('match_format', opts.format);

      const { data } = await q;
      setTournaments(data ?? []);
      setLoading(false);
    };
    fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.status, opts?.format]);

  return { tournaments, loading };
}
