import { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Camera, ChevronRight, LogOut, MapPin, Pencil, Shield } from 'lucide-react';
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
  const { signOut, profile, user, captainTeam, playerTeams, refreshProfile } = useAuth();
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

  useEffect(() => {
    if (!user) return;
    supabase
      .from('owner_applications')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setApplication(data ?? null));
  }, [user]);

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

  const myTeamIds = useMemo(() => new Set(myTeams.map(mt => mt.team.id)), [myTeams]);

  const playerMatches = useMemo(() => (
    myTeamIds.size > 0
      ? matches.filter(m => (myTeamIds.has(m.home_team_id) || myTeamIds.has(m.away_team_id)) && m.status === 'completed').slice(0, 4)
      : matches.filter(m => m.status === 'completed').slice(0, 4)
  ), [matches, myTeamIds]);

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
            <p style={{ fontSize: '15px', fontWeight: 600, color: textPrimary }}>Become a Field Owner</p>
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
              <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>Become a Field Owner</p>
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
                const teamId = myTeamIds.has(match.home_team_id) ? match.home_team_id : match.away_team_id;
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
