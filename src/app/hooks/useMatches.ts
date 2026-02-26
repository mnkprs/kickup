import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { MatchWithTeams } from '../types/database';

export function useMatches() {
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('matches')
        .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)')
        .order('created_at', { ascending: false });
      setMatches((data as MatchWithTeams[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  return { matches, loading };
}
