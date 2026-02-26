import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Bell, Swords, Calendar, Trophy, AlertTriangle, CheckCheck, User } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { timeAgo } from '../../lib/timeAgo';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  challenge: { icon: Swords, color: '#2E7D32', bg: '#E8F5E9' },
  scheduling: { icon: Calendar, color: '#1565C0', bg: '#E3F2FD' },
  spot_applied: { icon: User, color: '#E65100', bg: '#FFF3E0' },
  result_confirmed: { icon: Trophy, color: '#2E7D32', bg: '#E8F5E9' },
  bet_reminder: { icon: AlertTriangle, color: '#E65100', bg: '#FFF3E0' },
  match_reminder: { icon: Calendar, color: '#1565C0', bg: '#E3F2FD' },
  general: { icon: Bell, color: '#49454F', bg: '#F3EDF7' },
};

export function Notifications() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifs, loading, markRead, markAllRead } = useNotifications(user?.id);

  const bg = isDark ? '#1C1B1F' : '#FFFBFE';
  const cardBg = isDark ? '#2D2C31' : 'white';
  const textPrimary = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#CAC4D0' : '#49454F';
  const borderColor = isDark ? '#49454F' : '#E7E0EC';

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      <div className="px-4 pt-12 pb-3 sticky top-0 z-20 flex items-center gap-3" style={{ background: bg, borderBottom: `1px solid ${borderColor}` }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors">
          <ArrowLeft size={20} color={textSecondary} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: textPrimary, flex: 1 }}>Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1" style={{ color: '#2E7D32', fontSize: '13px', fontWeight: 500 }}>
            <CheckCheck size={16} color="#2E7D32" /> Mark all read
          </button>
        )}
      </div>

      <div className="px-4 pt-4 pb-24 flex flex-col gap-2">
        {loading && (
          <div className="flex justify-center pt-16">
            <div className="w-8 h-8 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && notifs.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-20">
            <Bell size={48} color={textSecondary} />
            <p style={{ fontSize: '16px', color: textSecondary }}>No notifications yet</p>
          </div>
        )}
        {notifs.map((notif, i) => {
          const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.general;
          const Icon = cfg.icon;
          return (
            <motion.div key={notif.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="p-4 rounded-2xl border flex items-start gap-3 cursor-pointer"
              style={{ background: notif.read ? cardBg : (isDark ? '#1E2B1E' : '#F1F8F2'), borderColor: notif.read ? borderColor : '#2E7D32' }}
              onClick={() => markRead(notif.id)}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                <Icon size={18} color={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: '14px', fontWeight: notif.read ? 400 : 600, color: textPrimary }}>{notif.title}</p>
                <p style={{ fontSize: '13px', color: textSecondary, marginTop: '2px' }}>{notif.body}</p>
                <p style={{ fontSize: '11px', color: textSecondary, marginTop: '4px' }}>{timeAgo(notif.created_at)}</p>
              </div>
              {!notif.read && (
                <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ background: '#2E7D32' }} />
              )}
            </motion.div>
          );
        })}

        {notifs.some(n => n.type === 'challenge' && !n.read) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="p-4 rounded-2xl mt-2" style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>You have a pending challenge!</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>A team wants to play against you. Review and accept or decline.</p>
            <button onClick={() => navigate('/app/matches')}
              className="px-4 py-2 rounded-xl"
              style={{ background: 'white', color: '#2E7D32', fontSize: '14px', fontWeight: 600 }}>
              View Challenge →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
