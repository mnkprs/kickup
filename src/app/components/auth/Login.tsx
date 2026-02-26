import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Eye, EyeOff, ArrowLeft, Mail, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSignIn = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    navigate('/app');
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
  };

  return (
    <div className="fixed inset-0 flex justify-center bg-[#FFFBFE]" style={{ background: 'linear-gradient(180deg, #E8F5E9 0%, #FFFBFE 40%)' }}>
      <div className="w-full max-w-[430px] flex flex-col overflow-y-auto">
        <div className="flex items-center px-4 pt-12 pb-4">
          <button onClick={() => navigate('/splash')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors">
            <ArrowLeft size={22} color="#49454F" />
          </button>
        </div>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 pt-4 pb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%)' }}>
            <span style={{ fontSize: '32px' }}>⚽</span>
          </div>
          <h1 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', fontWeight: 500, color: '#1C1B1F' }}>Welcome back</h1>
          <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#49454F' }}>Sign in to continue playing</p>
        </motion.div>
        <div className="px-6 flex flex-col gap-4">
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            onClick={handleGoogleSignIn}
            className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-3 border-2 border-[#CAC4D0] bg-white hover:bg-[#F1F8F2] transition-colors shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '15px', fontWeight: 500, color: '#1C1B1F' }}>Continue with Google</span>
          </motion.button>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#CAC4D0]" />
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#79747E' }}>or</span>
            <div className="flex-1 h-px bg-[#CAC4D0]" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2"><Mail size={18} color="#79747E" /></div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
              className="w-full h-[56px] pl-12 pr-4 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors"
              style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#1C1B1F' }} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2"><Lock size={18} color="#79747E" /></div>
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
              className="w-full h-[56px] pl-12 pr-12 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors"
              style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#1C1B1F' }} />
            <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2">
              {showPass ? <EyeOff size={18} color="#79747E" /> : <Eye size={18} color="#79747E" />}
            </button>
          </motion.div>
          {error && <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', color: '#B3261E' }}>{error}</p>}
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            onClick={handleEmailSignIn} disabled={loading || !email || !password}
            className="w-full h-[52px] rounded-2xl flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)', boxShadow: '0 4px 12px rgba(46,125,50,0.35)', opacity: loading ? 0.7 : 1 }}
          >
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: 500, color: 'white' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </span>
          </motion.button>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="flex items-center justify-center gap-1 pt-2 pb-8">
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#49454F' }}>New to Kickup?</span>
            <button onClick={() => navigate('/register')} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#2E7D32', fontWeight: 500 }}>
              Create account
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
