import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Bell, Swords, Calendar, Trophy, AlertTriangle, CheckCheck, User, ChevronRight } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { timeAgo } from '../../lib/timeAgo';
import type { Notification } from '../../types/database';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  challenge:          { icon: Swords,        color: '#2E7D32', bg: '#E8F5E9' },
  scheduling:         { icon: Calendar,      color: '#1565C0', bg: '#E3F2FD' },
  spot_applied:       { icon: User,          color: '#E65100', bg: '#FFF3E0' },
  result_confirmed:   { icon: Trophy,        color: '#2E7D32', bg: '#E8F5E9' },
  bet_reminder:       { icon: AlertTriangle, color: '#E65100', bg: '#FFF3E0' },
  match_reminder:     { icon: Calendar,      color: '#1565C0', bg: '#E3F2FD' },
  team_invite:        { icon: User,          color: '#6A1B9A', bg: '#F3E5F5' },
  tournament_approved:{ icon: Trophy,        color: '#2E7D32', bg: '#E8F5E9' },
  tournament_rejected:{ icon: Trophy,        color: '#B3261E', bg: '#FFEBEE' },
  tournament_invite:  { icon: Trophy,        color: '#6A1B9A', bg: '#F3E5F5' },
  general:            { icon: Bell,          color: '#49454F', bg: '#F3EDF7' },
};

function getNotifPath(notif: Notification): string | null {
  switch (notif.type) {
    case 'challenge':
      return '/app/matches';
    case 'scheduling':
    case 'result_confirmed':
    case 'match_reminder':
    case 'bet_reminder':
      return notif.match_id ? `/app/matches/${notif.match_id}/pre` : '/app/matches';
    case 'spot_applied':
      // Organizer gets this — go to manage page
      return notif.tournament_id ? `/app/tournaments/${notif.tournament_id}/manage` : '/app/tournaments';
    case 'tournament_approved':
    case 'tournament_invite':
      // Captain gets this — go to tournament detail
      return notif.tournament_id ? `/app/tournaments/${notif.tournament_id}` : '/app/tournaments';
    case 'tournament_rejected':
      return '/app/tournaments';
    case 'team_invite':
      return notif.team_id ? `/app/teams/${notif.team_id}` : '/app/teams';
    default:
      return null;
  }
}

export function Notifications() {
  const { isDark, bg, cardBg, textPrimary, textSecondary, borderColor } = useThemeColors();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifs, loading, markRead, markAllRead } = useNotifications(user?.id);

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
              onClick={() => {
                markRead(notif.id);
                const path = getNotifPath(notif);
                if (path) navigate(path);
              }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                <Icon size={18} color={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: '14px', fontWeight: notif.read ? 400 : 600, color: textPrimary }}>{notif.title}</p>
                <p style={{ fontSize: '13px', color: textSecondary, marginTop: '2px' }}>{notif.body}</p>
                <p style={{ fontSize: '11px', color: textSecondary, marginTop: '4px' }}>{timeAgo(notif.created_at)}</p>
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                {!notif.read && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#2E7D32' }} />
                )}
                {getNotifPath(notif) && (
                  <ChevronRight size={16} color={textSecondary} />
                )}
              </div>
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
