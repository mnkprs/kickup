import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTeams } from '../../hooks/useTeams';
import { supabase } from '../../lib/supabase';
import type { MatchFormat } from '../../types/database';

const FORMATS: MatchFormat[] = ['5v5', '6v6', '7v7', '8v8', '11v11'];
const AREAS = ['Kolonaki', 'Exarcheia', 'Pangrati', 'Glyfada', 'Kifisia', 'Piraeus', 'Nea Smyrni', 'Chalandri'];
const STEPS = ['Your Team', 'Opponent', 'Details', 'Send'];

export function ChallengeScreen() {
  const navigate = useNavigate();
  const { captainTeam } = useAuth();
  const { teams } = useTeams({ searching_for_opponent: true });

  const [step, setStep] = useState(0);
  const [opponentId, setOpponentId] = useState('');
  const [format, setFormat] = useState<MatchFormat | ''>('');
  const [area, setArea] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fieldBase = "w-full h-[56px] px-4 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors";
  const fontBase = { fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#1C1B1F' };

  const opponentTeams = teams.filter(t => t.id !== captainTeam?.id);
  const opponentTeam = opponentTeams.find(t => t.id === opponentId);

  const canNext = [
    !!captainTeam,
    !!opponentId,
    !!format && !!area,
    true,
  ][step];

  const handleNext = async () => {
    if (step < 3) { setStep(s => s + 1); return; }
    if (!captainTeam || !opponentId || !format) return;
    setSubmitting(true);
    setError('');
    const { error: rpcError } = await supabase.rpc('send_challenge', {
      p_home_team_id: captainTeam.id,
      p_away_team_id: opponentId,
      p_format: format,
      p_message: message || null,
    });
    setSubmitting(false);
    if (rpcError) { setError(rpcError.message); return; }
    setSent(true);
    setTimeout(() => navigate('/app/matches'), 1500);
  };

  if (sent) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6" style={{ background: 'linear-gradient(180deg, #E8F5E9 0%, #FFFBFE 60%)' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
          className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: '#2E7D32' }}>
          <Check size={48} color="white" strokeWidth={3} />
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ fontFamily: 'Roboto, sans-serif', fontSize: '20px', fontWeight: 500, color: '#1C1B1F' }}>
          Challenge sent!
        </motion.p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex justify-center" style={{ background: 'linear-gradient(180deg, #E8F5E9 0%, #FFFBFE 40%)' }}>
      <div className="w-full max-w-[430px] flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors">
            <ArrowLeft size={22} color="#49454F" />
          </button>
          <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#79747E' }}>
            Step {step + 1} of {STEPS.length}
          </span>
        </div>

        <div className="mx-6 h-1 bg-[#E8F5E9] rounded-full overflow-hidden mb-6">
          <motion.div className="h-full bg-[#2E7D32] rounded-full" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ type: 'spring', stiffness: 200 }} />
        </div>

        <div className="px-6 flex flex-col gap-6">
          <h1 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '22px', fontWeight: 500, color: '#1C1B1F' }}>
            {STEPS[step]}
          </h1>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-3">
                <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#49454F' }}>You're challenging as:</p>
                {captainTeam ? (
                  <div className="flex items-center gap-3 p-4 rounded-2xl border-2" style={{ borderColor: '#2E7D32', background: '#E8F5E9' }}>
                    <span style={{ fontSize: '28px' }}>{captainTeam.emoji}</span>
                    <div>
                      <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '15px', fontWeight: 500, color: '#1C1B1F' }}>{captainTeam.name}</p>
                      <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#49454F' }}>{captainTeam.format} · {captainTeam.area}</p>
                    </div>
                    <Check size={18} color="#2E7D32" className="ml-auto" />
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border-2 border-dashed border-[#CAC4D0] text-center">
                    <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#79747E' }}>You're not a captain of any team.</p>
                    <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#79747E', marginTop: '4px' }}>Create or join a team as captain to send challenges.</p>
                  </div>
                )}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-3">
                <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#49454F' }}>Who do you want to challenge?</p>
                {opponentTeams.map(t => (
                  <button key={t.id} onClick={() => setOpponentId(t.id)}
                    className="flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left"
                    style={{ borderColor: opponentId === t.id ? '#2E7D32' : '#CAC4D0', background: opponentId === t.id ? '#E8F5E9' : 'white' }}>
                    <span style={{ fontSize: '28px' }}>{t.emoji}</span>
                    <div className="flex-1">
                      <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '15px', fontWeight: 500, color: '#1C1B1F' }}>{t.name}</p>
                      <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#49454F' }}>{t.format} · {t.area}</p>
                    </div>
                    {opponentId === t.id && <Check size={18} color="#2E7D32" />}
                  </button>
                ))}
                {opponentTeams.length === 0 && (
                  <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#79747E', textAlign: 'center', paddingTop: '16px' }}>
                    No teams are currently searching for opponents.
                  </p>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: 500, color: '#49454F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Format</span>
                  <div className="flex gap-2">
                    {FORMATS.map(f => (
                      <button key={f} onClick={() => setFormat(f)}
                        className="flex-1 h-[48px] rounded-2xl border-2 flex items-center justify-center transition-all"
                        style={{ borderColor: format === f ? '#2E7D32' : '#CAC4D0', background: format === f ? '#E8F5E9' : 'white', fontFamily: 'Roboto, sans-serif', fontSize: '13px', fontWeight: format === f ? 700 : 400, color: format === f ? '#2E7D32' : '#49454F' }}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: 500, color: '#49454F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preferred Area</span>
                  <div className="relative">
                    <select value={area} onChange={e => setArea(e.target.value)}
                      className={fieldBase + " appearance-none pr-10"}
                      style={{ ...fontBase, color: area ? '#1C1B1F' : '#79747E' }}>
                      <option value="" disabled>Select area...</option>
                      {AREAS.map(a => <option key={a} value={a}>{a}, Athens</option>)}
                    </select>
                    <ChevronDown size={18} color="#79747E" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
                <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#49454F' }}>Add a message for the opponent (optional)</p>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="e.g. We're ready for a rematch! Sunday works best for us."
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors resize-none"
                  style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#1C1B1F' }} />
                <div className="p-4 rounded-2xl" style={{ background: '#E8F5E9' }}>
                  <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', fontWeight: 500, color: '#1B5E20', marginBottom: '8px' }}>Challenge Summary</p>
                  <div className="flex flex-col gap-1">
                    {[
                      ['Your team', captainTeam?.name ?? ''],
                      ['Opponent', opponentTeam?.name ?? ''],
                      ['Format', format],
                      ['Area', area],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', color: '#49454F' }}>{label}</span>
                        <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', fontWeight: 500, color: '#1C1B1F' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {error && <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', color: '#B3261E' }}>{error}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={handleNext} disabled={!canNext || submitting}
            className="w-full h-[52px] rounded-2xl flex items-center justify-center transition-all active:scale-95 mb-8"
            style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)', boxShadow: '0 4px 12px rgba(46,125,50,0.35)', opacity: canNext && !submitting ? 1 : 0.5 }}>
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: 500, color: 'white' }}>
              {submitting ? 'Sending...' : step < 3 ? 'Continue →' : '⚔️ Send Challenge'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
