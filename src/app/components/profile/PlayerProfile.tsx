import { useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Camera, LogOut, MapPin, Pencil, Shield } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../hooks/useMatches';
import { formatMatchDate } from '../../lib/formatDate';
import { uploadAvatar } from '../../lib/uploadAvatar';
import { supabase } from '../../lib/supabase';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import type { MatchWithTeams } from '../../types/database';

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
}

function matchResult(match: MatchWithTeams, teamId: string): 'win' | 'loss' | 'draw' | null {
  if (match.home_score === null || match.away_score === null) return null;
  const isHome = match.home_team_id === teamId;
  const my = isHome ? match.home_score : match.away_score;
  const their = isHome ? match.away_score : match.home_score;
  if (my > their) return 'win';
  if (my < their) return 'loss';
  return 'draw';
}

export function PlayerProfile() {
  const { isDark, toggleTheme } = useTheme();
  const { signOut, profile, user, captainTeam, playerTeam, refreshProfile } = useAuth();
  const myTeam = captainTeam ?? playerTeam;
  const isCaptain = !!captainTeam;
  const navigate = useNavigate();
  const { matches } = useMatches();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bg = isDark ? '#1C1B1F' : '#FFFBFE';
  const cardBg = isDark ? '#2D2C31' : 'white';
  const textPrimary = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#CAC4D0' : '#49454F';
  const borderColor = isDark ? '#49454F' : '#E7E0EC';

  const playerMatches = myTeam
    ? matches.filter(m => (m.home_team_id === myTeam.id || m.away_team_id === myTeam.id) && m.status === 'completed').slice(0, 4)
    : matches.filter(m => m.status === 'completed').slice(0, 4);

  const age = calcAge(profile?.date_of_birth ?? null);

  const statMatches = profile?.stat_matches ?? 0;
  const statWins = profile?.stat_wins ?? 0;
  const winRate = statMatches > 0 ? Math.round((statWins / statMatches) * 100) : 0;

  const statItems = [
    { label: 'Played', value: statMatches, emoji: '🎮' },
    { label: 'Wins', value: statWins, color: '#2E7D32', emoji: '🏆' },
    { label: 'Goals', value: profile?.stat_goals ?? 0, color: '#B3261E', emoji: '⚽' },
    { label: 'Assists', value: profile?.stat_assists ?? 0, color: '#E65100', emoji: '🎯' },
    { label: 'MVPs', value: profile?.stat_mvp ?? 0, color: '#1565C0', emoji: '⭐' },
  ];

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
          <div className="text-center">
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'white' }}>{profile?.full_name ?? 'Player'}</h1>
            <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
              {profile?.position && (
                <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '12px', fontWeight: 600 }}>
                  {profile.position}
                </span>
              )}
              {age !== null && (
                <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '12px' }}>
                  {age} yrs
                </span>
              )}
              {profile?.nationality && (
                <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '12px' }}>
                  {profile.nationality}
                </span>
              )}
              {profile?.area && (
                <div className="flex items-center gap-1">
                  <MapPin size={12} color="rgba(255,255,255,0.8)" />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{profile.area}</span>
                </div>
              )}
              {profile?.height && (
                <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '12px' }}>
                  {profile.height} cm
                </span>
              )}
              {profile?.preferred_foot && (
                <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '12px' }}>
                  {profile.preferred_foot.charAt(0).toUpperCase() + profile.preferred_foot.slice(1)} foot
                </span>
              )}
            </div>
            {myTeam && (
              <button onClick={() => navigate(`/app/teams/${myTeam.id}`)}
                className="mt-2 flex items-center gap-1.5 mx-auto px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <Shield size={12} color="rgba(255,255,255,0.9)" />
                <span style={{ fontSize: '12px', color: 'white', fontWeight: 500 }}>
                  {myTeam.name}{isCaptain ? ' · Captain' : ''}
                </span>
              </button>
            )}
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

        {playerMatches.length > 0 && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 500, color: textPrimary, marginBottom: '12px' }}>Recent Matches</h3>
            <div className="flex flex-col gap-2">
              {playerMatches.map(match => {
                const homeTeam = match.home_team;
                const awayTeam = match.away_team;
                if (!homeTeam || !awayTeam || match.home_score === null) return null;
                const teamId = myTeam?.id ?? match.home_team_id;
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
        )}

        <div className="flex flex-col gap-2 mt-2">
          <button onClick={toggleTheme}
            className="flex items-center justify-between p-4 rounded-2xl border"
            style={{ background: cardBg, borderColor }}>
            <span style={{ fontSize: '15px', color: textPrimary }}>Theme</span>
            <span style={{ fontSize: '14px', color: textSecondary }}>{isDark ? '🌙 Dark' : '☀️ Light'}</span>
          </button>
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
