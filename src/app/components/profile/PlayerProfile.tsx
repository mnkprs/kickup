import { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Camera, ChevronRight, ChevronDown, ChevronUp, LogOut, MapPin, Pencil, Shield, ShieldCheck } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../hooks/useMatches';
import { formatMatchDate } from '../../lib/formatDate';
import { uploadAvatar } from '../../lib/uploadAvatar';
import { supabase } from '../../lib/supabase';
import { calcAge, matchResult } from '../../lib/playerUtils';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import type { OwnerApplication } from '../../types/database';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? 'admin@kickup.app';

export function PlayerProfile() {
  const { isDark, bg, cardBg, textPrimary, textSecondary, borderColor } = useThemeColors();
  const { signOut, profile, user, isAdmin, captainTeam, playerTeams, refreshProfile } = useAuth();
  const myTeams = useMemo(() => captainTeam
    ? [{ team: captainTeam, isCaptain: true }, ...playerTeams.filter(t => t.id !== captainTeam.id).map(t => ({ team: t, isCaptain: false }))]
    : playerTeams.map(t => ({ team: t, isCaptain: false })),
    [captainTeam, playerTeams]
  );
  const navigate = useNavigate();
  const { matches } = useMatches();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [application, setApplication] = useState<OwnerApplication | null | undefined>(undefined);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  // Matches the player was in (via lineup, not current team membership)
  const [playerMatchIds, setPlayerMatchIds] = useState<Set<string>>(new Set());
  const [playerTeamByMatch, setPlayerTeamByMatch] = useState<Map<string, string>>(new Map());

  // Admin panel state
  const [adminOpen, setAdminOpen] = useState(false);
  const [pendingApps, setPendingApps] = useState<Array<{ id: string; user_id: string; message: string; profiles: { full_name: string; avatar_initials: string; avatar_color: string } | null }>>([]);
  const [disputedMatches, setDisputedMatches] = useState<Array<{ id: string; home_score: number | null; away_score: number | null; home_team: { name: string } | null; away_team: { name: string } | null }>>([]);
  const [resolveScores, setResolveScores] = useState<Record<string, { home: string; away: string }>>({});
  const [adminActioning, setAdminActioning] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('owner_applications')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setApplication(data ?? null));
    supabase
      .from('match_lineups')
      .select('match_id, team_id')
      .eq('player_id', user.id)
      .then(({ data }) => {
        setPlayerMatchIds(new Set((data ?? []).map(l => l.match_id)));
        setPlayerTeamByMatch(new Map((data ?? []).map(l => [l.match_id, l.team_id])));
      });
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from('owner_applications')
      .select('*, profiles(full_name, avatar_initials, avatar_color)')
      .eq('status', 'pending')
      .then(({ data }) => setPendingApps((data ?? []) as typeof pendingApps));
    supabase
      .from('matches')
      .select('*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)')
      .eq('status', 'disputed')
      .then(({ data }) => {
        const rows = (data ?? []) as typeof disputedMatches;
        setDisputedMatches(rows);
        const scores: Record<string, { home: string; away: string }> = {};
        rows.forEach(m => { scores[m.id] = { home: String(m.home_score ?? 0), away: String(m.away_score ?? 0) }; });
        setResolveScores(scores);
      });
  }, [isAdmin]);

  const handleApplySubmit = async () => {
    if (!user || !profile) return;
    setApplyLoading(true);
    const { data } = await supabase
      .from('owner_applications')
      .insert({ user_id: user.id, message: applyMessage.trim() })
      .select()
      .single();
    if (data) {
      setApplication(data as OwnerApplication);
      setShowApplyForm(false);
      const subject = encodeURIComponent(`Field Owner Application – ${profile.full_name}`);
      const body = encodeURIComponent(
        `Name: ${profile.full_name}\nUser ID: ${user.id}\nEmail: ${user.email ?? 'N/A'}\nArea: ${profile.area ?? 'N/A'}\n\nMessage:\n${applyMessage.trim() || '(none)'}`
      );
      window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
    }
    setApplyLoading(false);
  };

  const playerMatches = useMemo(() =>
    matches.filter(m => m.status === 'completed' && playerMatchIds.has(m.id)).slice(0, 4),
    [matches, playerMatchIds]);

  const age = useMemo(() => calcAge(profile?.date_of_birth ?? null), [profile?.date_of_birth]);

  const statMatches = profile?.stat_matches ?? 0;
  const statWins = profile?.stat_wins ?? 0;
  const winRate = statMatches > 0 ? Math.round((statWins / statMatches) * 100) : 0;

  const statItems = useMemo(() => [
    { label: 'Played', value: statMatches, emoji: '🎮' },
    { label: 'Wins', value: statWins, color: '#2E7D32', emoji: '🏆' },
    { label: 'Goals', value: profile?.stat_goals ?? 0, color: '#B3261E', emoji: '⚽' },
    { label: 'Assists', value: profile?.stat_assists ?? 0, color: '#E65100', emoji: '🎯' },
    { label: 'MVPs', value: profile?.stat_mvp ?? 0, color: '#1565C0', emoji: '⭐' },
  ], [statMatches, statWins, profile?.stat_goals, profile?.stat_assists, profile?.stat_mvp]);

  const handleAdminApprove = async (userId: string) => {
    setAdminActioning(userId);
    await supabase.rpc('admin_approve_field_owner', { p_user_id: userId });
    setPendingApps(prev => prev.filter(a => a.user_id !== userId));
    setAdminActioning(null);
  };

  const handleAdminReject = async (userId: string) => {
    setAdminActioning(userId);
    await supabase.rpc('admin_reject_field_owner', { p_user_id: userId });
    setPendingApps(prev => prev.filter(a => a.user_id !== userId));
    setAdminActioning(null);
  };

  const handleResolveDispute = async (matchId: string) => {
    setAdminActioning(matchId);
    const scores = resolveScores[matchId];
    await supabase.rpc('admin_resolve_dispute', {
      p_match_id: matchId,
      p_home: parseInt(scores.home, 10),
      p_away: parseInt(scores.away, 10),
    });
    setDisputedMatches(prev => prev.filter(m => m.id !== matchId));
    setAdminActioning(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const { url } = await uploadAvatar(user.id, file);
    if (url) {
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      await refreshProfile();
    }
  };

  const handleFreelancerToggle = async () => {
    if (!user || !profile) return;
    await supabase.from('profiles').update({ is_freelancer: !profile.is_freelancer }).eq('id', user.id);
    await refreshProfile();
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      <div className="relative" style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)', paddingTop: '48px', paddingBottom: '32px' }}>
        <button onClick={() => navigate('/app/profile/edit')}
          className="absolute top-12 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
          <Pencil size={12} color="white" />
          <span style={{ fontSize: '12px', color: 'white', fontWeight: 500 }}>Edit</span>
        </button>
        <div className="flex flex-col items-center gap-3 px-4">
          <div className="relative">
            <PlayerAvatar
              initials={profile?.avatar_initials ?? '?'}
              color={profile?.avatar_color ?? '#2E7D32'}
              avatarUrl={profile?.avatar_url}
              size={88}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: '#E8F5E9', border: '2px solid white' }}>
              <Camera size={14} color="#2E7D32" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="text-center w-full">
            <h1 style={{ fontSize: '23px', fontWeight: 700, color: 'white', letterSpacing: '-0.3px' }}>{profile?.full_name ?? 'Player'}</h1>

            <div className="flex items-center justify-center gap-2 mt-1.5">
              {profile?.position ? (
                <span className="px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.25)', color: 'white', fontSize: '12px', fontWeight: 700 }}>
                  {profile.position}
                </span>
              ) : null}
              {profile?.nationality ? (
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{profile.nationality}</span>
              ) : null}
            </div>

            {(() => {
              const bio = [
                age !== null ? { value: String(age), label: 'Age' } : null,
                profile?.height ? { value: String(profile.height), label: 'cm' } : null,
                profile?.preferred_foot ? { value: profile.preferred_foot.charAt(0).toUpperCase() + profile.preferred_foot.slice(1), label: 'Foot' } : null,
              ].filter((x): x is { value: string; label: string } => x !== null);
              return bio.length > 0 ? (
                <div className="flex mt-3 rounded-2xl overflow-hidden mx-10" style={{ background: 'rgba(0,0,0,0.18)' }}>
                  {bio.map((item, i) => (
                    <div key={item.label} className="flex-1 py-2.5 text-center relative">
                      {i > 0 && <div className="absolute left-0 top-2 bottom-2" style={{ width: '1px', background: 'rgba(255,255,255,0.15)' }} />}
                      <p style={{ fontSize: '17px', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{item.value}</p>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', marginTop: '1px' }}>{item.label}</p>
                    </div>
                  ))}
                </div>
              ) : null;
            })()}

            {(profile?.area || myTeams.length > 0) ? (
              <div className="flex items-center justify-center gap-3 mt-2.5 flex-wrap">
                {profile?.area ? (
                  <div className="flex items-center gap-1">
                    <MapPin size={11} color="rgba(255,255,255,0.65)" />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{profile.area}</span>
                  </div>
                ) : null}
                {myTeams.map(({ team, isCaptain: cap }, i) => (
                  <button key={team.id} onClick={() => navigate(`/app/teams/${team.id}`)}
                    className="flex items-center gap-1">
                    {(i > 0 || profile?.area) && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>·</span>}
                    <Shield size={11} color="rgba(255,255,255,0.65)" />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                      {team.name}{cap ? ' · Captain' : ''}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-24 flex flex-col gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-5 gap-2">
          {statItems.map(s => (
            <div key={s.label} className="p-2 rounded-2xl border text-center" style={{ background: cardBg, borderColor }}>
              <p style={{ fontSize: '16px', marginBottom: '2px' }}>{s.emoji}</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: s.color || textPrimary, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '10px', color: textSecondary, marginTop: '2px' }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        <div className="p-4 rounded-2xl border" style={{ background: cardBg, borderColor }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>Win Rate</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#2E7D32' }}>{winRate}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? '#49454F' : '#E7E0EC' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${winRate}%` }} transition={{ duration: 0.8, delay: 0.2 }}
              className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #2E7D32, #66BB6A)' }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl border flex items-center justify-between" style={{ background: cardBg, borderColor }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>Available as Freelancer</p>
            <p style={{ fontSize: '12px', color: textSecondary }}>Show up in "Open Spots" for pickup games</p>
          </div>
          <button onClick={handleFreelancerToggle}
            className="w-12 h-6 rounded-full relative transition-colors"
            style={{ background: profile?.is_freelancer ? '#2E7D32' : (isDark ? '#49454F' : '#E7E0EC') }}>
            <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
              style={{ left: profile?.is_freelancer ? 'calc(100% - 22px)' : '2px' }} />
          </button>
        </div>

        {/* Field Owner Application Card */}
        {profile?.is_field_owner ? (
          <div className="p-4 rounded-2xl border flex items-center gap-3" style={{ background: cardBg, borderColor }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E8F5E9' }}>
              <span style={{ fontSize: '18px' }}>🏟️</span>
            </div>
            <div className="flex-1">
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#2E7D32' }}>Field Owner</p>
              <p style={{ fontSize: '12px', color: textSecondary }}>You have access to tournament management</p>
            </div>
          </div>
        ) : application?.status === 'pending' ? (
          <div className="p-4 rounded-2xl border flex items-center gap-3" style={{ background: cardBg, borderColor }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: isDark ? '#3A3A2A' : '#FFFDE7' }}>
              <span style={{ fontSize: '18px' }}>⏳</span>
            </div>
            <div className="flex-1">
              <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>Application Under Review</p>
              <p style={{ fontSize: '12px', color: textSecondary }}>We'll get back to you soon</p>
            </div>
          </div>
        ) : application?.status === 'rejected' ? (
          <div className="p-4 rounded-2xl border flex items-center gap-3" style={{ background: cardBg, borderColor }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: isDark ? '#3A2020' : '#FFF3F3' }}>
              <span style={{ fontSize: '18px' }}>❌</span>
            </div>
            <div className="flex-1">
              <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>Application Not Approved</p>
              <p style={{ fontSize: '12px', color: textSecondary }}>Contact us for more info</p>
            </div>
          </div>
        ) : showApplyForm ? (
          <div className="p-4 rounded-2xl border flex flex-col gap-3" style={{ background: cardBg, borderColor }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: textPrimary }}>Participate as a Field Owner</p>
            <p style={{ fontSize: '13px', color: textSecondary }}>Tell us about your field (location, capacity, etc.)</p>
            <textarea
              rows={3}
              value={applyMessage}
              onChange={e => setApplyMessage(e.target.value)}
              placeholder="e.g. I own a 5v5 turf in Ampelokipoi, Athens…"
              className="w-full rounded-xl px-3 py-2.5 resize-none outline-none"
              style={{ background: isDark ? '#1C1B1F' : '#F7F2FA', border: `1px solid ${borderColor}`, color: textPrimary, fontSize: '14px' }}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowApplyForm(false)}
                className="flex-1 py-2.5 rounded-xl"
                style={{ background: isDark ? '#49454F' : '#E7E0EC', color: textPrimary, fontSize: '14px', fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={handleApplySubmit} disabled={applyLoading}
                className="flex-1 py-2.5 rounded-xl"
                style={{ background: '#2E7D32', color: 'white', fontSize: '14px', fontWeight: 600, opacity: applyLoading ? 0.6 : 1 }}>
                {applyLoading ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </div>
        ) : application === null ? (
          <button onClick={() => setShowApplyForm(true)}
            className="p-4 rounded-2xl border flex items-center gap-3 w-full text-left"
            style={{ background: cardBg, borderColor }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E8F5E9' }}>
              <span style={{ fontSize: '18px' }}>🏟️</span>
            </div>
            <div className="flex-1">
              <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>Are you a Field Owner?</p>
              <p style={{ fontSize: '12px', color: textSecondary }}>Organize tournaments at your field</p>
            </div>
            <ChevronRight size={18} color={textSecondary} />
          </button>
        ) : null}

        {playerMatches.length > 0 ? (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 500, color: textPrimary, marginBottom: '12px' }}>Recent Matches</h3>
            <div className="flex flex-col gap-2">
              {playerMatches.map(match => {
                const homeTeam = match.home_team;
                const awayTeam = match.away_team;
                if (!homeTeam || !awayTeam || match.home_score === null) return null;
                const teamId = playerTeamByMatch.get(match.id) ?? match.home_team_id;
                const result = matchResult(match, teamId);
                const resultColor = result === 'win' ? '#2E7D32' : result === 'loss' ? '#B3261E' : '#1565C0';
                return (
                  <button key={match.id} onClick={() => navigate(`/app/matches/${match.id}/pre`)}
                    className="flex items-center gap-3 p-3 rounded-2xl border text-left"
                    style={{ background: cardBg, borderColor }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: resultColor + '20', color: resultColor, fontSize: '11px', fontWeight: 700 }}>
                      {result?.toUpperCase().slice(0, 1) || '?'}
                    </div>
                    <div className="flex-1">
                      <span style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>
                        {homeTeam.short_name} vs {awayTeam.short_name}
                      </span>
                      <p style={{ fontSize: '12px', color: textSecondary }}>{formatMatchDate(match.match_date, null)} · {match.format}</p>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: resultColor }}>
                      {match.home_score}–{match.away_score}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {isAdmin ? (
          <div className="rounded-2xl border overflow-hidden" style={{ background: cardBg, borderColor }}>
            <button
              onClick={() => setAdminOpen(o => !o)}
              className="w-full flex items-center gap-3 p-4"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#F3E5F5' }}>
                <ShieldCheck size={18} color="#6A1B9A" />
              </div>
              <div className="flex-1 text-left">
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#6A1B9A' }}>Admin Panel</p>
                <p style={{ fontSize: '12px', color: textSecondary }}>
                  {pendingApps.length} pending · {disputedMatches.length} disputed
                </p>
              </div>
              {adminOpen ? <ChevronUp size={18} color={textSecondary} /> : <ChevronDown size={18} color={textSecondary} />}
            </button>

            {adminOpen ? (
              <div className="border-t px-4 pb-4 flex flex-col gap-4" style={{ borderColor }}>
                {/* Field Owner Applications */}
                <div className="pt-3">
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#6A1B9A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Field Owner Applications
                  </p>
                  {pendingApps.length === 0 ? (
                    <p style={{ fontSize: '13px', color: textSecondary }}>No pending applications.</p>
                  ) : pendingApps.map(app => (
                    <div key={app.id} className="flex items-start gap-3 py-3 border-b last:border-b-0" style={{ borderColor }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: app.profiles?.avatar_color ?? '#6A1B9A', fontSize: '12px', fontWeight: 700, color: 'white' }}>
                        {app.profiles?.avatar_initials ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>{app.profiles?.full_name ?? 'Unknown'}</p>
                        {app.message ? <p style={{ fontSize: '12px', color: textSecondary }} className="truncate">{app.message}</p> : null}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleAdminApprove(app.user_id)}
                          disabled={adminActioning === app.user_id}
                          className="px-3 py-1.5 rounded-xl"
                          style={{ background: '#E8F5E9', color: '#2E7D32', fontSize: '13px', fontWeight: 600, opacity: adminActioning === app.user_id ? 0.5 : 1 }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAdminReject(app.user_id)}
                          disabled={adminActioning === app.user_id}
                          className="px-3 py-1.5 rounded-xl"
                          style={{ background: '#FFEBEE', color: '#B3261E', fontSize: '13px', fontWeight: 600, opacity: adminActioning === app.user_id ? 0.5 : 1 }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Disputed Matches */}
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#6A1B9A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Disputed Matches
                  </p>
                  {disputedMatches.length === 0 ? (
                    <p style={{ fontSize: '13px', color: textSecondary }}>No disputed matches.</p>
                  ) : disputedMatches.map(m => (
                    <div key={m.id} className="py-3 border-b last:border-b-0 flex flex-col gap-2" style={{ borderColor }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>
                        {m.home_team?.name ?? 'Home'} vs {m.away_team?.name ?? 'Away'}
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={resolveScores[m.id]?.home ?? '0'}
                          onChange={e => setResolveScores(s => ({ ...s, [m.id]: { ...s[m.id], home: e.target.value } }))}
                          className="w-14 h-9 text-center rounded-xl border outline-none"
                          style={{ background: isDark ? '#3A3940' : '#F7F2FA', borderColor, color: textPrimary, fontSize: '16px', fontWeight: 700 }}
                        />
                        <span style={{ fontSize: '14px', color: textSecondary }}>–</span>
                        <input
                          type="number"
                          min={0}
                          value={resolveScores[m.id]?.away ?? '0'}
                          onChange={e => setResolveScores(s => ({ ...s, [m.id]: { ...s[m.id], away: e.target.value } }))}
                          className="w-14 h-9 text-center rounded-xl border outline-none"
                          style={{ background: isDark ? '#3A3940' : '#F7F2FA', borderColor, color: textPrimary, fontSize: '16px', fontWeight: 700 }}
                        />
                        <button
                          onClick={() => handleResolveDispute(m.id)}
                          disabled={adminActioning === m.id}
                          className="flex-1 py-2 rounded-xl"
                          style={{ background: '#6A1B9A', color: 'white', fontSize: '13px', fontWeight: 600, opacity: adminActioning === m.id ? 0.5 : 1 }}
                        >
                          {adminActioning === m.id ? '…' : 'Resolve'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 mt-2">
          <button onClick={handleSignOut}
            className="flex items-center gap-2 p-4 rounded-2xl border"
            style={{ background: cardBg, borderColor }}>
            <LogOut size={18} color="#B3261E" />
            <span style={{ fontSize: '15px', color: '#B3261E' }}>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
