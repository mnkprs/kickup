import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Tournament, TournamentRegistration, TournamentGroup, TournamentMatch, TournamentStandingsRow, TournamentPlayerStat } from '../types/database';

export interface TournamentDetail {
  tournament: Tournament;
  registrations: TournamentRegistration[];
  groups: TournamentGroup[];
  tournamentMatches: TournamentMatch[];
}

export function useTournamentDetail(id: string | undefined) {
  const [detail, setDetail] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const [
        { data: tournament },
        { data: registrations },
        { data: groups },
        { data: tournamentMatches },
      ] = await Promise.all([
        supabase.from('tournaments').select('*').eq('id', id).single(),
        supabase.from('tournament_registrations').select('*, teams(*)').eq('tournament_id', id).order('applied_at'),
        supabase.from('tournament_groups').select('*').eq('tournament_id', id),
        supabase.from('tournament_matches')
          .select('*, matches(*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*))')
          .eq('tournament_id', id)
          .order('match_order'),
      ]);

      if (tournament) {
        setDetail({
          tournament: tournament as Tournament,
          registrations: (registrations ?? []) as TournamentRegistration[],
          groups: (groups ?? []) as TournamentGroup[],
          tournamentMatches: (tournamentMatches ?? []) as TournamentMatch[],
        });
      }
      setLoading(false);
    };
    fetch();
  }, [id, key]);

  const refresh = useCallback(() => setKey(k => k + 1), []);

  return { detail, loading, refresh };
}

export function useTournamentStandings(tournamentId: string, groupLabel: string) {
  const [standings, setStandings] = useState<TournamentStandingsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId || !groupLabel) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.rpc('get_tournament_standings', {
        p_tournament_id: tournamentId,
        p_group_label: groupLabel,
      });
      setStandings((data ?? []) as TournamentStandingsRow[]);
      setLoading(false);
    };
    fetch();
  }, [tournamentId, groupLabel]);

  return { standings, loading };
}

export function useTournamentPlayerStats(tournamentId: string) {
  const [stats, setStats] = useState<TournamentPlayerStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.rpc('get_tournament_player_stats', {
        p_tournament_id: tournamentId,
      });
      setStats((data ?? []) as TournamentPlayerStat[]);
      setLoading(false);
    };
    fetch();
  }, [tournamentId]);

  return { stats, loading };
}
