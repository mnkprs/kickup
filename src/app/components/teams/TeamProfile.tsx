import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, MapPin, Users, Swords } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTeam } from '../../hooks/useTeam';
import { useMatches } from '../../hooks/useMatches';
import { formatMatchDate } from '../../lib/formatDate';
import type { MatchWithTeams } from '../../types/database';

function matchResult(match: MatchWithTeams, teamId: string): 'win' | 'loss' | 'draw' | null {
  if (match.home_score === null || match.away_score === null) return null;
  const isHome = match.home_team_id === teamId;
  const my = isHome ? match.home_score : match.away_score;
  const their = isHome ? match.away_score : match.home_score;
  if (my > their) return 'win';
  if (my < their) return 'loss';
  return 'draw';
}

export function TeamProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { team, loading: teamLoading } = useTeam(id);
  const { matches, loading: matchesLoading } = useMatches();

  const bg = isDark ? '#1C1B1F' : '#FFFBFE';
  const cardBg = isDark ? '#2D2C31' : 'white';
  const textPrimary = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#CAC4D0' : '#49454F';
  const borderColor = isDark ? '#49454F' : '#E7E0EC';

  if (teamLoading || matchesLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: bg }}>
        <div className="w-8 h-8 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: bg }}>
        <p style={{ color: textSecondary }}>Team not found</p>
      </div>
    );
  }

  const teamMatches = matches.filter(m => m.home_team_id === team.id || m.away_team_id === team.id);
  const completedMatches = teamMatches.filter(m => m.status === 'completed').slice(0, 5);
  const total = team.record_w + team.record_d + team.record_l;
  const winRate = total > 0 ? Math.round((team.record_w / total) * 100) : 0;

  const statItems = [
    { label: 'Played', value: total },
    { label: 'Won', value: team.record_w, color: '#2E7D32' },
    { label: 'Drawn', value: team.record_d, color: '#1565C0' },
    { label: 'Lost', value: team.record_l, color: '#B3261E' },
    { label: 'Goals For', value: team.record_gf },
    { label: 'Goals Against', value: team.record_ga },
  ];

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      <div className="relative h-48" style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #43A047 100%)' }}>
        <button onClick={() => navigate(-1)} className="absolute top-12 left-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)' }}>
          <ArrowLeft size={20} color="white" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex items-end gap-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.3)', fontSize: '40px' }}>
            {team.emoji}
          </div>
          <div className="pb-1">
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'white' }}>{team.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '11px', fontWeight: 600 }}>{team.format}</span>
              <div className="flex items-center gap-1">
                <MapPin size={11} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{team.area}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-24">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-2 mb-4">
          {statItems.map(s => (
            <div key={s.label} className="p-3 rounded-2xl border text-center" style={{ background: cardBg, borderColor }}>
              <p style={{ fontSize: '22px', fontWeight: 700, color: s.color || textPrimary }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: textSecondary, marginTop: '2px' }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        <div className="p-4 rounded-2xl border mb-4" style={{ background: cardBg, borderColor }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>Win Rate</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#2E7D32' }}>{winRate}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? '#49454F' : '#E7E0EC' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${winRate}%` }} transition={{ duration: 0.8, delay: 0.2 }}
              className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #2E7D32, #66BB6A)' }} />
          </div>
        </div>

        {team.team_members && team.team_members.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} color={textSecondary} />
              <h2 style={{ fontSize: '16px', fontWeight: 500, color: textPrimary }}>Squad ({team.team_members.length})</h2>
            </div>
            <div className="flex flex-col gap-2">
              {team.team_members.map(tm => {
                const p = tm.profiles;
                if (!p) return null;
                return (
                  <div key={tm.id} className="flex items-center gap-3 p-3 rounded-2xl border"
                    style={{ background: cardBg, borderColor }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{ background: p.avatar_color, fontSize: '14px', fontWeight: 700 }}>
                      {p.avatar_initials}
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>{p.full_name}</p>
                      <div className="flex items-center gap-2">
                        {p.position && <span style={{ fontSize: '12px', color: textSecondary }}>{p.position}</span>}
                        {tm.role === 'captain' && <span style={{ fontSize: '11px', color: '#E65100', fontWeight: 700 }}>Captain</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {completedMatches.length > 0 && (
          <div className="mb-4">
            <h2 style={{ fontSize: '16px', fontWeight: 500, color: textPrimary, marginBottom: '12px' }}>Recent Matches</h2>
            <div className="flex flex-col gap-2">
              {completedMatches.map(match => {
                const isHome = match.home_team_id === team.id;
                const opponent = isHome ? match.away_team : match.home_team;
                const result = matchResult(match, team.id);
                const resultColor = result === 'win' ? '#2E7D32' : result === 'loss' ? '#B3261E' : '#1565C0';
                const scoreStr = match.home_score !== null ? `${match.home_score} – ${match.away_score}` : '–';
                return (
                  <button key={match.id} onClick={() => navigate(`/app/matches/${match.id}/pre`)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl border text-left"
                    style={{ background: cardBg, borderColor }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: resultColor + '20', color: resultColor, fontSize: '11px', fontWeight: 700 }}>
                      {result?.toUpperCase().slice(0, 1) || '?'}
                    </div>
                    <div className="flex-1">
                      <span style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>
                        vs {opponent?.name || 'Unknown'}
                      </span>
                      <p style={{ fontSize: '12px', color: textSecondary }}>{formatMatchDate(match.match_date, null)}</p>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: resultColor }}>{scoreStr}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={() => navigate('/app/matches/challenge')}
          className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)', boxShadow: '0 4px 12px rgba(46,125,50,0.35)' }}>
          <Swords size={20} color="white" />
          <span style={{ fontSize: '16px', fontWeight: 500, color: 'white' }}>Challenge This Team</span>
        </button>
      </div>
    </div>
  );
}
