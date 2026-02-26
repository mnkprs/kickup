import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Search, MapPin, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTeams } from '../../hooks/useTeams';

const FORMATS = ['All', '5v5', '6v6', '7v7', '8v8', '11v11'];

function WinBar({ w, d, l }: { w: number; d: number; l: number }) {
  const total = w + d + l;
  if (total === 0) return null;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden w-full mt-1">
      <div style={{ width: `${(w / total) * 100}%`, background: '#2E7D32' }} />
      <div style={{ width: `${(d / total) * 100}%`, background: '#1565C0' }} />
      <div style={{ width: `${(l / total) * 100}%`, background: '#B3261E' }} />
    </div>
  );
}

export function TeamsList() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState('All');
  const { teams, loading } = useTeams();

  const bg = isDark ? '#1C1B1F' : '#FFFBFE';
  const cardBg = isDark ? '#2D2C31' : 'white';
  const textPrimary = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#CAC4D0' : '#49454F';
  const borderColor = isDark ? '#49454F' : '#E7E0EC';
  const inputBg = isDark ? '#2D2C31' : 'white';

  const filtered = teams.filter(t => {
    const matchesQuery = t.name.toLowerCase().includes(query.toLowerCase()) || t.area.toLowerCase().includes(query.toLowerCase());
    const matchesFormat = format === 'All' || t.format === format;
    return matchesQuery && matchesFormat;
  });

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      <div className="px-4 pt-12 pb-3 sticky top-0 z-20" style={{ background: bg, borderBottom: `1px solid ${borderColor}` }}>
        <h1 style={{ fontSize: '24px', fontWeight: 500, color: textPrimary, marginBottom: '12px' }}>Teams</h1>
        <div className="relative">
          <Search size={18} color={textSecondary} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search teams or area..."
            className="w-full h-[44px] pl-10 pr-4 rounded-2xl border"
            style={{ background: inputBg, borderColor, color: textPrimary, fontSize: '15px', outline: 'none' }}
          />
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {FORMATS.map(f => (
            <button key={f} onClick={() => setFormat(f)}
              className="px-3 py-1 rounded-full shrink-0 transition-all"
              style={{
                background: format === f ? '#2E7D32' : (isDark ? '#49454F' : '#E7E0EC'),
                color: format === f ? 'white' : textSecondary,
                fontSize: '13px', fontWeight: format === f ? 600 : 400,
              }}>
              {f}
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
          {filtered.map((team, i) => {
            const total = team.record_w + team.record_d + team.record_l;
            const winRate = total > 0 ? Math.round((team.record_w / total) * 100) : 0;
            return (
              <motion.button key={team.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/app/teams/${team.id}`)}
                className="w-full p-4 rounded-2xl border text-left"
                style={{ background: cardBg, borderColor, boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: isDark ? '#1E2B1E' : '#E8F5E9' }}>
                    <span style={{ fontSize: '28px' }}>{team.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '16px', fontWeight: 600, color: textPrimary }}>{team.name}</span>
                      <ChevronRight size={16} color={textSecondary} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full border" style={{ borderColor: '#CAC4D0', color: textSecondary, fontSize: '11px' }}>{team.format}</span>
                      <div className="flex items-center gap-1">
                        <MapPin size={11} color={textSecondary} />
                        <span style={{ fontSize: '12px', color: textSecondary }}>{team.area}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span style={{ fontSize: '12px', color: '#2E7D32', fontWeight: 500 }}>{team.record_w}W</span>
                      <span style={{ fontSize: '12px', color: '#1565C0' }}>{team.record_d}D</span>
                      <span style={{ fontSize: '12px', color: '#B3261E' }}>{team.record_l}L</span>
                      <span style={{ fontSize: '12px', color: textSecondary, marginLeft: 'auto' }}>{winRate}% win</span>
                    </div>
                    <WinBar w={team.record_w} d={team.record_d} l={team.record_l} />
                  </div>
                </div>
                {team.searching_for_opponent && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="px-2 py-1 rounded-full" style={{ background: '#E8F5E9', color: '#2E7D32', fontSize: '11px', fontWeight: 700 }}>
                      ⚔️ Looking for opponent
                    </span>
                    <button onClick={e => { e.stopPropagation(); navigate('/app/matches/challenge'); }}
                      className="px-3 py-1.5 rounded-xl"
                      style={{ background: '#2E7D32', color: 'white', fontSize: '13px', fontWeight: 500 }}>
                      Challenge
                    </button>
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
