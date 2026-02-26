import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, MapPin, Check, Plus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useMatch } from '../../hooks/useMatch';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { MatchProposal } from '../../types/database';

function formatProposalDate(date: string, time: string): string {
  const d = new Date(date + 'T00:00:00');
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} · ${time.slice(0, 5)}`;
}

export function MatchScheduling() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { match, loading } = useMatch(id);
  const { captainTeam } = useAuth();

  const [proposals, setProposals] = useState<MatchProposal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (match?.match_proposals) {
      setProposals(match.match_proposals);
    }
  }, [match?.id]);

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

  const homeTeam = match?.home_team;
  const awayTeam = match?.away_team;

  const handleAccept = async (propId: string) => {
    if (!captainTeam) return;
    const { error } = await supabase.rpc('accept_proposal', {
      p_proposal_id: propId,
      p_team_id: captainTeam.id,
    });
    if (!error) {
      setProposals(ps => ps.map(p => ({ ...p, accepted: p.id === propId })));
    }
  };

  const handlePropose = async () => {
    if (!date || !time || !venue || !id || !captainTeam) return;
    setSubmitting(true);
    const { data, error } = await supabase.from('match_proposals').insert({
      match_id: id,
      proposed_by_team_id: captainTeam.id,
      proposed_date: date,
      proposed_time: time,
      location: venue,
    }).select('*, proposed_by_team:teams!proposed_by_team_id(*)').single();
    setSubmitting(false);
    if (!error && data) {
      setProposals(ps => [...ps, data as MatchProposal]);
      setShowForm(false);
      setDate(''); setTime(''); setVenue('');
    }
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      <div className="px-4 pt-12 pb-3 sticky top-0 z-20 flex items-center gap-3" style={{ background: bg, borderBottom: `1px solid ${borderColor}` }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors">
          <ArrowLeft size={20} color={textSecondary} />
        </button>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 500, color: textPrimary }}>Schedule Match</h1>
          {homeTeam && awayTeam && (
            <p style={{ fontSize: '13px', color: textSecondary }}>{homeTeam.short_name} vs {awayTeam.short_name}</p>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 pb-24 flex flex-col gap-3">
        <p style={{ fontSize: '13px', color: textSecondary, marginBottom: '4px' }}>
          Both teams propose time slots. Accept one to confirm the match.
        </p>

        {proposals.map((p, i) => {
          const isAccepted = p.accepted;
          const proposerName = p.proposed_by_team?.short_name ??
            (p.proposed_by_team_id === match?.home_team_id ? homeTeam?.short_name : awayTeam?.short_name) ?? 'Team';
          const isHome = p.proposed_by_team_id === match?.home_team_id;
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl border"
              style={{
                background: isAccepted ? (isDark ? '#1E2B1E' : '#E8F5E9') : cardBg,
                borderColor: isAccepted ? '#2E7D32' : borderColor,
              }}>
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1.5">
                  <span style={{ fontSize: '11px', fontWeight: 600, color: isHome ? '#2E7D32' : '#1565C0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {proposerName} proposed
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock size={14} color={textSecondary} />
                    <span style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>{formatProposalDate(p.proposed_date, p.proposed_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} color={textSecondary} />
                    <span style={{ fontSize: '14px', color: textSecondary }}>{p.location}</span>
                  </div>
                </div>
                {!isAccepted && captainTeam && p.proposed_by_team_id !== captainTeam.id && (
                  <button onClick={() => handleAccept(p.id)}
                    className="px-3 py-1.5 rounded-xl flex items-center gap-1"
                    style={{ background: '#2E7D32', color: 'white', fontSize: '13px', fontWeight: 500 }}>
                    <Check size={14} color="white" /> Accept
                  </button>
                )}
                {isAccepted && (
                  <span className="px-3 py-1.5 rounded-xl flex items-center gap-1"
                    style={{ background: '#2E7D32', color: 'white', fontSize: '13px', fontWeight: 500 }}>
                    <Check size={14} color="white" /> Confirmed
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}

        {!showForm ? (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 p-4 rounded-2xl border-2 border-dashed w-full justify-center transition-colors"
            style={{ borderColor: '#2E7D32', color: '#2E7D32' }}>
            <Plus size={18} color="#2E7D32" />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Propose a time slot</span>
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border flex flex-col gap-3"
            style={{ background: cardBg, borderColor }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>New Proposal</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full h-[48px] px-4 rounded-xl border outline-none"
              style={{ borderColor, background: bg, color: textPrimary, fontSize: '15px' }} />
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full h-[48px] px-4 rounded-xl border outline-none"
              style={{ borderColor, background: bg, color: textPrimary, fontSize: '15px' }} />
            <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Venue / Field"
              className="w-full h-[48px] px-4 rounded-xl border outline-none"
              style={{ borderColor, background: bg, color: textPrimary, fontSize: '15px' }} />
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 h-[44px] rounded-xl border" style={{ borderColor, color: textSecondary, fontSize: '14px' }}>Cancel</button>
              <button onClick={handlePropose} disabled={!date || !time || !venue || submitting}
                className="flex-1 h-[44px] rounded-xl" style={{ background: '#2E7D32', color: 'white', fontSize: '14px', fontWeight: 500, opacity: (!date || !time || !venue || submitting) ? 0.5 : 1 }}>
                {submitting ? 'Saving...' : 'Propose'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
