import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Camera, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];
const AREAS = ['Kolonaki', 'Exarcheia', 'Pangrati', 'Glyfada', 'Kifisia', 'Piraeus', 'Nea Smyrni', 'Chalandri', 'Koupi', 'Markopoulo', 'Other'];
const AVATAR_COLORS = ['#2E7D32', '#1565C0', '#6A1B9A', '#E65100', '#00695C', '#BF360C', '#37474F', '#F9A825'];

export function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('');
  const [area, setArea] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const fieldStyle = "w-full h-[56px] px-4 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors";
  const fontStyle = { fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#1C1B1F' };
  const labelStyle = { fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: 500, color: '#49454F', textTransform: 'uppercase' as const, letterSpacing: '0.5px' };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, position, area, avatar_color: avatarColor },
      },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    navigate('/app');
  };

  return (
    <div className="fixed inset-0 flex justify-center" style={{ background: 'linear-gradient(180deg, #E8F5E9 0%, #FFFBFE 40%)' }}>
      <div className="w-full max-w-[430px] flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/login')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors">
            <ArrowLeft size={22} color="#49454F" />
          </button>
          <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#79747E' }}>Step {step} of 2</span>
        </div>
        <div className="mx-6 h-1 bg-[#E8F5E9] rounded-full overflow-hidden mb-8">
          <motion.div className="h-full bg-[#2E7D32] rounded-full" animate={{ width: `${step * 50}%` }} transition={{ type: 'spring', stiffness: 200 }} />
        </div>
        <div className="px-6 flex flex-col gap-6">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6">
              <div>
                <h1 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', fontWeight: 500, color: '#1C1B1F' }}>Create your account</h1>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#49454F', marginTop: '4px' }}>Join the community. First match is always free.</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer relative" style={{ background: avatarColor, fontSize: '28px', fontWeight: 700, fontFamily: 'Roboto, sans-serif' }}>
                  {initials}
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#2E7D32] rounded-full flex items-center justify-center shadow">
                    <Camera size={12} color="white" />
                  </div>
                </div>
                <div className="flex gap-2">
                  {AVATAR_COLORS.map(c => (
                    <button key={c} onClick={() => setAvatarColor(c)} className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                      style={{ background: c, border: avatarColor === c ? '2px solid white' : '2px solid transparent', boxShadow: avatarColor === c ? `0 0 0 2px ${c}` : 'none' }} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span style={labelStyle}>Full Name</span>
                <input className={fieldStyle} style={fontStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nikos Papadopoulos" />
              </div>
              <div className="flex flex-col gap-1">
                <span style={labelStyle}>Email</span>
                <input className={fieldStyle} style={fontStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
              </div>
              <div className="flex flex-col gap-1">
                <span style={labelStyle}>Password</span>
                <input className={fieldStyle} style={fontStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6">
              <div>
                <h1 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', fontWeight: 500, color: '#1C1B1F' }}>Your player profile</h1>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#49454F', marginTop: '4px' }}>Tell us what you bring to the pitch.</p>
              </div>
              <div className="flex flex-col gap-2">
                <span style={labelStyle}>Position</span>
                <div className="flex gap-3">
                  {POSITIONS.map(pos => (
                    <button key={pos} onClick={() => setPosition(pos)} className="flex-1 h-[56px] rounded-2xl border-2 flex items-center justify-center transition-all"
                      style={{ borderColor: position === pos ? '#2E7D32' : '#CAC4D0', background: position === pos ? '#E8F5E9' : 'white', fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: position === pos ? 700 : 400, color: position === pos ? '#2E7D32' : '#49454F' }}>
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span style={labelStyle}>Area / Neighbourhood</span>
                <div className="relative">
                  <select value={area} onChange={e => setArea(e.target.value)} className="w-full h-[56px] px-4 pr-10 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors appearance-none"
                    style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: area ? '#1C1B1F' : '#79747E' }}>
                    <option value="" disabled>Select your area...</option>
                    {AREAS.map(a => <option key={a} value={a}>{a}, Athens</option>)}
                  </select>
                  <ChevronDown size={18} color="#79747E" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              {error && <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', color: '#B3261E' }}>{error}</p>}
            </motion.div>
          )}
          <button
            onClick={() => { if (step === 1) setStep(2); else handleSubmit(); }}
            disabled={loading || (step === 1 && (!name || !email || !password))}
            className="w-full h-[52px] rounded-2xl flex items-center justify-center transition-all active:scale-95 mb-8"
            style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)', boxShadow: '0 4px 12px rgba(46,125,50,0.35)', opacity: loading ? 0.7 : 1 }}
          >
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: 500, color: 'white' }}>
              {step === 1 ? 'Continue →' : (loading ? 'Creating...' : 'Create Account')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
