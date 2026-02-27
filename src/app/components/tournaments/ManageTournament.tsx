import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, Trophy, Check, X, Calendar, Play, Flag, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTournamentDetail } from '../../hooks/useTournamentDetail';
import { supabase } from '../../lib/supabase';
import type { TournamentMatch } from '../../types/database';

export function ManageTournament() {
  const { id } = useParams<{ id: string }>();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { detail, loading, refresh } = useTournamentDetail(id);

  const [actioning, setActioning] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [stageBusy, setStageBusy] = useState(false);
  const [stageError, setStageError] = useState('');

  const bg = isDark ? '#1C1B1F' : '#FFFBFE';
  const cardBg = isDark ? '#2D2C31' : 'white';
  const textPrimary = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#CAC4D0' : '#49454F';
  const borderColor = isDark ? '#49454F' : '#E7E0EC';
  const inputBg = isDark ? '#3A3940' : '#F7F2FA';

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

  const { tournament, registrations, tournamentMatches } = detail;

  // Only organizer can access
  if (user?.id !== tournament.organizer_id) {
    return (
      <div style={{ background: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: textSecondary }}>Access denied.</p>
      </div>
    );
  }

  const pending = registrations.filter(r => r.status === 'pending');
  const approved = registrations.filter(r => r.status === 'approved');

  const allGroupMatchesComplete = () => {
    const groupMatches = tournamentMatches.filter(tm => tm.stage === 'group');
    if (groupMatches.length === 0) return false;
    return groupMatches.every(tm => tm.matches?.status === 'completed');
  };

  const handleApprove = async (regId: string) => {
    setActioning(regId);
    await supabase.rpc('approve_tournament_registration', { p_registration_id: regId });
    setActioning(null);
    refresh();
  };

  const handleReject = async (regId: string) => {
    setActioning(regId);
    await supabase.rpc('reject_tournament_registration', { p_registration_id: regId });
    setActioning(null);
    refresh();
  };

  const handleStartGroupStage = async () => {
    setStageBusy(true);
    setStageError('');
    const { error } = await supabase.rpc('start_group_stage', { p_tournament_id: id });
    setStageBusy(false);
    if (error) { setStageError(error.message); return; }
    refresh();
  };

  const handleAdvanceToKnockouts = async () => {
    setStageBusy(true);
    setStageError('');
    const { error } = await supabase.rpc('advance_to_knockouts', { p_tournament_id: id });
    setStageBusy(false);
    if (error) { setStageError(error.message); return; }
    refresh();
  };

  const handleComplete = async () => {
    setStageBusy(true);
    setStageError('');
    const { error } = await supabase.rpc('complete_tournament', { p_tournament_id: id });
    setStageBusy(false);
    if (error) { setStageError(error.message); return; }
    refresh();
  };

  const handleSetSchedule = async (tm: TournamentMatch) => {
    if (!scheduleDate) return;
    setStageBusy(true);
    setStageError('');
    const { error } = await supabase.rpc('set_tournament_match_schedule', {
      p_match_id: tm.match_id,
      p_date: scheduleDate,
      p_time: scheduleTime || null,
    });
    setStageBusy(false);
    if (error) { setStageError(error.message); return; }
    setScheduleOpen(null);
    setScheduleDate('');
    setScheduleTime('');
    refresh();
  };

  function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#6A1B9A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
        {children}
      </p>
    );
  }

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full" style={{ background: cardBg }}>
          <ChevronLeft size={24} color={textPrimary} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 style={{ fontSize: '20px', fontWeight: 500, color: textPrimary }}>Manage Tournament</h1>
          <p style={{ fontSize: '13px', color: textSecondary }} className="truncate">{tournament.name}</p>
        </div>
        <div className="px-3 py-1 rounded-full" style={{ background: '#F3E5F5' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#6A1B9A', textTransform: 'capitalize' }}>
            {tournament.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="px-4 pb-24 flex flex-col gap-6">

        {/* ── Stage Controls ── */}
        <div>
          <SectionTitle>Stage Control</SectionTitle>
          <div className="rounded-2xl border p-4" style={{ background: cardBg, borderColor }}>
            {tournament.status === 'registration' && (
              <div className="flex flex-col gap-3">
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>Start Group Stage</p>
                  <p style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>
                    {approved.length} approved team{approved.length !== 1 ? 's' : ''} · will create round-robin matches
                  </p>
                </div>
                <button
                  onClick={handleStartGroupStage}
                  disabled={stageBusy || approved.length < 2}
                  className="w-full h-[48px] rounded-2xl flex items-center justify-center gap-2"
                  style={{
                    background: approved.length >= 2 ? '#6A1B9A' : (isDark ? '#49454F' : '#E7E0EC'),
                    color: approved.length >= 2 ? 'white' : textSecondary,
                    fontSize: '15px', fontWeight: 500,
                    opacity: stageBusy ? 0.6 : 1,
                  }}
                >
                  {stageBusy ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Play size={18} /> Start Group Stage</>}
                </button>
                {approved.length < 2 && <p style={{ fontSize: '12px', color: '#B3261E', textAlign: 'center' }}>Need at least 2 approved teams</p>}
              </div>
            )}

            {tournament.status === 'group_stage' && (
              <div className="flex flex-col gap-3">
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>Advance to Knockouts</p>
                  <p style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>
                    {allGroupMatchesComplete() ? 'All group matches complete — ready!' : 'Waiting for all group matches to complete.'}
                  </p>
                </div>
                <button
                  onClick={handleAdvanceToKnockouts}
                  disabled={stageBusy || !allGroupMatchesComplete()}
                  className="w-full h-[48px] rounded-2xl flex items-center justify-center gap-2"
                  style={{
                    background: allGroupMatchesComplete() ? '#6A1B9A' : (isDark ? '#49454F' : '#E7E0EC'),
                    color: allGroupMatchesComplete() ? 'white' : textSecondary,
                    fontSize: '15px', fontWeight: 500,
                    opacity: stageBusy ? 0.6 : 1,
                  }}
                >
                  {stageBusy ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Trophy size={18} /> Advance to Knockouts</>}
                </button>
              </div>
            )}

            {tournament.status === 'knockout_stage' && (
              <div className="flex flex-col gap-3">
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>Complete Tournament</p>
                  <p style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>Mark the tournament as completed.</p>
                </div>
                <button
                  onClick={handleComplete}
                  disabled={stageBusy}
                  className="w-full h-[48px] rounded-2xl flex items-center justify-center gap-2"
                  style={{ background: '#2E7D32', color: 'white', fontSize: '15px', fontWeight: 500, opacity: stageBusy ? 0.6 : 1 }}
                >
                  {stageBusy ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Flag size={18} /> Complete Tournament</>}
                </button>
              </div>
            )}

            {tournament.status === 'completed' && (
              <div className="flex items-center gap-3 py-2">
                <Check size={20} color="#2E7D32" />
                <p style={{ fontSize: '14px', color: '#2E7D32', fontWeight: 500 }}>Tournament completed</p>
              </div>
            )}

            {stageError && (
              <p className="mt-2 px-3 py-2 rounded-xl" style={{ background: '#FFEBEE', color: '#B3261E', fontSize: '13px' }}>{stageError}</p>
            )}
          </div>
        </div>

        {/* ── Pending Registrations ── */}
        {pending.length > 0 && (
          <div>
            <SectionTitle>Pending Registrations ({pending.length})</SectionTitle>
            <div className="flex flex-col gap-2">
              {pending.map(reg => {
                const team = reg.teams;
                const busy = actioning === reg.id;
                return (
                  <div key={reg.id} className="rounded-2xl border p-3 flex items-center gap-3" style={{ background: cardBg, borderColor }}>
                    {team && (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${team.color}20`, border: `2px solid ${team.color}40` }}>
                        <span style={{ fontSize: '20px' }}>{team.emoji}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>{team?.name ?? 'Unknown team'}</p>
                      <p style={{ fontSize: '12px', color: textSecondary }}>{team?.area} · {team?.format}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(reg.id)}
                        disabled={busy}
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: '#FFEBEE' }}
                      >
                        <X size={18} color="#B3261E" />
                      </button>
                      <button
                        onClick={() => handleApprove(reg.id)}
                        disabled={busy}
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: '#E8F5E9' }}
                      >
                        {busy ? <div className="w-4 h-4 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin" /> : <Check size={18} color="#2E7D32" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Match Schedule ── */}
        {tournamentMatches.length > 0 && (
          <div>
            <SectionTitle>Match Schedule ({tournamentMatches.length} matches)</SectionTitle>
            <div className="flex flex-col gap-2">
              {tournamentMatches.map(tm => {
                const match = tm.matches;
                if (!match) return null;
                const home = match.home_team;
                const away = match.away_team;
                const isOpen = scheduleOpen === tm.id;
                const stageLabel = tm.stage === 'group' ? `Group ${tm.group_label}` : tm.stage === 'semi_final' ? 'Semi-Final' : 'Final';

                return (
                  <div key={tm.id} className="rounded-2xl border overflow-hidden" style={{ background: cardBg, borderColor }}>
                    <div className="flex items-center gap-3 p-3">
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#6A1B9A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{stageLabel}</p>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>
                          {home?.emoji} {home?.name} vs {away?.emoji} {away?.name}
                        </p>
                        {match.match_date ? (
                          <p style={{ fontSize: '12px', color: textSecondary }}>
                            {new Date(match.match_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {match.match_time ? ` at ${match.match_time.slice(0, 5)}` : ''}
                          </p>
                        ) : (
                          <p style={{ fontSize: '12px', color: '#E65100' }}>No date set</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (isOpen) { setScheduleOpen(null); return; }
                          setScheduleOpen(tm.id);
                          setScheduleDate(match.match_date ?? '');
                          setScheduleTime(match.match_time?.slice(0, 5) ?? '');
                        }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: isDark ? '#49454F' : '#F1EFF5' }}
                      >
                        {isOpen ? <ChevronUp size={18} color={textSecondary} /> : <ChevronDown size={18} color={textSecondary} />}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="px-3 pb-3 flex flex-col gap-2 border-t" style={{ borderColor }}>
                        <div className="flex gap-2 mt-2">
                          <input
                            type="date"
                            value={scheduleDate}
                            onChange={e => setScheduleDate(e.target.value)}
                            className="flex-1 h-[44px] px-3 rounded-xl border outline-none"
                            style={{ background: inputBg, borderColor, color: textPrimary, fontSize: '14px', fontFamily: 'Roboto, sans-serif' }}
                          />
                          <input
                            type="time"
                            value={scheduleTime}
                            onChange={e => setScheduleTime(e.target.value)}
                            className="flex-1 h-[44px] px-3 rounded-xl border outline-none"
                            style={{ background: inputBg, borderColor, color: textPrimary, fontSize: '14px', fontFamily: 'Roboto, sans-serif' }}
                          />
                        </div>
                        <button
                          onClick={() => handleSetSchedule(tm)}
                          disabled={!scheduleDate || stageBusy}
                          className="w-full h-[40px] rounded-xl flex items-center justify-center gap-2"
                          style={{ background: scheduleDate ? '#6A1B9A' : (isDark ? '#49454F' : '#E7E0EC'), color: scheduleDate ? 'white' : textSecondary, fontSize: '14px', fontWeight: 500, opacity: stageBusy ? 0.6 : 1 }}
                        >
                          <Calendar size={16} /> Set Date
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── View Tournament ── */}
        <button
          onClick={() => navigate(`/app/tournaments/${id}`)}
          className="w-full h-[48px] rounded-2xl border flex items-center justify-center gap-2"
          style={{ borderColor: '#6A1B9A', color: '#6A1B9A', fontSize: '15px', fontWeight: 500 }}
        >
          <Trophy size={18} /> View Public Page
        </button>
      </div>
    </div>
  );
}
