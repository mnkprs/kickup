import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createDataStore } from '../lib/dataStore';
import type { MatchWithTeams } from '../types/database';

const store = createDataStore<MatchWithTeams[]>();

const FETCHER = async (): Promise<MatchWithTeams[]> => {
  const { data } = await supabase
    .from('matches')
    .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)')
    .order('created_at', { ascending: false });
  return (data as MatchWithTeams[]) ?? [];
};

export function useMatches() {
  const [matches, setMatches] = useState<MatchWithTeams[]>(() => store.get() ?? []);
  const [loading, setLoading] = useState(!store.isFresh());

  useEffect(() => {
    if (store.isFresh()) {
      setMatches(store.get()!);
      setLoading(false);
      return;
    }
    setLoading(true);
    store.fetch(FETCHER).then(data => {
      setMatches(data);
      setLoading(false);
    });
    return store.subscribe(() => {
      const d = store.get();
      if (d) setMatches(d);
    });
  }, []);

  return { matches, loading };
}
