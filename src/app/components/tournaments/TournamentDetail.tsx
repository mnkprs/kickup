import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, Trophy, MapPin, Calendar, Users, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTournamentDetail, useTournamentStandings } from '../../hooks/useTournamentDetail';
import { supabase } from '../../lib/supabase';
import type { TournamentStatus } from '../../types/database';

const STATUS_LABELS: Record<TournamentStatus, { label: string; color: string; bg: string }> = {
  registration:   { label: 'Registration Open', color: '#1565C0', bg: '#E3F2FD' },
  group_stage:    { label: 'Group Stage',        color: '#E65100', bg: '#FFF3E0' },
  knockout_stage: { label: 'Knockouts',          color: '#6A1B9A', bg: '#F3E5F5' },
  completed:      { label: 'Completed',          color: '#4E4E4E', bg: '#EEEEEE' },
};

type TabKey = 'standings' | 'bracket' | 'teams';

function StandingsTable({ tournamentId, groupLabel, isDark }: { tournamentId: string; groupLabel: string; isDark: boolean }) {
  const { standings, loading } = useTournamentStandings(tournamentId, groupLabel);
  const textPrimary = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#CAC4D0' : '#49454F';
  const borderColor = isDark ? '#49454F' : '#E7E0EC';
  const cardBg = isDark ? '#2D2C31' : 'white';

  return (
    <div className="mb-4">
      <p className="mb-2 px-1" style={{ fontSize: '13px', fontWeight: 700, color: '#6A1B9A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Group {groupLabel}
      </p>
      <div className="rounded-2xl overflow-hidden border" style={{ background: cardBg, borderColor }}>
        {/* Header row */}
        <div className="flex items-center px-3 py-2 border-b" style={{ borderColor }}>
          <span style={{ flex: 3, fontSize: '11px', fontWeight: 700, color: textSecondary, textTransform: 'uppercase' }}>Team</span>
          {['P','W','D','L','GF','GA','GD','Pts'].map(h => (
            <span key={h} style={{ flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: 700, color: textSecondary }}>{h}</span>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-[#6A1B9A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : standings.length === 0 ? (
          <p className="text-center py-4" style={{ fontSize: '13px', color: textSecondary }}>No data yet</p>
        ) : standings.map((row, i) => (
          <div
            key={row.team_id}
            className="flex items-center px-3 py-2 border-b last:border-b-0"
            style={{ borderColor, background: i % 2 === 0 ? 'transparent' : (isDark ? '#33313A' : '#FAFAFA') }}
          >
            <div style={{ flex: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: i < 2 ? '#6A1B9A' : textSecondary, minWidth: '16px' }}>{row.rank}</span>
              <span style={{ fontSize: '12px' }}>{row.emoji}</span>
              <span style={{ fontSize: '13px', color: textPrimary, fontWeight: i < 2 ? 600 : 400 }} className="truncate">{row.name}</span>
            </div>
            {[row.played, row.w, row.d, row.l, row.gf, row.ga, row.gd, row.pts].map((v, vi) => (
              <span key={vi} style={{ flex: 1, textAlign: 'center', fontSize: '13px', color: vi === 7 ? '#6A1B9A' : textPrimary, fontWeight: vi === 7 ? 700 : 400 }}>{v}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user, captainTeam } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('standings');
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState('');

  const { detail, loading, refresh } = useTournamentDetail(id);

  const bg = isDark ? '#1C1B1F' : '#FFFBFE';
  const cardBg = isDark ? '#2D2C31' : 'white';
  const textPrimary = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#CAC4D0' : '#49454F';
  const borderColor = isDark ? '#49454F' : '#E7E0EC';

  if (loading) {
    return (
      <div style={{ background: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-8 h-8 border-2 border-[#6A1B9A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={{ background: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: textSecondary }}>Tournament not found.</p>
      </div>
    );
  }

  const { tournament, registrations, groups, tournamentMatches } = detail;
  const s = STATUS_LABELS[tournament.status];
  const isOrganizer = user?.id === tournament.organizer_id;
  const approvedTeams = registrations.filter(r => r.status === 'approved');

  const myTeamId = captainTeam?.id;
  const myReg = myTeamId ? registrations.find(r => r.team_id === myTeamId) : null;
  const canRegister = !!myTeamId && !myReg && tournament.status === 'registration';

  // Unique group labels
  const groupLabels = [...new Set(groups.map(g => g.group_label))].sort();

  // Knockout matches
  const semiFinals = tournamentMatches.filter(tm => tm.stage === 'semi_final');
  const finals = tournamentMatches.filter(tm => tm.stage === 'final');

  const handleRegister = async () => {
    if (!myTeamId || !id) return;
    setRegistering(true);
    setRegError('');
    const { error } = await supabase.rpc('register_for_tournament', {
      p_tournament_id: id,
      p_team_id: myTeamId,
    });
    setRegistering(false);
    if (error) { setRegError(error.message); return; }
    refresh();
  };

  const TABS: Array<{ key: TabKey; label: string }> = [
    { key: 'standings', label: 'Standings' },
    { key: 'bracket',   label: 'Bracket' },
    { key: 'teams',     label: `Teams (${approvedTeams.length})` },
  ];

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full" style={{ background: cardBg }}>
            <ChevronLeft size={24} color={textPrimary} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 500, color: textPrimary }} className="truncate flex-1">{tournament.name}</h1>
          {isOrganizer && (
            <button
              onClick={() => navigate(`/app/tournaments/${id}/manage`)}
              className="w-10 h-10 flex items-center justify-center rounded-full"
              style={{ background: '#F3E5F5' }}
            >
              <Settings size={20} color="#6A1B9A" />
            </button>
          )}
        </div>

        {/* Info card */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: '#F3E5F5' }}>
              <Trophy size={26} color="#6A1B9A" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color, fontSize: '11px', fontWeight: 700 }}>{s.label}</span>
              <p style={{ fontSize: '13px', color: textSecondary, marginTop: '4px' }}>{tournament.match_format} · {tournament.max_teams} teams max</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {tournament.area && (
              <div className="flex items-center gap-1">
                <MapPin size={13} color={textSecondary} />
                <span style={{ fontSize: '13px', color: textSecondary }}>{tournament.area}{tournament.venue ? ` · ${tournament.venue}` : ''}</span>
              </div>
            )}
            {tournament.start_date && (
              <div className="flex items-center gap-1">
                <Calendar size={13} color={textSecondary} />
                <span style={{ fontSize: '13px', color: textSecondary }}>
                  {new Date(tournament.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {tournament.end_date ? ` – ${new Date(tournament.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                </span>
              </div>
            )}
          </div>

          {tournament.prize && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor }}>
              <span style={{ fontSize: '14px', color: '#6A1B9A', fontWeight: 500 }}>🏆 {tournament.prize}</span>
            </div>
          )}

          {tournament.description && (
            <p className="mt-3" style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.5 }}>{tournament.description}</p>
          )}
        </div>

        {/* Register button */}
        {canRegister && (
          <div className="mb-4">
            <button
              onClick={handleRegister}
              disabled={registering}
              className="w-full h-[48px] rounded-2xl flex items-center justify-center gap-2"
              style={{ background: '#6A1B9A', color: 'white', fontSize: '15px', fontWeight: 500, opacity: registering ? 0.6 : 1 }}
            >
              {registering ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Register My Team — {captainTeam?.name}</>}
            </button>
            {regError && <p className="mt-2 text-center" style={{ fontSize: '13px', color: '#B3261E' }}>{regError}</p>}
          </div>
        )}

        {myReg && (
          <div className="mb-4 px-4 py-3 rounded-2xl text-center" style={{
            background: myReg.status === 'approved' ? '#E8F5E9' : myReg.status === 'rejected' ? '#FFEBEE' : '#FFF3E0',
            color: myReg.status === 'approved' ? '#2E7D32' : myReg.status === 'rejected' ? '#B3261E' : '#E65100',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              {myReg.status === 'approved' && '✓ Your team is registered'}
              {myReg.status === 'pending' && '⏳ Registration pending approval'}
              {myReg.status === 'rejected' && '✗ Registration not approved'}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl p-1" style={{ background: isDark ? '#2D2C31' : '#F1EFF5' }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex-1 py-2 rounded-xl transition-all"
              style={{
                background: activeTab === key ? (isDark ? '#1C1B1F' : 'white') : 'transparent',
                color: activeTab === key ? '#6A1B9A' : textSecondary,
                fontSize: '13px',
                fontWeight: activeTab === key ? 700 : 400,
                boxShadow: activeTab === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 pb-24">
        {/* STANDINGS TAB */}
        {activeTab === 'standings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {tournament.status === 'registration' ? (
              <div className="text-center py-12">
                <Trophy size={48} color={textSecondary} />
                <p className="mt-3" style={{ fontSize: '16px', color: textSecondary }}>Standings will appear once the group stage starts.</p>
              </div>
            ) : groupLabels.length === 0 ? (
              <p className="text-center py-8" style={{ fontSize: '14px', color: textSecondary }}>No groups yet.</p>
            ) : (
              groupLabels.map(gl => (
                <StandingsTable key={gl} tournamentId={id!} groupLabel={gl} isDark={isDark} />
              ))
            )}
          </motion.div>
        )}

        {/* BRACKET TAB */}
        {activeTab === 'bracket' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {semiFinals.length === 0 ? (
              <div className="text-center py-12">
                <Trophy size={48} color={textSecondary} />
                <p className="mt-3" style={{ fontSize: '16px', color: textSecondary }}>Bracket will appear after the group stage.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#6A1B9A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Semi-Finals</p>
                {semiFinals.map(tm => (
                  <KnockoutMatchCard key={tm.id} tm={tm} cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} borderColor={borderColor} navigate={navigate} />
                ))}
                {finals.length > 0 && (
                  <>
                    <p className="mt-2" style={{ fontSize: '13px', fontWeight: 700, color: '#6A1B9A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Final</p>
                    {finals.map(tm => (
                      <KnockoutMatchCard key={tm.id} tm={tm} cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} borderColor={borderColor} navigate={navigate} />
                    ))}
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* TEAMS TAB */}
        {activeTab === 'teams' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
            {approvedTeams.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} color={textSecondary} />
                <p className="mt-3" style={{ fontSize: '16px', color: textSecondary }}>No approved teams yet.</p>
              </div>
            ) : approvedTeams.map(reg => {
              const team = reg.teams;
              if (!team) return null;
              return (
                <button
                  key={reg.id}
                  onClick={() => navigate(`/app/teams/${team.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border text-left"
                  style={{ background: cardBg, borderColor }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${team.color}20`, border: `2px solid ${team.color}40` }}>
                    <span style={{ fontSize: '20px' }}>{team.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>{team.name}</p>
                    <p style={{ fontSize: '12px', color: textSecondary }}>{team.area} · {team.format}</p>
                  </div>
                  <span style={{ fontSize: '12px', color: '#2E7D32', fontWeight: 600 }}>
                    {team.record_w}W {team.record_d}D {team.record_l}L
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function KnockoutMatchCard({ tm, cardBg, textPrimary, textSecondary, borderColor, navigate }: {
  tm: import('../../types/database').TournamentMatch;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  navigate: (path: string) => void;
}) {
  const match = tm.matches;
  if (!match) return null;
  const home = match.home_team;
  const away = match.away_team;
  const isCompleted = match.status === 'completed';

  return (
    <button
      onClick={() => navigate(`/app/matches/${match.id}/pre`)}
      className="w-full rounded-2xl border p-4 text-left"
      style={{ background: cardBg, borderColor }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 flex flex-col items-end gap-1">
          <span style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>{home?.name ?? 'TBD'}</span>
          <span style={{ fontSize: '20px' }}>{home?.emoji ?? '❓'}</span>
        </div>
        <div className="flex flex-col items-center gap-1 px-3">
          {isCompleted ? (
            <span style={{ fontSize: '22px', fontWeight: 700, color: textPrimary }}>
              {match.home_score} – {match.away_score}
            </span>
          ) : (
            <span style={{ fontSize: '16px', fontWeight: 500, color: textSecondary }}>vs</span>
          )}
          {match.match_date && (
            <span style={{ fontSize: '11px', color: textSecondary }}>
              {new Date(match.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <div className="flex-1 flex flex-col items-start gap-1">
          <span style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>{away?.name ?? 'TBD'}</span>
          <span style={{ fontSize: '20px' }}>{away?.emoji ?? '❓'}</span>
        </div>
      </div>
    </button>
  );
}
