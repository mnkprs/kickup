import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, MapPin, ChevronRight, Check } from 'lucide-react';
import { useMatch } from '../../hooks/useMatch';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatMatchDate } from '../../lib/formatDate';
import { useThemeColors } from '../../hooks/useThemeColors';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import type { Profile } from '../../types/database';

export function PreMatch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bg, cardBg, textPrimary, textSecondary, borderColor, isDark } = useThemeColors();
  const { match, loading } = useMatch(id);
  const { user, captainTeam } = useAuth();

  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [accepting, setAccepting] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: bg }}>
        <div className="w-8 h-8 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match || !match.home_team || !match.away_team) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: bg }}>
        <p style={{ color: textSecondary }}>Match not found</p>
      </div>
    );
  }

  const homeTeam = match.home_team;
  const awayTeam = match.away_team;
  const isCompleted = match.status === 'completed';
  const isPendingChallenge = match.status === 'pending_challenge';

  const tournamentOrganizerId = match.tournament_matches?.[0]?.tournaments?.organizer_id ?? null;

  const isCaptainOfMatch = !!(captainTeam &&
    (captainTeam.id === match.home_team_id || captainTeam.id === match.away_team_id));
  const isAwayCapt = captainTeam?.id === match.away_team_id;
  const isTournamentOrganizer = !!(tournamentOrganizerId && user?.id === tournamentOrganizerId);
  const canSubmitResult = isCaptainOfMatch || isTournamentOrganizer;

  const handleSaveDetails = async () => {
    if (!id) return;
    setSaving(true);
    await supabase.from('matches').update({
      match_date:  editDate     || null,
      match_time:  editTime     || null,
      location:    editLocation || null,
    }).eq('id', id);
    setSaving(false);
  };

  const handleAccept = async () => {
    if (!captainTeam || !id) return;
    setAccepting(true);
    await supabase.rpc('accept_challenge', { p_match_id: id, p_team_id: captainTeam.id });
    setAccepting(false);
    navigate(`/app/matches/${id}/schedule`);
  };

  const homeLineup = (match.match_lineups ?? []).filter(l => l.team_id === match.home_team_id).map(l => l.profiles).filter(Boolean) as Profile[];
  const awayLineup = (match.match_lineups ?? []).filter(l => l.team_id === match.away_team_id).map(l => l.profiles).filter(Boolean) as Profile[];

  // Top scorer: player with most events in this match
  const events = match.match_events ?? [];
  let topScorer: Profile | null = null;
  let topGoals = 0;
  if (events.length > 0) {
    const counts = new Map<string, number>();
    events.forEach(e => counts.set(e.scorer_id, (counts.get(e.scorer_id) ?? 0) + 1));
    let topId = '';
    counts.forEach((count, scorerId) => {
      if (count > topGoals) { topGoals = count; topId = scorerId; }
    });
    topScorer = events.find(e => e.scorer_id === topId)?.scorer ?? null;
  }

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      <div className="px-4 pt-12 pb-3 sticky top-0 z-20 flex items-center gap-3" style={{ background: bg, borderBottom: `1px solid ${borderColor}` }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors">
          <ArrowLeft size={20} color={textSecondary} />
        </button>
        <span style={{ fontSize: '18px', fontWeight: 500, color: textPrimary }}>Match</span>
        <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold"
          style={{
            background: isCompleted ? '#E8F5E9' : isPendingChallenge ? '#FFF3E0' : '#E3F2FD',
            color: isCompleted ? '#2E7D32' : isPendingChallenge ? '#E65100' : '#1565C0',
          }}>
          {isCompleted ? 'Completed' : isPendingChallenge ? 'Pending Challenge' : 'Upcoming'}
        </span>
      </div>

      <div className="px-4 pt-6 pb-24 flex flex-col gap-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl" style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)' }}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-2 flex-1">
              <span style={{ fontSize: '40px' }}>{homeTeam.emoji}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{homeTeam.short_name}</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-4">
              {match.home_score !== null ? (
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '40px', fontWeight: 700, color: 'white' }}>{match.home_score}</span>
                  <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.6)' }}>–</span>
                  <span style={{ fontSize: '40px', fontWeight: 700, color: 'white' }}>{match.away_score}</span>
                </div>
              ) : (
                <span style={{ fontSize: '28px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>VS</span>
              )}
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>{match.format}</span>
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              <span style={{ fontSize: '40px' }}>{awayTeam.emoji}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{awayTeam.short_name}</span>
            </div>
          </div>
        </motion.div>

        {isPendingChallenge && isCaptainOfMatch ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border flex flex-col gap-3"
            style={{ background: cardBg, borderColor }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary }}>Match Details</p>
            <p style={{ fontSize: '12px', color: textSecondary }}>Both captains can set the date, time and field.</p>
            <div className="flex flex-col gap-2">
              <input type="date"
                defaultValue={match.match_date ?? ''}
                onChange={e => setEditDate(e.target.value)}
                className="w-full h-[48px] px-4 rounded-xl border-2 outline-none"
                style={{ borderColor, background: isDark ? '#1C1B1F' : '#F9F9F9', color: textPrimary, fontSize: '15px', fontFamily: 'Roboto, sans-serif' }} />
              <input type="time"
                defaultValue={match.match_time ?? ''}
                onChange={e => setEditTime(e.target.value)}
                className="w-full h-[48px] px-4 rounded-xl border-2 outline-none"
                style={{ borderColor, background: isDark ? '#1C1B1F' : '#F9F9F9', color: textPrimary, fontSize: '15px', fontFamily: 'Roboto, sans-serif' }} />
              <input placeholder="Field / Venue"
                defaultValue={match.location ?? ''}
                onChange={e => setEditLocation(e.target.value)}
                className="w-full h-[48px] px-4 rounded-xl border-2 outline-none"
                style={{ borderColor, background: isDark ? '#1C1B1F' : '#F9F9F9', color: textPrimary, fontSize: '15px', fontFamily: 'Roboto, sans-serif' }} />
            </div>
            <button onClick={handleSaveDetails} disabled={saving}
              className="w-full h-[44px] rounded-xl"
              style={{ background: '#2E7D32', color: 'white', fontSize: '14px', fontWeight: 500, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save Details'}
            </button>
            {isAwayCapt ? (
              <button onClick={handleAccept} disabled={accepting}
                className="w-full h-[44px] rounded-xl flex items-center justify-center gap-2 border-2"
                style={{ borderColor: '#2E7D32', color: '#2E7D32', fontSize: '14px', fontWeight: 500, opacity: accepting ? 0.7 : 1 }}>
                <Check size={16} color="#2E7D32" />
                {accepting ? 'Accepting…' : 'Accept Challenge'}
              </button>
            ) : null}
          </motion.div>
        ) : (match.match_date || match.location) ? (
          <div className="p-4 rounded-2xl border flex flex-col gap-2" style={{ background: cardBg, borderColor }}>
            {match.match_date ? (
              <div className="flex items-center gap-2">
                <Clock size={16} color={textSecondary} />
                <span style={{ fontSize: '14px', color: textPrimary }}>{formatMatchDate(match.match_date, match.match_time)}</span>
              </div>
            ) : null}
            {match.location ? (
              <div className="flex items-center gap-2">
                <MapPin size={16} color={textSecondary} />
                <span style={{ fontSize: '14px', color: textPrimary }}>{match.location}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {match.bet ? (
          <div className="p-4 rounded-2xl" style={{ background: isDark ? '#2B2100' : '#FFF8E1', border: `1px solid ${isDark ? '#5D4037' : '#FFD54F'}` }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#E65100', marginBottom: '4px' }}>🍺 Pre-match Bet (Honor System)</p>
            <p style={{ fontSize: '15px', color: isDark ? '#FFD54F' : '#BF360C' }}>{match.bet}</p>
          </div>
        ) : null}

        {(topScorer || match.mvp_id) ? (
          <div className="p-4 rounded-2xl border flex gap-4" style={{ background: cardBg, borderColor }}>
            {topScorer ? (
              <div>
                <p style={{ fontSize: '11px', color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Scorer</p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>⚽ {topScorer.full_name.split(' ')[0]}. {topScorer.full_name.split(' ').slice(-1)[0]?.[0]}. ({topGoals})</p>
              </div>
            ) : null}
            {match.mvp_id ? (
              <div>
                <p style={{ fontSize: '11px', color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>MVP</p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#E65100' }}>⭐ Player</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {(homeLineup.length > 0 || awayLineup.length > 0) ? (
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 500, color: textPrimary, marginBottom: '12px' }}>Lineups</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{homeTeam.short_name}</span>
                {homeLineup.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <PlayerAvatar initials={p.avatar_initials} color={p.avatar_color} avatarUrl={p.avatar_url} size={28} />
                    <span style={{ fontSize: '12px', color: textPrimary }}>{p.full_name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1565C0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{awayTeam.short_name}</span>
                {awayLineup.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <PlayerAvatar initials={p.avatar_initials} color={p.avatar_color} avatarUrl={p.avatar_url} size={28} />
                    <span style={{ fontSize: '12px', color: textPrimary }}>{p.full_name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 mt-2">
          {match.status === 'scheduling' && isCaptainOfMatch ? (
            <button onClick={() => navigate(`/app/matches/${id}/schedule`)}
              className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 border-2"
              style={{ borderColor: '#2E7D32', color: '#2E7D32', background: 'transparent' }}>
              <Clock size={18} color="#2E7D32" />
              <span style={{ fontSize: '16px', fontWeight: 500 }}>Propose Time / Venue</span>
            </button>
          ) : null}
          {match.status === 'pre_match' && canSubmitResult ? (
            <button onClick={() => navigate(`/app/matches/${id}/result`)}
              className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)', boxShadow: '0 4px 12px rgba(46,125,50,0.35)' }}>
              <span style={{ fontSize: '16px', fontWeight: 500, color: 'white' }}>Submit Result</span>
              <ChevronRight size={18} color="white" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
