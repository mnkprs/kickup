import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createDataStore } from '../lib/dataStore';
import type { Team } from '../types/database';

interface UseTeamsOptions {
  searching_for_opponent?: boolean;
}

const store = createDataStore<Team[]>();

const FETCHER = async (): Promise<Team[]> => {
  const { data } = await supabase
    .from('teams')
    .select('*')
    .order('record_w', { ascending: false });
  return data ?? [];
};

export function useTeams(opts?: UseTeamsOptions) {
  const applyFilter = (all: Team[]) =>
    opts?.searching_for_opponent !== undefined
      ? all.filter(t => t.searching_for_opponent === opts.searching_for_opponent)
      : all;

  const [teams, setTeams] = useState<Team[]>(() => {
    const cached = store.get();
    return cached ? applyFilter(cached) : [];
  });
  const [loading, setLoading] = useState(!store.isFresh());

  useEffect(() => {
    if (store.isFresh()) {
      setTeams(applyFilter(store.get()!));
      setLoading(false);
      return;
    }
    setLoading(true);
    store.fetch(FETCHER).then(data => {
      setTeams(applyFilter(data));
      setLoading(false);
    });
    return store.subscribe(() => {
      const d = store.get();
      if (d) setTeams(applyFilter(d));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.searching_for_opponent]);

  return { teams, loading };
}
