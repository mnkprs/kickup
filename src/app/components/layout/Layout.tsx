import { Outlet, useLocation, useNavigate } from 'react-router';
import { Home, Trophy, Users, User, Bell, Plus, Search, Target, Calendar, SlidersHorizontal } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';

const NAV_ITEMS = [
  { to: '/app', icon: Home, label: 'Home' },
  { to: '/app/matches', icon: Calendar, label: 'Matches' },
  { to: '/app/tournaments', icon: Trophy, label: 'Tourneys' },
  { to: '/app/notifications', icon: Bell, label: 'Alerts', isBell: true },
  { to: '/app/profile', icon: User, label: 'Profile' },
];

export function Layout() {
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [fabOpen, setFabOpen] = useState(false);
  const [fabVisible, setFabVisible] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => {
      const y = el.scrollTop;
      if (y < 10) { setFabVisible(true); }
      else if (y > lastScrollY.current + 5) { setFabVisible(false); setFabOpen(false); }
      else if (y < lastScrollY.current - 5) { setFabVisible(true); }
      lastScrollY.current = y;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  const { user, profile, isAdmin } = useAuth();
  const { notifs } = useNotifications(user?.id);
  const unread = user ? notifs.filter(n => !n.read).length : 0;

  const surfaceBg = isDark ? '#1C1B1F' : '#FFFBFE';
  const navBg = isDark ? '#2D2C31' : 'white';
  const navBorder = isDark ? '#3E3D43' : '#E7E0EC';

  const isActive = (to: string) => {
    if (to === '/app') return location.pathname === '/app';
    return location.pathname.startsWith(to);
  };

  const activeColor = isDark ? '#81C784' : '#2E7D32';
  const inactiveColor = isDark ? '#938F99' : '#79747E';
  const activePillBg = isDark ? '#1E3A1E' : '#C8E6C9';

  return (
    <div className={`fixed inset-0 flex justify-center ${isDark ? 'bg-[#121212]' : 'bg-[#E8F5E9]'}`}>
      <div className="relative w-full max-w-[430px] flex flex-col" style={{ background: surfaceBg, boxShadow: '0 0 40px rgba(0,0,0,0.15)' }}>
        <main ref={mainRef} className="flex-1 overflow-y-auto" style={{ paddingBottom: '80px' }}>
          <Outlet />
        </main>

        {fabOpen && (
          <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setFabOpen(false)} />
        )}

        <motion.div
          className="absolute right-4 z-40"
          style={{ bottom: '92px' }}
          animate={{ y: fabVisible ? 0 : 100, opacity: fabVisible ? 1 : 0, pointerEvents: fabVisible ? 'auto' : 'none' }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
        >
          {location.pathname === '/app/tournaments' ? (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openTournamentFilter'))}
              className="w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6A1B9A 0%, #AB47BC 100%)',
                boxShadow: '0 4px 16px rgba(106,27,154,0.45)',
              }}
            >
              <SlidersHorizontal size={24} color="white" />
            </button>
          ) : (
            <>
              {fabOpen && (
                <div className="absolute bottom-[72px] right-0 flex flex-col gap-3 items-end">
                  {[
                    { label: 'Challenge a Team', icon: Target, color: '#2E7D32', path: '/app/matches/challenge' },
                    { label: 'Find Open Spot', icon: Search, color: '#E65100', path: '/app/discover' },
                    { label: 'Browse Teams', icon: Users, color: '#1565C0', path: '/app/teams' },
                    { label: 'Create a Team', icon: Users, color: '#0D47A1', path: '/app/teams/create' },
                    ...(profile?.is_field_owner || isAdmin
                      ? [{ label: 'Create Tournament', icon: Trophy, color: '#6A1B9A', path: '/app/tournaments/create' }]
                      : []),
                  ].map(({ label, icon: Icon, color, path }) => (
                    <button
                      key={path}
                      onClick={() => { navigate(path); setFabOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white shadow-xl"
                      style={{ background: color }}
                    >
                      <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500 }}>{label}</span>
                      <Icon size={18} />
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setFabOpen(!fabOpen)}
                className="w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-200"
                style={{
                  background: fabOpen ? '#1C1B1F' : 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)',
                  boxShadow: '0 4px 16px rgba(46,125,50,0.45)',
                }}
              >
                <div style={{ transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <Plus size={24} color="white" />
                </div>
              </button>
            </>
          )}
        </motion.div>

        <nav
          className="absolute bottom-0 left-0 right-0 z-30 flex items-start justify-around pt-2 pb-1 px-1"
          style={{ height: '80px', background: navBg, borderTop: `1px solid ${navBorder}` }}
        >
          {NAV_ITEMS.map(({ to, icon: Icon, label, isBell }) => {
            const active = isActive(to);
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="flex flex-col items-center gap-1 flex-1 py-1"
              >
                <div
                  className="w-14 h-8 flex items-center justify-center rounded-full transition-all duration-200"
                  style={{ background: active ? activePillBg : 'transparent' }}
                >
                  <div className="relative">
                    <Icon size={22} color={active ? activeColor : inactiveColor} />
                    {isBell && unread > 0 && (
                      <span
                        className="absolute flex items-center justify-center rounded-full bg-[#B3261E] text-white"
                        style={{ width: '14px', height: '14px', top: '-5px', right: '-6px', fontSize: '8px', fontWeight: 700 }}
                      >
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: active ? 700 : 400, color: active ? activeColor : inactiveColor }}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
