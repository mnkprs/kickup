import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MapPin, Users, Swords, ChevronDown, ChevronUp, Camera, Check, X, Crown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useTeam } from '../../hooks/useTeam';
import { useMatches } from '../../hooks/useMatches';
import { formatMatchDate } from '../../lib/formatDate';
import { uploadTeamAvatar } from '../../lib/uploadAvatar';
import { supabase } from '../../lib/supabase';
import { PlayerAvatar } from '../ui/PlayerAvatar';
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

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
}

export function TeamProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user, captainTeam, playerTeam, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const { team, loading: teamLoading, refresh } = useTeam(id);
  const { matches, loading: matchesLoading } = useMatches();

  const [rosterOpen, setRosterOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const isMyCaptainTeam = captainTeam?.id === id;
  const isMyPlayerTeam = playerTeam?.id === id;
  const isMyTeam = isMyCaptainTeam || isMyPlayerTeam;
  const isCaptain = isMyCaptainTeam;

  const activeMembers = team.team_members.filter(tm => tm.status === 'active');
  const pendingMembers = team.team_members.filter(tm => tm.status === 'pending');
  const isMember = team.team_members.some(tm => tm.player_id === user?.id && tm.status === 'active');
  const hasPendingApplication = team.team_members.some(tm => tm.player_id === user?.id && tm.status === 'pending');

  // Average age from active members with date_of_birth
  const ages = activeMembers.map(tm => calcAge(tm.profiles?.date_of_birth ?? null)).filter((a): a is number => a !== null);
  const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null;

  const teamMatches = matches.filter(m => m.home_team_id === team.id || m.away_team_id === team.id);
  const completedMatches = teamMatches.filter(m => m.status === 'completed').slice(0, 5);

  const hasActiveChallenge = captainTeam ? matches.some(m =>
    (m.status === 'pending_challenge' || m.status === 'scheduling' || m.status === 'pre_match') &&
    ((m.home_team_id === captainTeam.id && m.away_team_id === team.id) ||
     (m.away_team_id === captainTeam.id && m.home_team_id === team.id))
  ) : false;
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

  const withAction = async (key: string, fn: () => Promise<void>) => {
    setActionLoading(key);
    try { await fn(); } catch (e) { addToast(String(e), 'error'); }
    setActionLoading(null);
  };

  const handleApply = () => withAction('apply', async () => {
    const { error } = await supabase.rpc('apply_to_team', { p_team_id: id });
    if (error) { addToast(error.message, 'error'); return; }
    addToast('Application sent!', 'success');
    refresh();
  });

  const handleAccept = (playerId: string) => withAction(`accept-${playerId}`, async () => {
    const { error } = await supabase.rpc('accept_team_member', { p_team_id: id, p_player_id: playerId });
    if (error) { addToast(error.message, 'error'); return; }
    addToast('Member accepted', 'success');
    refresh();
    refreshProfile();
  });

  const handleReject = (playerId: string) => withAction(`reject-${playerId}`, async () => {
    const { error } = await supabase.rpc('remove_team_member', { p_team_id: id, p_player_id: playerId });
    if (error) { addToast(error.message, 'error'); return; }
    refresh();
  });

  const handleRemove = (playerId: string) => withAction(`remove-${playerId}`, async () => {
    const { error } = await supabase.rpc('remove_team_member', { p_team_id: id, p_player_id: playerId });
    if (error) { addToast(error.message, 'error'); return; }
    addToast('Member removed', 'info');
    refresh();
    refreshProfile();
  });

  const handleMakeCaptain = (playerId: string) => withAction(`captain-${playerId}`, async () => {
    const { error } = await supabase.rpc('assign_team_captain', { p_team_id: id, p_player_id: playerId });
    if (error) { addToast(error.message, 'error'); return; }
    addToast('Captain assigned', 'success');
    refresh();
    refreshProfile();
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !id) return;
    const { url, error } = await uploadTeamAvatar(user.id, id, file);
    if (error) { addToast(error, 'error'); return; }
    if (url) {
      const { error: updateError } = await supabase.from('teams').update({ avatar_url: url }).eq('id', id);
      if (updateError) { addToast(updateError.message, 'error'); return; }
      refresh();
    }
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      {/* Banner */}
      <div className="relative h-52" style={{ background: `linear-gradient(135deg, ${team.color}CC 0%, ${team.color} 50%, ${team.color}99 100%)` }}>
        <button onClick={() => navigate(-1)} className="absolute top-12 left-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)' }}>
          <ArrowLeft size={20} color="white" />
        </button>

        {/* Team avatar with upload button for captain */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex items-end gap-4">
          <div className="relative">
            {team.avatar_url ? (
              <img src={team.avatar_url} alt={team.name} className="w-20 h-20 rounded-2xl object-cover shadow-xl border-2 border-white/30" />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.3)', fontSize: '40px' }}>
                {team.emoji}
              </div>
            )}
            {isCaptain && (
              <label
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow cursor-pointer"
                style={{ background: '#E8F5E9', border: '2px solid white' }}>
                <Camera size={12} color="#2E7D32" />
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </label>
            )}
          </div>
          <div className="pb-1 flex-1">
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'white' }}>{team.name}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '11px', fontWeight: 600 }}>{team.format}</span>
              <div className="flex items-center gap-1">
                <MapPin size={11} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{team.area}</span>
              </div>
              {avgAge !== null && (
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Avg age: {avgAge}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-24">
        {/* Stats grid */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-2 mb-4">
          {statItems.map(s => (
            <div key={s.label} className="p-3 rounded-2xl border text-center" style={{ background: cardBg, borderColor }}>
              <p style={{ fontSize: '22px', fontWeight: 700, color: s.color || textPrimary }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: textSecondary, marginTop: '2px' }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Win rate bar */}
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

        {/* Pending applications (captain only) */}
        {isCaptain && pendingMembers.length > 0 && (
          <div className="mb-4 p-4 rounded-2xl border" style={{ background: isDark ? '#2D2C31' : '#FFF3E0', borderColor: '#E65100' + '40' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#E65100', marginBottom: '10px' }}>
              {pendingMembers.length} Pending Application{pendingMembers.length > 1 ? 's' : ''}
            </h3>
            <div className="flex flex-col gap-2">
              {pendingMembers.map(tm => {
                const p = tm.profiles;
                if (!p) return null;
                const busy = actionLoading === `accept-${tm.player_id}` || actionLoading === `reject-${tm.player_id}`;
                return (
                  <div key={tm.id} className="flex items-center gap-3">
                    <button onClick={() => navigate(`/app/players/${tm.player_id}`)} className="shrink-0">
                      <PlayerAvatar initials={p.avatar_initials} color={p.avatar_color} avatarUrl={p.avatar_url} size={36} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>{p.full_name}</p>
                      {p.position && <p style={{ fontSize: '11px', color: textSecondary }}>{p.position}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(tm.player_id)} disabled={busy}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: '#E8F5E9', border: '1px solid #2E7D32' }}>
                        {actionLoading === `accept-${tm.player_id}` ? <div className="w-3 h-3 border border-[#2E7D32] border-t-transparent rounded-full animate-spin" /> : <Check size={14} color="#2E7D32" />}
                      </button>
                      <button onClick={() => handleReject(tm.player_id)} disabled={busy}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: '#FFEBEE', border: '1px solid #B3261E' }}>
                        {actionLoading === `reject-${tm.player_id}` ? <div className="w-3 h-3 border border-[#B3261E] border-t-transparent rounded-full animate-spin" /> : <X size={14} color="#B3261E" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Squad - collapsible */}
        {activeMembers.length > 0 && (
          <div className="mb-4">
            <button className="w-full flex items-center justify-between mb-3" onClick={() => setRosterOpen(o => !o)}>
              <div className="flex items-center gap-2">
                <Users size={16} color={textSecondary} />
                <h2 style={{ fontSize: '16px', fontWeight: 500, color: textPrimary }}>Squad ({activeMembers.length})</h2>
              </div>
              {rosterOpen ? <ChevronUp size={18} color={textSecondary} /> : <ChevronDown size={18} color={textSecondary} />}
            </button>
            <AnimatePresence>
              {rosterOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                  <div className="flex flex-col gap-2">
                    {activeMembers.map(tm => {
                      const p = tm.profiles;
                      if (!p) return null;
                      const canRemove = isCaptain && tm.player_id !== user?.id;
                      const canMakeCaptain = isCaptain && tm.role === 'player';
                      const busyRemove = actionLoading === `remove-${tm.player_id}`;
                      const busyCaptain = actionLoading === `captain-${tm.player_id}`;
                      return (
                        <div key={tm.id} className="flex items-center gap-3 p-3 rounded-2xl border"
                          style={{ background: cardBg, borderColor }}>
                          <button onClick={() => navigate(`/app/players/${tm.player_id}`)} className="shrink-0">
                            <PlayerAvatar initials={p.avatar_initials} color={p.avatar_color} avatarUrl={p.avatar_url} size={40} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>{p.full_name}</p>
                            <div className="flex items-center gap-2">
                              {p.position && <span style={{ fontSize: '12px', color: textSecondary }}>{p.position}</span>}
                              {tm.role === 'captain' && (
                                <span className="flex items-center gap-1" style={{ fontSize: '11px', color: '#E65100', fontWeight: 700 }}>
                                  <Crown size={10} color="#E65100" /> Captain
                                </span>
                              )}
                            </div>
                          </div>
                          {isCaptain && (
                            <div className="flex gap-1">
                              {canMakeCaptain && (
                                <button onClick={() => handleMakeCaptain(tm.player_id)} disabled={busyCaptain}
                                  className="p-1.5 rounded-xl"
                                  style={{ background: '#FFF3E0', border: '1px solid #E65100' }}
                                  title="Make Captain">
                                  {busyCaptain ? <div className="w-3 h-3 border border-[#E65100] border-t-transparent rounded-full animate-spin" /> : <Crown size={13} color="#E65100" />}
                                </button>
                              )}
                              {canRemove && (
                                <button onClick={() => handleRemove(tm.player_id)} disabled={busyRemove}
                                  className="p-1.5 rounded-xl"
                                  style={{ background: '#FFEBEE', border: '1px solid #B3261E' }}
                                  title="Remove member">
                                  {busyRemove ? <div className="w-3 h-3 border border-[#B3261E] border-t-transparent rounded-full animate-spin" /> : <X size={13} color="#B3261E" />}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Match history - collapsible */}
        {completedMatches.length > 0 && (
          <div className="mb-4">
            <button className="w-full flex items-center justify-between mb-3" onClick={() => setHistoryOpen(o => !o)}>
              <h2 style={{ fontSize: '16px', fontWeight: 500, color: textPrimary }}>Match History</h2>
              {historyOpen ? <ChevronUp size={18} color={textSecondary} /> : <ChevronDown size={18} color={textSecondary} />}
            </button>
            <AnimatePresence>
              {historyOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
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
                            <span style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>vs {opponent?.name || 'Unknown'}</span>
                            <p style={{ fontSize: '12px', color: textSecondary }}>{formatMatchDate(match.match_date, null)}</p>
                          </div>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: resultColor }}>{scoreStr}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          {/* Searching for opponent toggle (captain only) */}
          {isCaptain && (
            <div className="p-4 rounded-2xl border flex items-center justify-between" style={{ background: cardBg, borderColor }}>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>Searching for Opponent</p>
                <p style={{ fontSize: '12px', color: textSecondary }}>Show team as open for challenges</p>
              </div>
              <button
                onClick={async () => {
                  const { error } = await supabase.from('teams').update({ searching_for_opponent: !team.searching_for_opponent }).eq('id', team.id);
                  if (error) { addToast(error.message, 'error'); return; }
                  refresh();
                }}
                className="w-12 h-6 rounded-full relative transition-colors"
                style={{ background: team.searching_for_opponent ? '#2E7D32' : (isDark ? '#49454F' : '#E7E0EC') }}>
                <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                  style={{ left: team.searching_for_opponent ? 'calc(100% - 22px)' : '2px' }} />
              </button>
            </div>
          )}

          {/* Apply for a spot (non-members, not own team) */}
          {!isMember && !isCaptain && user && (
            hasPendingApplication ? (
              <div className="w-full h-[52px] rounded-2xl flex items-center justify-center"
                style={{ background: isDark ? '#2D2C31' : '#F3EDF7', border: '1px solid #CAC4D0' }}>
                <span style={{ fontSize: '15px', color: textSecondary }}>Application pending...</span>
              </div>
            ) : (
              <button onClick={handleApply} disabled={actionLoading === 'apply'}
                className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)', boxShadow: '0 4px 12px rgba(21,101,192,0.3)', opacity: actionLoading === 'apply' ? 0.7 : 1 }}>
                <Users size={18} color="white" />
                <span style={{ fontSize: '16px', fontWeight: 500, color: 'white' }}>
                  {actionLoading === 'apply' ? 'Applying...' : 'Apply for a Spot'}
                </span>
              </button>
            )
          )}

          {/* Challenge button — only if not own team, user has captain team, and no active match */}
          {!isMyTeam && captainTeam && (
            hasActiveChallenge ? (
              <div className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2"
                style={{ background: isDark ? '#2D2C31' : '#F3EDF7', border: '1px solid #CAC4D0' }}>
                <Swords size={16} color={textSecondary} />
                <span style={{ fontSize: '15px', color: textSecondary }}>Match already in progress</span>
              </div>
            ) : (
              <button onClick={() => navigate('/app/matches/challenge')}
                className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)', boxShadow: '0 4px 12px rgba(46,125,50,0.35)' }}>
                <Swords size={20} color="white" />
                <span style={{ fontSize: '16px', fontWeight: 500, color: 'white' }}>Challenge This Team</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
