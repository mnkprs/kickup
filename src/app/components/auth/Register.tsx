import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAvatarColors } from '../../hooks/useConfig';

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarColor, setAvatarColor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { colors, loading: colorsLoading } = useAvatarColors();

  const activeColor = avatarColor || colors[0] || '#2E7D32';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const fieldStyle = "w-full h-[56px] px-4 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors";
  const fontStyle = { fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#1C1B1F' };
  const labelStyle = { fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: 500 as const, color: '#49454F', textTransform: 'uppercase' as const, letterSpacing: '0.5px' };

  const canSubmit = !!name && !!email && !!password && !!confirmPassword && password === confirmPassword && !colorsLoading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, avatar_color: activeColor },
      },
    });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    navigate('/app');
  };

  return (
    <div className="fixed inset-0 flex justify-center" style={{ background: 'linear-gradient(180deg, #E8F5E9 0%, #FFFBFE 40%)' }}>
      <div className="w-full max-w-[430px] flex flex-col overflow-y-auto">
        <div className="flex items-center px-4 pt-12 pb-4">
          <button onClick={() => navigate('/login')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors">
            <ArrowLeft size={22} color="#49454F" />
          </button>
        </div>

        <div className="px-6 flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
            <div>
              <h1 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', fontWeight: 500, color: '#1C1B1F' }}>Create your account</h1>
              <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#49454F', marginTop: '4px' }}>Join the community. First match is always free.</p>
            </div>

            {/* Avatar colour picker */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg"
                style={{ background: activeColor, fontSize: '28px', fontWeight: 700, fontFamily: 'Roboto, sans-serif' }}>
                {initials}
              </div>
              <div className="flex gap-2">
                {colorsLoading
                  ? <div className="h-6 w-40 rounded-full bg-[#E8F5E9] animate-pulse" />
                  : colors.map(c => (
                    <button key={c} onClick={() => setAvatarColor(c)} className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                      style={{ background: c, border: activeColor === c ? '2px solid white' : '2px solid transparent', boxShadow: activeColor === c ? `0 0 0 2px ${c}` : 'none' }} />
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
            <div className="flex flex-col gap-1">
              <span style={labelStyle}>Confirm Password</span>
              <input
                className={fieldStyle}
                style={{ ...fontStyle, borderColor: confirmPassword && confirmPassword !== password ? '#B3261E' : undefined }}
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
              />
              {confirmPassword && confirmPassword !== password ? (
                <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#B3261E' }}>Passwords do not match</span>
              ) : null}
            </div>

            {error ? <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', color: '#B3261E' }}>{error}</p> : null}
          </motion.div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full h-[52px] rounded-2xl flex items-center justify-center transition-all active:scale-95 mb-8"
            style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)', boxShadow: '0 4px 12px rgba(46,125,50,0.35)', opacity: !canSubmit || loading ? 0.5 : 1 }}>
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: 500, color: 'white' }}>
              {loading ? 'Creating…' : 'Create Account'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
