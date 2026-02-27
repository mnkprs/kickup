import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Plus, SlidersHorizontal, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTeams } from '../../hooks/useTeams';
import { useAreas } from '../../hooks/useConfig';
import type { Team } from '../../types/database';

const FORMATS = ['All', '5v5', '6v6', '7v7', '8v8', '11v11'];

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span style={{ fontSize: '11px', color, fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function TeamCard({ team, isDark, onNavigate }: { team: Team; isDark: boolean; onNavigate: (p: string) => void }) {
  const cardBg = isDark ? '#2D2C31' : 'white';
  const textPrimary = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#CAC4D0' : '#49454F';
  const borderColor = isDark ? '#49454F' : '#E7E0EC';

  const total = team.record_w + team.record_d + team.record_l;
  const winRate = total > 0 ? Math.round((team.record_w / total) * 100) : 0;

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ background: cardBg, borderColor, boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* Colored banner strip */}
      <div className="h-2 w-full" style={{ background: team.color }} />

      <button onClick={() => onNavigate(`/app/teams/${team.id}`)} className="w-full text-left">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `${team.color}20`, border: `2px solid ${team.color}40` }}>
              <span style={{ fontSize: '28px' }}>{team.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontSize: '16px', fontWeight: 500, color: textPrimary }}>{team.name}</span>
                {team.searching_for_opponent && (
                  <span className="px-2 py-0.5 rounded-full" style={{ background: '#E8F5E9', color: '#2E7D32', fontSize: '10px', fontWeight: 700 }}>
                    ⚔️ Open
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <div className="flex items-center gap-1">
                  <MapPin size={11} color={textSecondary} />
                  <span style={{ fontSize: '12px', color: textSecondary }}>{team.area}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full border" style={{ borderColor: '#CAC4D0', color: textSecondary, fontSize: '11px' }}>{team.format}</span>
                {team.open_spots > 0 && (
                  <span className="px-2 py-0.5 rounded-full" style={{ background: '#FFF3E0', color: '#E65100', fontSize: '10px', fontWeight: 700 }}>
                    {team.open_spots} spot{team.open_spots > 1 ? 's' : ''} open
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t" style={{ borderColor }}>
            <StatPill label="W" value={team.record_w} color="#2E7D32" />
            <StatPill label="D" value={team.record_d} color="#1565C0" />
            <StatPill label="L" value={team.record_l} color="#B3261E" />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: isDark ? '#49454F' : '#E0E0E0' }}>
                <div className="h-full rounded-full" style={{ width: `${winRate}%`, background: '#2E7D32' }} />
              </div>
              <span style={{ fontSize: '11px', color: textSecondary }}>{winRate}%</span>
            </div>
          </div>
        </div>
      </button>

      {/* Action buttons — always shown */}
      <div className="px-4 pb-4 flex gap-2">
        <button onClick={() => onNavigate(`/app/teams/${team.id}`)}
          className="flex-1 h-[40px] rounded-xl border flex items-center justify-center"
          style={{ borderColor: '#2E7D32', color: '#2E7D32', fontSize: '14px', fontWeight: 500 }}>
          View Profile
        </button>
        <button onClick={() => onNavigate('/app/matches/challenge')}
          className="flex-1 h-[40px] rounded-xl flex items-center justify-center gap-1"
          style={{ background: '#2E7D32', color: 'white', fontSize: '14px', fontWeight: 500 }}>
          ⚔️ Challenge
        </button>
      </div>
    </div>
  );
}

export function TeamsList() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All Areas');
  const [opponentOnly, setOpponentOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { teams, loading } = useTeams();
  const { areas } = useAreas();

  const bg = isDark ? '#1C1B1F' : '#FFFBFE';
  const cardBg = isDark ? '#2D2C31' : 'white';
  const textPrimary = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#CAC4D0' : '#49454F';
  const borderColor = isDark ? '#49454F' : '#E7E0EC';

  const filtered = teams.filter(t => {
    const matchQuery = t.name.toLowerCase().includes(query.toLowerCase()) || t.area.toLowerCase().includes(query.toLowerCase());
    const matchFormat = formatFilter === 'All' || t.format === formatFilter;
    const matchArea = areaFilter === 'All Areas' || t.area === areaFilter;
    const matchOpponent = !opponentOnly || t.searching_for_opponent;
    return matchQuery && matchFormat && matchArea && matchOpponent;
  });

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4" style={{ background: bg }}>
        <div className="flex items-center justify-between mb-4">
          <h1 style={{ fontSize: '24px', fontWeight: 500, color: textPrimary }}>Teams</h1>
          <button onClick={() => navigate('/app/teams/create')}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl"
            style={{ background: '#2E7D32', color: 'white', fontSize: '14px', fontWeight: 500 }}>
            <Plus size={16} color="white" />
            New Team
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={18} color={textSecondary} className="absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search teams or areas..."
            className="w-full h-[52px] pl-12 pr-10 rounded-2xl outline-none border-2"
            style={{ background: isDark ? '#2D2C31' : '#F1F8F2', borderColor: query ? '#2E7D32' : 'transparent', fontSize: '15px', color: textPrimary, fontFamily: 'Roboto, sans-serif' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X size={16} color={textSecondary} />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border shrink-0"
            style={{ borderColor: showFilters ? '#2E7D32' : borderColor, background: showFilters ? '#E8F5E9' : cardBg, color: showFilters ? '#2E7D32' : textSecondary, fontSize: '13px', fontWeight: 500 }}>
            <SlidersHorizontal size={13} /> Filters
          </button>
          {FORMATS.filter(f => f !== 'All').map(f => (
            <button key={f} onClick={() => setFormatFilter(formatFilter === f ? 'All' : f)}
              className="px-3 py-1.5 rounded-full border shrink-0"
              style={{ borderColor: formatFilter === f ? '#2E7D32' : borderColor, background: formatFilter === f ? '#E8F5E9' : cardBg, color: formatFilter === f ? '#2E7D32' : textSecondary, fontSize: '13px', fontWeight: formatFilter === f ? 700 : 400 }}>
              {f}
            </button>
          ))}
          <button onClick={() => setOpponentOnly(!opponentOnly)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border shrink-0"
            style={{ borderColor: opponentOnly ? '#2E7D32' : borderColor, background: opponentOnly ? '#E8F5E9' : cardBg, color: opponentOnly ? '#2E7D32' : textSecondary, fontSize: '13px', fontWeight: opponentOnly ? 700 : 400 }}>
            ⚔️ Searching
          </button>
        </div>

        {/* Expandable area filter */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-3">
                <p style={{ fontSize: '12px', fontWeight: 500, color: textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Area</p>
                <div className="flex gap-2 flex-wrap">
                  {['All Areas', ...areas].map(a => (
                    <button key={a} onClick={() => setAreaFilter(a)}
                      className="px-3 py-1.5 rounded-full border"
                      style={{ borderColor: areaFilter === a ? '#2E7D32' : borderColor, background: areaFilter === a ? '#E8F5E9' : cardBg, color: areaFilter === a ? '#2E7D32' : textSecondary, fontSize: '12px', fontWeight: areaFilter === a ? 700 : 400 }}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Count */}
      <div className="px-4 pb-2">
        <p style={{ fontSize: '13px', color: textSecondary }}>
          {loading ? 'Loading...' : `${filtered.length} team${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-4 px-4">
          <span style={{ fontSize: '64px' }}>😕</span>
          <div className="text-center">
            <p style={{ fontSize: '18px', fontWeight: 500, color: textPrimary }}>No teams found</p>
            <p style={{ fontSize: '14px', color: textSecondary, marginTop: '4px' }}>Try adjusting your filters or create a new team!</p>
          </div>
          <button onClick={() => navigate('/app/teams/create')}
            className="px-6 py-3 rounded-2xl"
            style={{ background: '#2E7D32', color: 'white', fontSize: '15px', fontWeight: 500 }}>
            Create a Team
          </button>
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-3 pb-24">
          {filtered.map((team, i) => (
            <motion.div key={team.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <TeamCard team={team} isDark={isDark} onNavigate={navigate} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
