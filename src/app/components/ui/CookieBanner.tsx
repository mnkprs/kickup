import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const STORAGE_KEY = 'kickup_cookie_consent';

type ConsentState = 'accepted' | 'essential' | null;

export function CookieBanner() {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [showManage, setShowManage] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const accept = (state: ConsentState) => {
    if (state) localStorage.setItem(STORAGE_KEY, state);
    setVisible(false);
  };

  const bg    = isDark ? '#2D2C31' : 'white';
  const text  = isDark ? '#E6E1E5' : '#1C1B1F';
  const muted = isDark ? '#938F99' : '#49454F';
  const border = isDark ? '#49454F' : '#E7E0EC';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
          className="absolute bottom-[88px] left-3 right-3 z-50 rounded-3xl shadow-2xl"
          style={{ background: bg, border: `1px solid ${border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
        >
          {!showManage ? (
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p style={{ fontSize: '15px', fontWeight: 600, color: text }}>🍪 We use cookies</p>
                  <p style={{ fontSize: '13px', color: muted, marginTop: '4px', lineHeight: 1.5 }}>
                    We use essential cookies to keep you signed in and optional analytics to improve the app.
                  </p>
                </div>
                <button onClick={() => accept('essential')} className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: isDark ? '#3A3940' : '#F4EFF4' }}>
                  <X size={14} color={muted} />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowManage(true)}
                  className="flex-1 h-10 rounded-2xl border"
                  style={{ borderColor: border, color: muted, fontSize: '13px', fontWeight: 500 }}>
                  Manage
                </button>
                <button
                  onClick={() => accept('accepted')}
                  className="flex-1 h-10 rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, #2E7D32, #43A047)', color: 'white', fontSize: '13px', fontWeight: 600 }}>
                  Accept All
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p style={{ fontSize: '15px', fontWeight: 600, color: text }}>Manage Preferences</p>
                <button onClick={() => setShowManage(false)} className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: isDark ? '#3A3940' : '#F4EFF4' }}>
                  <X size={14} color={muted} />
                </button>
              </div>

              {/* Essential — always on */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: text }}>Essential</p>
                  <p style={{ fontSize: '12px', color: muted }}>Auth session, app preferences. Always on.</p>
                </div>
                <div className="w-12 h-6 rounded-full flex items-center px-1" style={{ background: '#2E7D32' }}>
                  <div className="w-5 h-5 bg-white rounded-full shadow" style={{ marginLeft: 'auto' }} />
                </div>
              </div>

              {/* Analytics — optional */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: text }}>Analytics</p>
                  <p style={{ fontSize: '12px', color: muted }}>Help us understand how the app is used.</p>
                </div>
                <div className="w-12 h-6 rounded-full flex items-center px-1" style={{ background: isDark ? '#49454F' : '#E7E0EC' }}>
                  <div className="w-5 h-5 bg-white rounded-full shadow" />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => accept('essential')}
                  className="flex-1 h-10 rounded-2xl border"
                  style={{ borderColor: border, color: muted, fontSize: '13px', fontWeight: 500 }}>
                  Essential Only
                </button>
                <button
                  onClick={() => accept('accepted')}
                  className="flex-1 h-10 rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, #2E7D32, #43A047)', color: 'white', fontSize: '13px', fontWeight: 600 }}>
                  Accept All
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
