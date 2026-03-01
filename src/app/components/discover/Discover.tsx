import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Search, MapPin } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useFreelancers } from '../../hooks/useFreelancers';
import { useTeams } from '../../hooks/useTeams';
import { useMatches } from '../../hooks/useMatches';
import { formatMatchDate } from '../../lib/formatDate';
import { supabase } from '../../lib/supabase';
import { PlayerAvatar } from '../ui/PlayerAvatar';

const TABS = ['Freelancers', 'Teams', 'Open Matches'];
const POSITIONS = ['All', 'GK', 'DEF', 'MID', 'FWD'];
const FORMATS = ['All', '5v5', '6v6', '7v7', '8v8'];

export function Discover() {
  const { isDark, bg, cardBg, textPrimary, textSecondary, borderColor } = useThemeColors();
  const inputBg = isDark ? '#2D2C31' : 'white';
  const navigate = useNavigate();
  const { user, captainTeam } = useAuth();
  const { addToast } = useToast();
  const [tab, setTab] = useState('Freelancers');
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('All');
  const [format, setFormat] = useState('All');

  const { freelancers: allFreelancers, loading: freelancersLoading } = useFreelancers();
  const freelancers = allFreelancers.filter(p => p.id !== user?.id);
  const { teams, loading: teamsLoading } = useTeams();
  const { matches, loading: matchesLoading } = useMatches();

  const filteredFreelancers = freelancers.filter(p =>
    (position === 'All' || p.position === position) &&
    (query === '' || p.full_name.toLowerCase().includes(query.toLowerCase()) || (p.area ?? '').toLowerCase().includes(query.toLowerCase()))
  );

  const filteredTeams = teams.filter(t =>
    (format === 'All' || (t.formats?.length ? t.formats : [t.format]).includes(format as import('../../types/database').MatchFormat)) &&
    (query === '' || t.name.toLowerCase().includes(query.toLowerCase()) || t.area.toLowerCase().includes(query.toLowerCase()))
  );

  const openMatches = matches.filter(m =>
    (m.status === 'scheduling' || m.status === 'pre_match') &&
    (format === 'All' || m.format === format)
  );

  const isLoading = (tab === 'Freelancers' && freelancersLoading) ||
    (tab === 'Teams' && teamsLoading) ||
    (tab === 'Open Matches' && matchesLoading);

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      <div className="px-4 pt-12 pb-3 sticky top-0 z-20" style={{ background: bg, borderBottom: `1px solid ${borderColor}` }}>
        <h1 style={{ fontSize: '24px', fontWeight: 500, color: textPrimary, marginBottom: '12px' }}>Discover</h1>

        <div className="relative mb-3">
          <Search size={18} color={textSecondary} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search players, teams..."
            className="w-full h-[44px] pl-10 pr-4 rounded-2xl border"
            style={{ background: inputBg, borderColor, color: textPrimary, fontSize: '15px', outline: 'none' }} />
        </div>

        <div className="flex gap-1 mb-2">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl transition-all text-center"
              style={{ background: tab === t ? '#2E7D32' : 'transparent', color: tab === t ? 'white' : textSecondary, fontSize: '13px', fontWeight: tab === t ? 600 : 400 }}>
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {tab === 'Freelancers' && POSITIONS.map(p => (
            <button key={p} onClick={() => setPosition(p)}
              className="px-3 py-1 rounded-full shrink-0 transition-all"
              style={{ background: position === p ? '#2E7D32' : (isDark ? '#49454F' : '#E7E0EC'), color: position === p ? 'white' : textSecondary, fontSize: '13px', fontWeight: position === p ? 600 : 400 }}>
              {p}
            </button>
          ))}
          {(tab === 'Teams' || tab === 'Open Matches') && FORMATS.map(f => (
            <button key={f} onClick={() => setFormat(f)}
              className="px-3 py-1 rounded-full shrink-0 transition-all"
              style={{ background: format === f ? '#2E7D32' : (isDark ? '#49454F' : '#E7E0EC'), color: format === f ? 'white' : textSecondary, fontSize: '13px', fontWeight: format === f ? 600 : 400 }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-24">
        {isLoading && (
          <div className="flex justify-center pt-16">
            <div className="w-8 h-8 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && tab === 'Freelancers' && (
          <div className="flex flex-col gap-2">
            {filteredFreelancers.map((player, i) => (
              <motion.div key={player.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-2xl border"
                style={{ background: cardBg, borderColor }}>
                <button onClick={() => navigate(`/app/players/${player.id}`)} className="shrink-0">
                  <PlayerAvatar initials={player.avatar_initials} color={player.avatar_color} avatarUrl={player.avatar_url} size={48} showAvailable={true} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>{player.full_name}</p>
                    {player.position && (
                      <span className="px-2 py-0.5 rounded-full shrink-0" style={{ background: '#FFF3E0', color: '#E65100', fontSize: '11px', fontWeight: 700 }}>
                        {player.position}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {player.area && (
                      <div className="flex items-center gap-1">
                        <MapPin size={10} color={textSecondary} />
                        <span style={{ fontSize: '11px', color: textSecondary }}>{player.area}</span>
                      </div>
                    )}
                    {(player.stat_goals > 0 || player.stat_assists > 0) && (
                      <span style={{ fontSize: '11px', color: textSecondary }}>
                        ⚽ {player.stat_goals} · 🎯 {player.stat_assists}
                      </span>
                    )}
                  </div>
                </div>
                {captainTeam && (
                  <button
                    disabled={invitedIds.has(player.id)}
                    onClick={async () => {
                      const { error } = await supabase.rpc('invite_player_to_team', { p_player_id: player.id });
                      if (error) { addToast(error.message, 'error'); return; }
                      setInvitedIds(prev => new Set([...prev, player.id]));
                      addToast('Invitation sent!', 'success');
                    }}
                    className="px-3 py-1.5 rounded-xl shrink-0 transition-all"
                    style={{
                      background: invitedIds.has(player.id) ? (isDark ? '#49454F' : '#E7E0EC') : '#E8F5E9',
                      color: invitedIds.has(player.id) ? (isDark ? '#CAC4D0' : '#79747E') : '#2E7D32',
                      fontSize: '13px', fontWeight: 500,
                    }}>
                    {invitedIds.has(player.id) ? 'Invited ✓' : 'Invite'}
                  </button>
                )}
              </motion.div>
            ))}
            {filteredFreelancers.length === 0 && (
              <div className="flex flex-col items-center gap-2 pt-16">
                <span style={{ fontSize: '40px' }}>🔍</span>
                <p style={{ fontSize: '15px', color: textSecondary }}>No freelancers found</p>
              </div>
            )}
          </div>
        )}

        {!isLoading && tab === 'Teams' && (
          <div className="flex flex-col gap-3">
            {filteredTeams.map((team, i) => (
              <motion.button key={team.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/app/teams/${team.id}`)}
                className="w-full p-4 rounded-2xl border flex items-center gap-3 text-left"
                style={{ background: cardBg, borderColor }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: isDark ? '#1E2B1E' : '#E8F5E9', fontSize: '24px' }}>
                  {team.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>{team.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {(team.formats?.length ? team.formats : [team.format]).map(f => (
                      <span key={f} style={{ fontSize: '12px', color: textSecondary }}>{f}</span>
                    ))}
                    <span style={{ fontSize: '12px', color: textSecondary }}>·</span>
                    <div className="flex items-center gap-1">
                      <MapPin size={10} color={textSecondary} />
                      <span style={{ fontSize: '12px', color: textSecondary }}>{team.area}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#2E7D32', fontWeight: 500, marginTop: '2px' }}>
                    {team.record_w}W {team.record_d}D {team.record_l}L
                  </p>
                </div>
                {team.searching_for_opponent && (
                  <span className="px-2 py-1 rounded-full shrink-0" style={{ background: '#E8F5E9', color: '#2E7D32', fontSize: '11px', fontWeight: 700 }}>
                    Open
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        )}

        {!isLoading && tab === 'Open Matches' && (
          <div className="flex flex-col gap-3">
            {openMatches.map((match, i) => {
              const homeTeam = match.home_team;
              const awayTeam = match.away_team;
              if (!homeTeam || !awayTeam) return null;
              return (
                <motion.button key={match.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/app/matches/${match.id}/pre`)}
                  className="w-full p-4 rounded-2xl border text-left"
                  style={{ background: cardBg, borderColor }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-full border" style={{ borderColor: '#CAC4D0', color: textSecondary, fontSize: '11px' }}>{match.format}</span>
                    <span className="px-2 py-0.5 rounded-full" style={{ background: '#E3F2FD', color: '#1565C0', fontSize: '11px', fontWeight: 700 }}>Scheduling</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center flex-1">
                      <span style={{ fontSize: '24px' }}>{homeTeam.emoji}</span>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>{homeTeam.short_name}</span>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: textSecondary }}>VS</span>
                    <div className="flex flex-col items-center flex-1">
                      <span style={{ fontSize: '24px' }}>{awayTeam.emoji}</span>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>{awayTeam.short_name}</span>
                    </div>
                  </div>
                  {match.match_date && (
                    <p style={{ fontSize: '12px', color: textSecondary, marginTop: '8px', textAlign: 'center' }}>
                      📅 {formatMatchDate(match.match_date, match.match_time)}
                    </p>
                  )}
                </motion.button>
              );
            })}
            {openMatches.length === 0 && (
              <div className="flex flex-col items-center gap-2 pt-16">
                <span style={{ fontSize: '40px' }}>📭</span>
                <p style={{ fontSize: '15px', color: textSecondary }}>No open matches</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
