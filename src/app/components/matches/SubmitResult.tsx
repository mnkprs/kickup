import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Minus, Plus, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useMatch } from '../../hooks/useMatch';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types/database';

function ScoreStepper({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div className="flex items-center gap-4">
      <button onClick={() => onChange(Math.max(0, value - 1))}
        className="w-10 h-10 rounded-full flex items-center justify-center border-2"
        style={{ borderColor: color }}>
        <Minus size={18} color={color} />
      </button>
      <span style={{ fontSize: '40px', fontWeight: 700, color, minWidth: '40px', textAlign: 'center' }}>{value}</span>
      <button onClick={() => onChange(value + 1)}
        className="w-10 h-10 rounded-full flex items-center justify-center border-2"
        style={{ borderColor: color }}>
        <Plus size={18} color={color} />
      </button>
    </div>
  );
}

export function SubmitResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { match, loading: matchLoading } = useMatch(id);
  const { captainTeam } = useAuth();

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [scorers, setScorers] = useState<string[]>([]);
  const [mvp, setMvp] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Profile[]>([]);

  const bg = isDark ? '#1C1B1F' : '#FFFBFE';
  const cardBg = isDark ? '#2D2C31' : 'white';
  const textPrimary = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#CAC4D0' : '#49454F';
  const borderColor = isDark ? '#49454F' : '#E7E0EC';

  useEffect(() => {
    if (!match) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('team_members')
        .select('profiles(*)')
        .in('team_id', [match.home_team_id, match.away_team_id]);
      const profiles = (data ?? []).map((tm: any) => tm.profiles).filter(Boolean) as Profile[];
      setAllPlayers(profiles);
    };
    fetch();
  }, [match?.id]);

  const toggleScorer = (playerId: string) => {
    setScorers(s => s.includes(playerId) ? s.filter(x => x !== playerId) : [...s, playerId]);
  };

  const handleSubmit = async () => {
    if (!captainTeam || !id) return;
    setLoading(true);
    const { error } = await supabase.rpc('submit_result', {
      p_match_id: id,
      p_team_id: captainTeam.id,
      p_home_score: homeScore,
      p_away_score: awayScore,
      p_mvp_id: mvp || null,
      p_notes: notes || null,
    });
    setLoading(false);
    if (!error) {
      setSubmitted(true);
      setTimeout(() => navigate('/app/matches'), 1500);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6" style={{ background: isDark ? '#1C1B1F' : '#FFFBFE' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
          className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: '#2E7D32' }}>
          <Check size={48} color="white" strokeWidth={3} />
        </motion.div>
        <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '20px', fontWeight: 500, color: textPrimary }}>Result submitted!</p>
        <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: textSecondary }}>Waiting for opponent confirmation</p>
      </div>
    );
  }

  if (matchLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: bg }}>
        <div className="w-8 h-8 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match || !match.home_team || !match.away_team) return null;

  const homeTeam = match.home_team;
  const awayTeam = match.away_team;

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      <div className="px-4 pt-12 pb-3 sticky top-0 z-20 flex items-center gap-3" style={{ background: bg, borderBottom: `1px solid ${borderColor}` }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors">
          <ArrowLeft size={20} color={textSecondary} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 500, color: textPrimary }}>Submit Result</h1>
      </div>

      <div className="px-4 pt-6 pb-24 flex flex-col gap-5">
        <div className="p-5 rounded-2xl border" style={{ background: cardBg, borderColor }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
            Final Score
          </p>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col items-center gap-2 flex-1">
              <span style={{ fontSize: '28px' }}>{homeTeam.emoji}</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>{homeTeam.short_name}</span>
              <ScoreStepper value={homeScore} onChange={setHomeScore} color="#2E7D32" />
            </div>
            <span style={{ fontSize: '24px', color: textSecondary }}>–</span>
            <div className="flex flex-col items-center gap-2 flex-1">
              <span style={{ fontSize: '28px' }}>{awayTeam.emoji}</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>{awayTeam.short_name}</span>
              <ScoreStepper value={awayScore} onChange={setAwayScore} color="#1565C0" />
            </div>
          </div>
        </div>

        {allPlayers.length > 0 && (
          <div>
            <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary, marginBottom: '10px' }}>⚽ Goal Scorers</p>
            <div className="flex flex-col gap-2">
              {allPlayers.map(p => (
                <button key={p.id} onClick={() => toggleScorer(p.id)}
                  className="flex items-center gap-3 p-3 rounded-2xl border transition-all text-left"
                  style={{ background: scorers.includes(p.id) ? (isDark ? '#1E2B1E' : '#E8F5E9') : cardBg, borderColor: scorers.includes(p.id) ? '#2E7D32' : borderColor }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ background: p.avatar_color, fontSize: '12px', fontWeight: 700 }}>
                    {p.avatar_initials}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: textPrimary, flex: 1 }}>{p.full_name}</span>
                  {scorers.includes(p.id) && <Check size={16} color="#2E7D32" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {allPlayers.length > 0 && (
          <div>
            <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary, marginBottom: '10px' }}>⭐ Vote MVP</p>
            <div className="flex flex-wrap gap-2">
              {allPlayers.map(p => (
                <button key={p.id} onClick={() => setMvp(p.id === mvp ? '' : p.id)}
                  className="px-3 py-1.5 rounded-full border transition-all"
                  style={{ borderColor: mvp === p.id ? '#E65100' : borderColor, background: mvp === p.id ? '#FFF3E0' : cardBg, color: mvp === p.id ? '#E65100' : textSecondary, fontSize: '13px', fontWeight: mvp === p.id ? 600 : 400 }}>
                  {p.full_name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary, marginBottom: '8px' }}>Notes (optional)</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Great game, weather was tough..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border-2 outline-none transition-colors resize-none"
            style={{ borderColor, background: cardBg, color: textPrimary, fontSize: '15px', fontFamily: 'Roboto, sans-serif' }} />
        </div>

        <div className="p-3 rounded-xl" style={{ background: isDark ? '#2B1500' : '#FFF3E0', border: `1px solid ${isDark ? '#6D3B00' : '#FFB74D'}` }}>
          <p style={{ fontSize: '12px', color: isDark ? '#FFB74D' : '#E65100' }}>
            ⚠️ If both teams submit different scores, the match will be flagged as disputed and reviewed.
          </p>
        </div>

        {!captainTeam && (
          <p style={{ fontSize: '13px', color: '#B3261E', textAlign: 'center' }}>
            Only team captains can submit results.
          </p>
        )}

        <button onClick={handleSubmit} disabled={loading || !captainTeam}
          className="w-full h-[52px] rounded-2xl flex items-center justify-center transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)', boxShadow: '0 4px 12px rgba(46,125,50,0.35)', opacity: loading || !captainTeam ? 0.7 : 1 }}>
          <span style={{ fontSize: '16px', fontWeight: 500, color: 'white' }}>{loading ? 'Submitting...' : 'Submit Result'}</span>
        </button>
      </div>
    </div>
  );
}
