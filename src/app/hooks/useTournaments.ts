import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createDataStore } from '../lib/dataStore';
import type { Tournament, TournamentStatus, MatchFormat } from '../types/database';

interface UseTournamentsOptions {
  status?: TournamentStatus;
  format?: MatchFormat;
}

const store = createDataStore<Tournament[]>();

const FETCHER = async (): Promise<Tournament[]> => {
  const { data } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
};

export function useTournaments(opts?: UseTournamentsOptions) {
  const applyFilter = (all: Tournament[]) => {
    let result = all;
    if (opts?.status) result = result.filter(t => t.status === opts.status);
    if (opts?.format) result = result.filter(t => t.match_format === opts.format);
    return result;
  };

  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const cached = store.get();
    return cached ? applyFilter(cached) : [];
  });
  const [loading, setLoading] = useState(!store.isFresh());

  useEffect(() => {
    if (store.isFresh()) {
      setTournaments(applyFilter(store.get()!));
      setLoading(false);
      return;
    }
    setLoading(true);
    store.fetch(FETCHER).then(data => {
      setTournaments(applyFilter(data));
      setLoading(false);
    });
    return store.subscribe(() => {
      const d = store.get();
      if (d) setTournaments(applyFilter(d));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.status, opts?.format]);

  return { tournaments, loading };
}
