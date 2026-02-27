import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, ChevronRight, MapPin, Swords, Coffee } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTeams } from '../../hooks/useTeams';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import type { MatchFormat, Team } from '../../types/database';

const FORMATS: MatchFormat[] = ['5v5', '6v6', '7v7', '8v8', '11v11'];
const STEPS = ['Your Team', 'Opponent', 'Details', 'Send!'];

export function ChallengeScreen() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { captainTeam } = useAuth();
  const { teams } = useTeams({ searching_for_opponent: true });

  const [step, setStep] = useState(0);
  const [opponentId, setOpponentId] = useState('');
  const [format, setFormat] = useState<MatchFormat | ''>('');
  const [area, setArea] = useState('');
  const [bet, setBet] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const bg = isDark ? '#1C1B1F' : '#FFFBFE';
  const cardBg = isDark ? '#2D2C31' : 'white';
  const textPrimary = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#CAC4D0' : '#49454F';
  const borderColor = isDark ? '#49454F' : '#E7E0EC';

  const opponentTeams = teams.filter(t => t.id !== captainTeam?.id);
  const opponentTeam: Team | undefined = opponentTeams.find(t => t.id === opponentId);

  const areaOptions = ['Anywhere', ...(captainTeam?.area ? [captainTeam.area] : []), ...(opponentTeam?.area && opponentTeam.area !== captainTeam?.area ? [opponentTeam.area] : [])];

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
      p_message: bet || null,
    });
    setSubmitting(false);
    if (rpcError) { setError(rpcError.message); return; }
    setSent(true);
    setTimeout(() => navigate('/app/matches'), 1500);
  };

  if (sent) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6" style={{ background: bg }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%)' }}>
          <Swords size={40} color="white" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center px-8">
          <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', fontWeight: 700, color: textPrimary }}>Challenge Sent! ⚔️</p>
          <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: textSecondary, marginTop: '8px' }}>
            {opponentTeam?.name} has been challenged. Now we wait!
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors shrink-0">
          <ArrowLeft size={22} color={textSecondary} />
        </button>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 500, color: textPrimary }}>Send Challenge</h1>
          <p style={{ fontSize: '12px', color: textSecondary }}>Step {step + 1} of {STEPS.length}</p>
        </div>
      </div>

      {/* Segmented progress bar */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
              style={{ background: i <= step ? '#2E7D32' : (isDark ? '#49454F' : '#E0E0E0') }} />
          ))}
        </div>
        <p style={{ fontSize: '12px', color: '#2E7D32', fontWeight: 500, marginTop: '6px' }}>{STEPS[step]}</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4">

          {/* Step 0: Your team */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <p style={{ fontSize: '14px', color: textSecondary }}>Challenging as:</p>
              {captainTeam ? (
                <div className="p-4 rounded-3xl border-2 flex items-center gap-4"
                  style={{ background: cardBg, borderColor: '#2E7D32' }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: `${captainTeam.color}20`, border: `2px solid ${captainTeam.color}40` }}>
                    <span style={{ fontSize: '32px' }}>{captainTeam.emoji}</span>
                  </div>
                  <div className="flex-1">
                    <p style={{ fontSize: '18px', fontWeight: 700, color: textPrimary }}>{captainTeam.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin size={12} color={textSecondary} />
                      <span style={{ fontSize: '13px', color: textSecondary }}>{captainTeam.area}</span>
                      <span style={{ fontSize: '13px', color: textSecondary }}>·</span>
                      <span style={{ fontSize: '13px', color: textSecondary }}>{captainTeam.format}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#2E7D32', marginTop: '4px' }}>
                      {captainTeam.record_w}W {captainTeam.record_d}D {captainTeam.record_l}L
                    </p>
                  </div>
                  <Check size={20} color="#2E7D32" className="ml-auto shrink-0" />
                </div>
              ) : (
                <div className="p-4 rounded-2xl border-2 border-dashed border-[#CAC4D0] text-center">
                  <p style={{ fontSize: '14px', color: '#79747E' }}>You're not a captain of any team.</p>
                  <p style={{ fontSize: '12px', color: '#79747E', marginTop: '4px' }}>Create or join a team as captain to send challenges.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Select opponent */}
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <p style={{ fontSize: '14px', color: textSecondary }}>
                Choose your opponent ({opponentTeams.length} team{opponentTeams.length !== 1 ? 's' : ''} available):
              </p>
              {opponentTeams.length === 0 && (
                <p style={{ fontSize: '14px', color: textSecondary, textAlign: 'center', paddingTop: '16px' }}>
                  No teams are currently searching for opponents.
                </p>
              )}
              {opponentTeams.map(t => (
                <button key={t.id} onClick={() => setOpponentId(t.id)}
                  className="flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all"
                  style={{ background: cardBg, borderColor: opponentId === t.id ? '#2E7D32' : borderColor }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${t.color}20`, border: `1px solid ${t.color}40` }}>
                    <span style={{ fontSize: '24px' }}>{t.emoji}</span>
                  </div>
                  <div className="flex-1">
                    <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>{t.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <MapPin size={11} color={textSecondary} />
                      <span style={{ fontSize: '12px', color: textSecondary }}>{t.area}</span>
                      <span style={{ fontSize: '12px', color: textSecondary }}>·</span>
                      <span style={{ fontSize: '12px', color: textSecondary }}>{t.record_w}W {t.record_d}D {t.record_l}L</span>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: opponentId === t.id ? '#2E7D32' : borderColor, background: opponentId === t.id ? '#2E7D32' : 'transparent' }}>
                    {opponentId === t.id && <Check size={14} color="white" />}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              {/* VS preview */}
              {captainTeam && opponentTeam && (
                <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: isDark ? '#1E2B1E' : '#E8F5E9' }}>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <span style={{ fontSize: '28px' }}>{captainTeam.emoji}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>{captainTeam.short_name}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Swords size={20} color="#2E7D32" />
                    <span style={{ fontSize: '11px', color: textSecondary, marginTop: '2px' }}>VS</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <span style={{ fontSize: '28px' }}>{opponentTeam.emoji}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>{opponentTeam.short_name}</span>
                  </div>
                </div>
              )}

              {/* Format */}
              <div>
                <p style={{ fontSize: '12px', fontWeight: 500, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Match Format</p>
                <div className="flex gap-2 flex-wrap">
                  {FORMATS.map(f => (
                    <button key={f} onClick={() => setFormat(f)}
                      className="flex-1 h-[48px] rounded-xl border-2 transition-all"
                      style={{ borderColor: format === f ? '#2E7D32' : borderColor, background: format === f ? '#E8F5E9' : cardBg, color: format === f ? '#2E7D32' : textSecondary, fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: format === f ? 700 : 400 }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area preference */}
              <div>
                <p style={{ fontSize: '12px', fontWeight: 500, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Area Preference</p>
                <div className="flex flex-wrap gap-2">
                  {areaOptions.map(a => (
                    <button key={a} onClick={() => setArea(a)}
                      className="px-4 py-2 rounded-full border-2 transition-all"
                      style={{ borderColor: area === a ? '#2E7D32' : borderColor, background: area === a ? '#E8F5E9' : cardBg, color: area === a ? '#2E7D32' : textSecondary, fontSize: '13px', fontWeight: area === a ? 700 : 400 }}>
                      {a === 'Anywhere' ? '🌍 Anywhere' : `📍 ${a}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bet/message */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Coffee size={14} color="#E65100" />
                  <p style={{ fontSize: '12px', fontWeight: 500, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Informal Bet (optional)</p>
                </div>
                <input value={bet} onChange={e => setBet(e.target.value)}
                  placeholder='e.g. "Losers buy coffee for everyone"'
                  className="w-full h-[52px] px-4 rounded-2xl border-2 outline-none transition-colors"
                  style={{ background: cardBg, borderColor: isDark ? '#49454F' : '#CAC4D0', fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: textPrimary }}
                />
                <p style={{ fontSize: '11px', color: textSecondary, marginTop: '4px' }}>🤝 Honor system only — no real money involved.</p>
              </div>
            </div>
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p style={{ fontSize: '16px', fontWeight: 500, color: textPrimary }}>Challenge summary:</p>
              {[
                { label: 'From', value: `${captainTeam?.emoji} ${captainTeam?.name}` },
                { label: 'To', value: `${opponentTeam?.emoji} ${opponentTeam?.name}` },
                { label: 'Format', value: format },
                { label: 'Area', value: area },
                ...(bet ? [{ label: 'Bet', value: `☕ ${bet}` }] : []),
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-2xl border" style={{ background: cardBg, borderColor }}>
                  <span style={{ fontSize: '13px', color: textSecondary }}>{item.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>{item.value}</span>
                </div>
              ))}
              <div className="p-4 rounded-2xl" style={{ background: isDark ? '#1E3A1E' : '#E8F5E9', border: '1px solid #2E7D32' }}>
                <p style={{ fontSize: '13px', color: '#2E7D32', lineHeight: 1.6 }}>
                  ⚔️ Ready to send? {opponentTeam?.name} will receive your challenge and can accept or decline.
                </p>
              </div>
              {error && <p style={{ fontSize: '13px', color: '#B3261E' }}>{error}</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Continue / Send button */}
      <div className="px-4 mt-8 pb-8">
        {step < STEPS.length - 1 ? (
          <button onClick={handleNext} disabled={!canNext}
            className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: canNext ? 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)' : (isDark ? '#49454F' : '#E0E0E0'), color: canNext ? 'white' : (isDark ? '#79747E' : '#9E9E9E'), boxShadow: canNext ? '0 4px 12px rgba(46,125,50,0.25)' : 'none' }}>
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: 500 }}>Continue</span>
            <ChevronRight size={18} />
          </button>
        ) : (
          <button onClick={handleNext} disabled={submitting}
            className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)', boxShadow: '0 4px 16px rgba(46,125,50,0.4)', opacity: submitting ? 0.7 : 1 }}>
            <Swords size={20} color="white" />
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: 700, color: 'white' }}>
              {submitting ? 'Sending...' : 'Send Challenge!'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
