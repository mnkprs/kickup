import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { MatchFull } from '../types/database';

export function useMatch(id: string | undefined) {
  const [match, setMatch] = useState<MatchFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*),
          match_lineups(*, profiles(*)),
          match_proposals(*, proposed_by_team:teams!proposed_by_team_id(*)),
          match_events(*, scorer:profiles!scorer_id(*)),
          tournament_matches(tournaments(organizer_id))
        `)
        .eq('id', id)
        .single();
      setMatch(data as MatchFull | null);
      setLoading(false);
    };
    fetch();
  }, [id]);

  return { match, loading };
}
