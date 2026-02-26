import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

export function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/login'), 2800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#1A1A1A' }}>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1601788505117-18947ac4f2e6?w=800&q=80)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1B5E20]/80 via-[#1A1A1A]/60 to-[#1A1A1A]" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl mb-2"
            style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #81C784 100%)', boxShadow: '0 8px 32px rgba(46,125,50,0.5)' }}
          >
            <span style={{ fontSize: '48px' }}>⚽</span>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ fontFamily: 'Roboto Condensed, Roboto, sans-serif', fontSize: '52px', fontWeight: 700, color: 'white', letterSpacing: '-1px', lineHeight: 1 }}
          >
            Kickup
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: 400, color: '#A5D6A7', letterSpacing: '2px', textTransform: 'uppercase' }}
          >
            Organize · Play · Win
          </motion.p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-16 flex flex-col items-center gap-6"
        >
          <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#78909C' }}>
            Amateur football, serious fun.
          </p>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-[#4CAF50]"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
