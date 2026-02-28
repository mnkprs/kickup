import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Trophy, MapPin, Plus, Calendar, Users } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { useTournaments } from '../../hooks/useTournaments';
import type { Tournament, TournamentStatus } from '../../types/database';

const STATUS_LABELS: Record<TournamentStatus, { label: string; color: string; bg: string }> = {
  registration: { label: 'Registration Open', color: '#1565C0', bg: '#E3F2FD' },
  group_stage:  { label: 'Group Stage',        color: '#E65100', bg: '#FFF3E0' },
  knockout_stage: { label: 'Knockouts',         color: '#6A1B9A', bg: '#F3E5F5' },
  completed:    { label: 'Completed',           color: '#4E4E4E', bg: '#EEEEEE' },
};

const FORMATS = ['All', '5v5', '6v6', '7v7', '8v8', '11v11'];
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
      {/* Purple top bar */}
      <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #6A1B9A, #AB47BC)' }} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: '#F3E5F5' }}>
            <Trophy size={24} color="#6A1B9A" />
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
  const { bg, textPrimary, textSecondary, borderColor, cardBg } = useThemeColors();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState('All');

  const { tournaments, loading } = useTournaments();

  const filtered = tournaments.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchFormat = formatFilter === 'All' || t.match_format === formatFilter;
    return matchStatus && matchFormat;
  });

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4" style={{ background: bg }}>
        <div className="flex items-center justify-between mb-4">
          <h1 style={{ fontSize: '24px', fontWeight: 500, color: textPrimary }}>Tournaments</h1>
          {profile?.is_field_owner ? (
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

        {/* Status filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: 'none' }}>
          {STATUSES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key as TournamentStatus | 'all')}
              className="px-3 py-1.5 rounded-full border shrink-0"
              style={{
                borderColor: statusFilter === key ? '#6A1B9A' : borderColor,
                background: statusFilter === key ? '#F3E5F5' : cardBg,
                color: statusFilter === key ? '#6A1B9A' : textSecondary,
                fontSize: '13px',
                fontWeight: statusFilter === key ? 700 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Format filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {FORMATS.map(f => (
            <button
              key={f}
              onClick={() => setFormatFilter(formatFilter === f ? 'All' : f)}
              className="px-3 py-1.5 rounded-full border shrink-0"
              style={{
                borderColor: formatFilter === f ? '#6A1B9A' : borderColor,
                background: formatFilter === f ? '#F3E5F5' : cardBg,
                color: formatFilter === f ? '#6A1B9A' : textSecondary,
                fontSize: '13px',
                fontWeight: formatFilter === f ? 700 : 400,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="px-4 pb-2">
        <p style={{ fontSize: '13px', color: textSecondary }}>
          {loading ? 'Loading...' : `${filtered.length} tournament${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-[#6A1B9A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-4 px-4">
          <Trophy size={64} color={textSecondary} />
          <div className="text-center">
            <p style={{ fontSize: '18px', fontWeight: 500, color: textPrimary }}>No tournaments yet</p>
            <p style={{ fontSize: '14px', color: textSecondary, marginTop: '4px' }}>
              {profile?.is_field_owner
                ? 'Create your first tournament!'
                : 'Check back soon for upcoming tournaments.'}
            </p>
          </div>
          {profile?.is_field_owner ? (
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
        <div className="px-4 flex flex-col gap-3 pb-24">
          {filtered.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <TournamentCard t={t} onNavigate={navigate} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
