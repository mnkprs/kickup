import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, MapPin, Plus, Calendar, Users, X } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { useTournaments } from '../../hooks/useTournaments';
import { supabase } from '../../lib/supabase';
import type { Tournament, TournamentStatus } from '../../types/database';

const STATUS_LABELS: Record<TournamentStatus, { label: string; color: string; bg: string; gradient: string }> = {
  registration:   { label: 'Registration Open', color: '#1565C0', bg: '#E3F2FD', gradient: 'linear-gradient(90deg, #1565C0, #1976D2)' },
  group_stage:    { label: 'Group Stage',        color: '#E65100', bg: '#FFF3E0', gradient: 'linear-gradient(90deg, #E65100, #F4511E)' },
  knockout_stage: { label: 'Knockouts',          color: '#6A1B9A', bg: '#F3E5F5', gradient: 'linear-gradient(90deg, #6A1B9A, #AB47BC)' },
  completed:      { label: 'Completed',          color: '#4E4E4E', bg: '#EEEEEE', gradient: 'linear-gradient(90deg, #4E4E4E, #757575)' },
};

const FORMATS = ['All', '5v5', '6v6', '7v7', '8v8'];
const STATUSES: Array<{ key: TournamentStatus | 'all'; label: string }> = [
  { key: 'all',            label: 'All' },
  { key: 'registration',   label: 'Registration' },
  { key: 'group_stage',    label: 'Active' },
  { key: 'knockout_stage', label: 'Knockouts' },
  { key: 'completed',      label: 'Completed' },
];

function TournamentCard({ t, onNavigate }: { t: Tournament; onNavigate: (p: string) => void }) {
  const { isDark, cardBg, textPrimary, textSecondary, borderColor } = useThemeColors();
  const s = STATUS_LABELS[t.status];

  return (
    <button
      onClick={() => onNavigate(`/app/tournaments/${t.id}`)}
      className="w-full text-left rounded-2xl border overflow-hidden"
      style={{ background: cardBg, borderColor, boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      {/* Status-colored top bar */}
      <div className="h-2 w-full" style={{ background: s.gradient }} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: s.bg }}>
            <Trophy size={24} color={s.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <span style={{ fontSize: '16px', fontWeight: 500, color: textPrimary }}>{t.name}</span>
              <span className="px-2 py-0.5 rounded-full shrink-0"
                style={{ background: s.bg, color: s.color, fontSize: '10px', fontWeight: 700 }}>
                {s.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {t.area ? (
                <div className="flex items-center gap-1">
                  <MapPin size={11} color={textSecondary} />
                  <span style={{ fontSize: '12px', color: textSecondary }}>{t.area}</span>
                </div>
              ) : null}
              <span className="px-2 py-0.5 rounded-full border"
                style={{ borderColor: '#CAC4D0', color: textSecondary, fontSize: '11px' }}>
                {t.match_format}
              </span>
              <div className="flex items-center gap-1">
                <Users size={11} color={textSecondary} />
                <span style={{ fontSize: '12px', color: textSecondary }}>{t.max_teams} teams</span>
              </div>
            </div>
          </div>
        </div>
        {(t.start_date || t.prize) ? (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t flex-wrap" style={{ borderColor }}>
            {t.start_date ? (
              <div className="flex items-center gap-1">
                <Calendar size={12} color={textSecondary} />
                <span style={{ fontSize: '12px', color: textSecondary }}>
                  {new Date(t.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            ) : null}
            {t.prize ? (
              <span style={{ fontSize: '12px', color: '#6A1B9A', fontWeight: 500 }}>🏆 {t.prize}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </button>
  );
}

export function TournamentsList() {
  const { isDark, bg, textPrimary, textSecondary, borderColor } = useThemeColors();
  const navigate = useNavigate();
  const { profile, isAdmin, captainTeam, playerTeams } = useAuth();

  const [statusFilter, setStatusFilter] = useState<TournamentStatus | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState('All');
  const [participatingOnly, setParticipatingOnly] = useState(false);
  const [areaFilter, setAreaFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);

  const { tournaments, loading } = useTournaments();

  // Let Layout FAB trigger filter open
  useEffect(() => {
    const handler = () => setFilterOpen(true);
    window.addEventListener('openTournamentFilter', handler);
    return () => window.removeEventListener('openTournamentFilter', handler);
  }, []);

  // Fetch tournaments the user's teams are registered in
  const [participatingIds, setParticipatingIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const teamIds = [captainTeam?.id, ...playerTeams.map(t => t.id)].filter(Boolean) as string[];
    if (teamIds.length === 0) return;
    supabase
      .from('tournament_registrations')
      .select('tournament_id')
      .in('team_id', teamIds)
      .then(({ data }) => setParticipatingIds(new Set((data ?? []).map(r => r.tournament_id))));
  }, [captainTeam, playerTeams]);

  // Unique areas from loaded tournaments
  const areas = useMemo(() => {
    const set = new Set(tournaments.map(t => t.area).filter(Boolean) as string[]);
    return ['All', ...Array.from(set).sort()];
  }, [tournaments]);

  const filtered = tournaments.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (formatFilter !== 'All' && t.match_format !== formatFilter) return false;
    if (participatingOnly && !participatingIds.has(t.id)) return false;
    if (areaFilter !== 'All' && t.area !== areaFilter) return false;
    return true;
  });

  const activeFilterCount = [
    statusFilter !== 'all',
    formatFilter !== 'All',
    participatingOnly,
    areaFilter !== 'All',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter('all');
    setFormatFilter('All');
    setParticipatingOnly(false);
    setAreaFilter('All');
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-3 sticky top-0 z-20" style={{ background: bg, borderBottom: `1px solid ${borderColor}` }}>
        <div className="flex items-center justify-between">
          <h1 style={{ fontSize: '24px', fontWeight: 500, color: textPrimary }}>Tournaments</h1>
          {profile?.is_field_owner || isAdmin ? (
            <button
              onClick={() => navigate('/app/tournaments/create')}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl"
              style={{ background: '#6A1B9A', color: 'white', fontSize: '14px', fontWeight: 500 }}
            >
              <Plus size={16} color="white" />
              Create
            </button>
          ) : null}
        </div>
      </div>

      {/* Count row */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <p style={{ fontSize: '13px', color: textSecondary }}>
          {loading ? 'Loading…' : `${filtered.length} tournament${filtered.length !== 1 ? 's' : ''}`}
        </p>
        {activeFilterCount > 0 ? (
          <button onClick={clearFilters} style={{ fontSize: '13px', color: '#6A1B9A', fontWeight: 500 }}>
            Clear filters
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-[#6A1B9A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-4 px-4">
          <Trophy size={64} color={textSecondary} />
          <div className="text-center">
            <p style={{ fontSize: '18px', fontWeight: 500, color: textPrimary }}>No tournaments found</p>
            <p style={{ fontSize: '14px', color: textSecondary, marginTop: '4px' }}>
              {profile?.is_field_owner || isAdmin
                ? 'Create your first tournament!'
                : 'Try adjusting your filters or check back soon.'}
            </p>
          </div>
          {profile?.is_field_owner || isAdmin ? (
            <button
              onClick={() => navigate('/app/tournaments/create')}
              className="px-6 py-3 rounded-2xl"
              style={{ background: '#6A1B9A', color: 'white', fontSize: '15px', fontWeight: 500 }}
            >
              Create Tournament
            </button>
          ) : null}
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-3 pb-24 pt-2">
          {filtered.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <TournamentCard t={t} onNavigate={navigate} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Filter bottom sheet */}
      <AnimatePresence>
        {filterOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setFilterOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="w-full max-w-[430px] rounded-t-3xl overflow-hidden"
                style={{ background: isDark ? '#2D2C31' : 'white', maxHeight: '80vh', overflowY: 'auto' }}>
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full" style={{ background: isDark ? '#49454F' : '#E7E0EC' }} />
                </div>

                <div className="px-5 pb-2 flex items-center justify-between">
                  <p style={{ fontSize: '18px', fontWeight: 600, color: textPrimary }}>Filters</p>
                  <div className="flex items-center gap-3">
                    {activeFilterCount > 0 ? (
                      <button onClick={clearFilters} style={{ fontSize: '14px', color: '#6A1B9A', fontWeight: 500 }}>
                        Clear all
                      </button>
                    ) : null}
                    <button onClick={() => setFilterOpen(false)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: isDark ? '#49454F' : '#F3EDF7' }}>
                      <X size={16} color={textPrimary} />
                    </button>
                  </div>
                </div>

                <div className="px-5 pb-8 flex flex-col gap-6">
                  {/* Status */}
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                      Status
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map(({ key, label }) => (
                        <button key={key}
                          onClick={() => setStatusFilter(key as TournamentStatus | 'all')}
                          className="px-3 py-2 rounded-full border"
                          style={{
                            borderColor: statusFilter === key ? '#6A1B9A' : borderColor,
                            background: statusFilter === key ? '#F3E5F5' : 'transparent',
                            color: statusFilter === key ? '#6A1B9A' : textSecondary,
                            fontSize: '14px', fontWeight: statusFilter === key ? 700 : 400,
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Format */}
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                      Team Size
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {FORMATS.map(f => (
                        <button key={f}
                          onClick={() => setFormatFilter(f)}
                          className="px-3 py-2 rounded-full border"
                          style={{
                            borderColor: formatFilter === f ? '#6A1B9A' : borderColor,
                            background: formatFilter === f ? '#F3E5F5' : 'transparent',
                            color: formatFilter === f ? '#6A1B9A' : textSecondary,
                            fontSize: '14px', fontWeight: formatFilter === f ? 700 : 400,
                          }}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* My Team Participating */}
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>My Team Participating</p>
                      <p style={{ fontSize: '12px', color: textSecondary }}>Show only tournaments my team joined</p>
                    </div>
                    <button onClick={() => setParticipatingOnly(v => !v)}
                      className="w-12 h-6 rounded-full relative transition-colors"
                      style={{ background: participatingOnly ? '#6A1B9A' : (isDark ? '#49454F' : '#E7E0EC') }}>
                      <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                        style={{ left: participatingOnly ? 'calc(100% - 22px)' : '2px' }} />
                    </button>
                  </div>

                  {/* Area */}
                  {areas.length > 2 ? (
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                        Area
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {areas.map(a => (
                          <button key={a}
                            onClick={() => setAreaFilter(a)}
                            className="px-3 py-2 rounded-full border"
                            style={{
                              borderColor: areaFilter === a ? '#6A1B9A' : borderColor,
                              background: areaFilter === a ? '#F3E5F5' : 'transparent',
                              color: areaFilter === a ? '#6A1B9A' : textSecondary,
                              fontSize: '14px', fontWeight: areaFilter === a ? 700 : 400,
                            }}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Apply button */}
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="w-full h-[52px] rounded-2xl"
                    style={{ background: '#6A1B9A', color: 'white', fontSize: '16px', fontWeight: 500 }}
                  >
                    Show {filtered.length} tournament{filtered.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
