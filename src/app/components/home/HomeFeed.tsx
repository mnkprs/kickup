import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Bell, MapPin, ChevronRight, Clock, RefreshCw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTeams } from '../../hooks/useTeams';
import { useMatches } from '../../hooks/useMatches';
import { useFreelancers } from '../../hooks/useFreelancers';
import { useNotifications } from '../../hooks/useNotifications';
import { formatMatchDate } from '../../lib/formatDate';
import { PlayerAvatar } from '../ui/PlayerAvatar';

function StatusChip({ status }: { status: 'win' | 'draw' | 'loss' | 'upcoming' | 'pending' | 'disputed' | 'freelancer' }) {
  const configs = {
    win: { bg: '#E8F5E9', text: '#2E7D32', label: 'Win' }, draw: { bg: '#E3F2FD', text: '#1565C0', label: 'Draw' },
    loss: { bg: '#FFEBEE', text: '#B3261E', label: 'Loss' }, upcoming: { bg: '#E3F2FD', text: '#1565C0', label: 'Upcoming' },
    pending: { bg: '#FFF3E0', text: '#E65100', label: 'Pending' }, disputed: { bg: '#FFEBEE', text: '#B3261E', label: 'Disputed' },
    freelancer: { bg: '#FFF3E0', text: '#E65100', label: 'Freelancer' },
  };
  const c = configs[status];
  return <span className="px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text, fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: 700 }}>{c.label}</span>;
}

function FormatChip({ format }: { format: string }) {
  return <span className="px-2 py-0.5 rounded-full border" style={{ borderColor: '#CAC4D0', color: '#49454F', fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: 500 }}>{format}</span>;
}

export function HomeFeed() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [locationFilter] = useState('Athens · 10km');

  const { user, profile, captainTeam, playerTeam } = useAuth();
  const { teams: teamsLookingRaw, loading: teamsLoading } = useTeams({ searching_for_opponent: true });
  const myTeamIds = new Set([captainTeam?.id, playerTeam?.id].filter(Boolean) as string[]);
  const teamsLooking = teamsLookingRaw.filter(t => !myTeamIds.has(t.id));
  const { matches, loading: matchesLoading } = useMatches();
  const { freelancers: allFreelancers, loading: freelancersLoading } = useFreelancers();
  const freelancePlayers = allFreelancers.filter(p => p.id !== user?.id);
  const { notifs } = useNotifications(user?.id);

  const bg = isDark ? '#1C1B1F' : '#FFFBFE';
  const cardBg = isDark ? '#2D2C31' : 'white';
  const textPrimary = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#CAC4D0' : '#49454F';
  const borderColor = isDark ? '#49454F' : '#E7E0EC';
  const sectionBg = isDark ? '#1E2B1E' : '#E8F5E9';

  const loading = teamsLoading || matchesLoading || freelancersLoading;
  const unread = notifs.filter(n => !n.read).length;

  const completedMatches = matches.filter(m => m.status === 'completed').slice(0, 3);
  const upcomingMatch = matches.find(m => m.status === 'pre_match' || m.status === 'scheduling');

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setRefreshing(false), 1200);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: bg }}>
        <div className="w-8 h-8 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Player';
  const avatarInitials = profile?.avatar_initials ?? '?';
  const avatarColor = profile?.avatar_color ?? '#2E7D32';

  return (
    <div key={refreshKey} style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      <div className="px-4 pt-12 pb-3 flex items-center justify-between sticky top-0 z-20" style={{ background: isDark ? '#1C1B1F' : '#FFFBFE', borderBottom: `1px solid ${borderColor}` }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%)' }}>
            <span style={{ fontSize: '16px' }}>⚽</span>
          </div>
          <span style={{ fontFamily: 'Roboto Condensed, Roboto, sans-serif', fontSize: '22px', fontWeight: 700, color: '#2E7D32' }}>Kickup</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors">
            <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration: 0.8 }}><RefreshCw size={18} color={textSecondary} /></motion.div>
          </button>
          <button onClick={toggleTheme} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors">
            <span style={{ fontSize: '18px' }}>{isDark ? '☀️' : '🌙'}</span>
          </button>
          <button onClick={() => navigate('/app/notifications')} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors relative">
            <Bell size={20} color={textSecondary} />
            {unread > 0 && (<span className="absolute top-1 right-1 w-4 h-4 bg-[#B3261E] rounded-full flex items-center justify-center"><span className="text-white" style={{ fontSize: '9px' }}>{unread}</span></span>)}
          </button>
          <button onClick={() => navigate('/app/profile')}>
            <PlayerAvatar initials={avatarInitials} color={avatarColor} avatarUrl={profile?.avatar_url} size={36} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2">
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-full border" style={{ borderColor: '#2E7D32', background: isDark ? '#1E2B1E' : '#E8F5E9' }}>
          <MapPin size={13} color="#2E7D32" />
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#2E7D32' }}>{locationFilter}</span>
        </button>
      </div>

      <div className="px-4 pb-1">
        <h2 style={{ fontSize: '22px', fontWeight: 500, color: textPrimary }}>Ready to play, {firstName}? 👊</h2>
        {captainTeam && (
          <p style={{ fontSize: '14px', color: textSecondary, marginTop: '2px' }}>{captainTeam.name} · {captainTeam.area} · {captainTeam.format}</p>
        )}
      </div>

      {upcomingMatch && (
        <div className="px-4 py-3">
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/app/matches/${upcomingMatch.id}/pre`)}
            className="w-full rounded-3xl p-4 flex items-center gap-3 text-left"
            style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)', boxShadow: '0 4px 16px rgba(46,125,50,0.3)' }}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/70" style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }}>Your next match</span>
                <StatusChip status="upcoming" />
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>{upcomingMatch.home_team?.name}</span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>vs</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>{upcomingMatch.away_team?.name}</span>
              </div>
              {upcomingMatch.match_date && (
                <div className="flex items-center gap-1 mt-1">
                  <Clock size={12} color="rgba(255,255,255,0.7)" />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{formatMatchDate(upcomingMatch.match_date, upcomingMatch.match_time)}</span>
                </div>
              )}
            </div>
            <ChevronRight size={20} color="rgba(255,255,255,0.8)" />
          </motion.button>
        </div>
      )}

      <Section title="⚔️ Challenge Open" subtitle="Teams searching for opponents" onMore={() => navigate('/app/teams')} dark={isDark}>
        {teamsLooking.slice(0, 3).map((team, i) => (
          <motion.div key={team.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 p-3 rounded-2xl border" style={{ background: cardBg, borderColor, boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: isDark ? '#1E2B1E' : '#E8F5E9' }}>
              <span style={{ fontSize: '24px' }}>{team.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>{team.name}</span>
                <FormatChip format={team.format} />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={11} color={textSecondary} />
                <span style={{ fontSize: '12px', color: textSecondary }}>{team.area}</span>
                <span style={{ fontSize: '12px', color: textSecondary }}>·</span>
                <span style={{ fontSize: '12px', color: textSecondary }}>{team.record_w}W {team.record_d}D {team.record_l}L</span>
              </div>
            </div>
            <button onClick={() => navigate('/app/matches/challenge')} className="px-3 py-1.5 rounded-xl" style={{ background: '#2E7D32', color: 'white', fontSize: '13px', fontWeight: 500 }}>
              Challenge
            </button>
          </motion.div>
        ))}
      </Section>

      <Section title="🏃 Players Near You" subtitle="Players looking for a team" onMore={() => navigate('/app/discover')} dark={isDark}>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {freelancePlayers.slice(0, 3).map((player, i) => (
            <motion.button key={player.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
              onClick={() => navigate(`/app/players/${player.id}`)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border shrink-0 w-[100px]"
              style={{ background: cardBg, borderColor, boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
              <PlayerAvatar initials={player.avatar_initials} color={player.avatar_color} avatarUrl={player.avatar_url} size={44} />
              <div className="text-center">
                <p style={{ fontSize: '12px', fontWeight: 500, color: textPrimary, lineHeight: 1.2 }}>{player.full_name.split(' ')[0]}</p>
                {player.position && <span className="px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: '#FFF3E0', color: '#E65100', fontSize: '10px', fontWeight: 700 }}>{player.position}</span>}
              </div>
              {player.area && <div className="flex items-center gap-1"><MapPin size={10} color={textSecondary} /><span style={{ fontSize: '10px', color: textSecondary }}>{player.area}</span></div>}
            </motion.button>
          ))}
        </div>
      </Section>

      <Section title="📊 Recent Results" subtitle="Latest match outcomes around you" onMore={() => navigate('/app/matches')} dark={isDark}>
        {completedMatches.map((match, i) => {
          const homeTeam = match.home_team;
          const awayTeam = match.away_team;
          if (!homeTeam || !awayTeam || match.home_score === null) return null;
          const homeWin = match.home_score > match.away_score!;
          const draw = match.home_score === match.away_score;
          return (
            <motion.button key={match.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              onClick={() => navigate(`/app/matches/${match.id}/pre`)} className="w-full p-4 rounded-2xl border text-left"
              style={{ background: cardBg, borderColor, boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FormatChip format={match.format} />
                  <span style={{ fontSize: '11px', color: textSecondary }}>{formatMatchDate(match.match_date, null)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span style={{ fontSize: '20px' }}>{homeTeam.emoji}</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>{homeTeam.short_name}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl" style={{ background: sectionBg }}>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: homeWin ? '#2E7D32' : (draw ? '#1565C0' : '#B3261E') }}>{match.home_score}</span>
                  <span style={{ fontSize: '14px', color: textSecondary }}>–</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: !homeWin && !draw ? '#2E7D32' : (draw ? '#1565C0' : '#B3261E') }}>{match.away_score}</span>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>{awayTeam.short_name}</span>
                  <span style={{ fontSize: '20px' }}>{awayTeam.emoji}</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </Section>
      <div className="h-6" />
    </div>
  );
}

function Section({ title, subtitle, onMore, children, dark }: { title: string; subtitle: string; onMore: () => void; children: React.ReactNode; dark: boolean }) {
  const textSecondary = dark ? '#CAC4D0' : '#49454F';
  return (
    <div className="px-4 pt-5 pb-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: dark ? '#E6E1E5' : '#1C1B1F' }}>{title}</h3>
          <p style={{ fontSize: '12px', color: textSecondary }}>{subtitle}</p>
        </div>
        <button onClick={onMore} className="flex items-center gap-1" style={{ fontSize: '13px', fontWeight: 500, color: '#2E7D32' }}>
          See all <ChevronRight size={14} color="#2E7D32" />
        </button>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
