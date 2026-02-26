import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Clock, MapPin } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useMatches } from '../../hooks/useMatches';
import { formatMatchDate } from '../../lib/formatDate';

const TABS = ['Upcoming', 'Pending', 'History'];

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    pre_match: { bg: '#E3F2FD', text: '#1565C0', label: 'Upcoming' },
    scheduling: { bg: '#FFF3E0', text: '#E65100', label: 'Scheduling' },
    pending_result: { bg: '#FFF3E0', text: '#E65100', label: 'Pending Result' },
    completed: { bg: '#E8F5E9', text: '#2E7D32', label: 'Completed' },
    disputed: { bg: '#FFEBEE', text: '#B3261E', label: 'Disputed' },
  };
  const c = configs[status] || { bg: '#F3EDF7', text: '#6750A4', label: status };
  return (
    <span className="px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text, fontSize: '11px', fontWeight: 700 }}>
      {c.label}
    </span>
  );
}

export function MatchesList() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Upcoming');
  const { matches, loading } = useMatches();

  const bg = isDark ? '#1C1B1F' : '#FFFBFE';
  const cardBg = isDark ? '#2D2C31' : 'white';
  const textPrimary = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#CAC4D0' : '#49454F';
  const borderColor = isDark ? '#49454F' : '#E7E0EC';

  const filtered = matches.filter(m => {
    if (tab === 'Upcoming') return m.status === 'pre_match' || m.status === 'scheduling';
    if (tab === 'Pending') return m.status === 'pending_challenge' || m.status === 'disputed';
    return m.status === 'completed';
  });

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      <div className="px-4 pt-12 pb-3 sticky top-0 z-20" style={{ background: bg, borderBottom: `1px solid ${borderColor}` }}>
        <h1 style={{ fontSize: '24px', fontWeight: 500, color: textPrimary, marginBottom: '12px' }}>Matches</h1>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl transition-all"
              style={{
                background: tab === t ? '#2E7D32' : 'transparent',
                color: tab === t ? 'white' : textSecondary,
                fontSize: '14px', fontWeight: tab === t ? 600 : 400,
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 pt-4 pb-24 flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 pt-16">
              <span style={{ fontSize: '48px' }}>📭</span>
              <p style={{ fontSize: '16px', color: textSecondary }}>No {tab.toLowerCase()} matches</p>
            </div>
          )}
          {filtered.map((match, i) => {
            const homeTeam = match.home_team;
            const awayTeam = match.away_team;
            if (!homeTeam || !awayTeam) return null;
            return (
              <motion.button key={match.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/app/matches/${match.id}/pre`)}
                className="w-full p-4 rounded-2xl border text-left"
                style={{ background: cardBg, borderColor, boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full border" style={{ borderColor: '#CAC4D0', color: textSecondary, fontSize: '11px' }}>{match.format}</span>
                    <StatusBadge status={match.status} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <span style={{ fontSize: '28px' }}>{homeTeam.emoji}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>{homeTeam.short_name}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 px-4">
                    {match.home_score !== null ? (
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '24px', fontWeight: 700, color: textPrimary }}>{match.home_score}</span>
                        <span style={{ fontSize: '16px', color: textSecondary }}>–</span>
                        <span style={{ fontSize: '24px', fontWeight: 700, color: textPrimary }}>{match.away_score}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '20px', fontWeight: 700, color: textSecondary }}>VS</span>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <span style={{ fontSize: '28px' }}>{awayTeam.emoji}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>{awayTeam.short_name}</span>
                  </div>
                </div>
                {(match.match_date || match.location) && (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t" style={{ borderColor }}>
                    {match.match_date && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} color={textSecondary} />
                        <span style={{ fontSize: '12px', color: textSecondary }}>{formatMatchDate(match.match_date, match.match_time)}</span>
                      </div>
                    )}
                    {match.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={12} color={textSecondary} />
                        <span style={{ fontSize: '12px', color: textSecondary }}>{match.location}</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
