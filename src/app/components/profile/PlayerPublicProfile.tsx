import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, MapPin, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import type { Profile, Team } from '../../types/database';

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
}

export function PlayerPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: p }, { data: tm }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('team_members').select('teams(*)').eq('player_id', id).eq('status', 'active').eq('role', 'captain').maybeSingle(),
      ]);
      setProfile(p ?? null);
      setTeam((tm?.teams as unknown as Team) ?? null);
      setLoading(false);
    };
    load();
  }, [id]);

  const bg = isDark ? '#1C1B1F' : '#FFFBFE';
  const cardBg = isDark ? '#2D2C31' : 'white';
  const textPrimary = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#CAC4D0' : '#49454F';
  const borderColor = isDark ? '#49454F' : '#E7E0EC';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: bg }}>
        <div className="w-8 h-8 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: bg }}>
        <p style={{ color: textSecondary }}>Player not found</p>
      </div>
    );
  }

  const age = calcAge(profile.date_of_birth ?? null);
  const statMatches = profile.stat_matches ?? 0;
  const statWins = profile.stat_wins ?? 0;
  const winRate = statMatches > 0 ? Math.round((statWins / statMatches) * 100) : 0;

  const statItems = [
    { label: 'Played', value: statMatches, emoji: '🎮' },
    { label: 'Wins', value: statWins, color: '#2E7D32', emoji: '🏆' },
    { label: 'Goals', value: profile.stat_goals ?? 0, color: '#B3261E', emoji: '⚽' },
    { label: 'Assists', value: profile.stat_assists ?? 0, color: '#E65100', emoji: '🎯' },
    { label: 'MVPs', value: profile.stat_mvp ?? 0, color: '#1565C0', emoji: '⭐' },
  ];

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      <div className="relative" style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)', paddingTop: '48px', paddingBottom: '32px' }}>
        <button onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.2)' }}>
          <ArrowLeft size={20} color="white" />
        </button>
        <div className="flex flex-col items-center gap-3 px-4">
          <PlayerAvatar
            initials={profile.avatar_initials ?? '?'}
            color={profile.avatar_color ?? '#2E7D32'}
            avatarUrl={profile.avatar_url}
            size={88}
          />
          <div className="text-center w-full">
            <h1 style={{ fontSize: '23px', fontWeight: 700, color: 'white', letterSpacing: '-0.3px' }}>{profile.full_name}</h1>

            {/* Position + Nationality */}
            <div className="flex items-center justify-center gap-2 mt-1.5">
              {profile.position && (
                <span className="px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.25)', color: 'white', fontSize: '12px', fontWeight: 700 }}>
                  {profile.position}
                </span>
              )}
              {profile.nationality && (
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{profile.nationality}</span>
              )}
            </div>

            {/* Biometrics */}
            {(() => {
              const bio = [
                age !== null ? { value: String(age), label: 'Age' } : null,
                profile.height ? { value: String(profile.height), label: 'cm' } : null,
                profile.preferred_foot ? { value: profile.preferred_foot.charAt(0).toUpperCase() + profile.preferred_foot.slice(1), label: 'Foot' } : null,
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

            {/* Location + Team */}
            {(profile.area || team) && (
              <div className="flex items-center justify-center gap-3 mt-2.5 flex-wrap">
                {profile.area && (
                  <div className="flex items-center gap-1">
                    <MapPin size={11} color="rgba(255,255,255,0.65)" />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{profile.area}</span>
                  </div>
                )}
                {profile.area && team && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>·</span>}
                {team && (
                  <button onClick={() => navigate(`/app/teams/${team.id}`)}
                    className="flex items-center gap-1">
                    <Shield size={11} color="rgba(255,255,255,0.65)" />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{team.name}</span>
                  </button>
                )}
              </div>
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

        {profile.bio && (
          <div className="p-4 rounded-2xl border" style={{ background: cardBg, borderColor }}>
            <p style={{ fontSize: '13px', color: textSecondary, fontStyle: 'italic', lineHeight: 1.6 }}>"{profile.bio}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
