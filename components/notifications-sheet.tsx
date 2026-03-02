"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X, Bell, Swords, CalendarClock, Trophy, Clock, CheckCircle2, Users, UserPlus } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Notification } from "@/lib/types";
import { markNotificationsReadAction } from "@/app/actions/profile";

function getNotificationHref(notif: Notification): string | null {
  if (notif.match_id) return `/matches/${notif.match_id}`;
  if (notif.team_id) return `/teams/${notif.team_id}`;
  if (notif.tournament_id) return `/tournaments/${notif.tournament_id}`;
  return null;
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; iconClass: string; bgClass: string }> = {
  challenge:           { icon: Swords,        iconClass: "text-accent",     bgClass: "bg-accent/15" },
  scheduling:          { icon: CalendarClock, iconClass: "text-draw",       bgClass: "bg-draw/15" },
  result_confirmed:    { icon: CheckCircle2,  iconClass: "text-win",        bgClass: "bg-win/15" },
  match_reminder:      { icon: Clock,         iconClass: "text-info",       bgClass: "bg-info/15" },
  tournament_approved: { icon: Trophy,        iconClass: "text-draw",       bgClass: "bg-draw/15" },
  team_invite:         { icon: Users,         iconClass: "text-accent",     bgClass: "bg-accent/15" },
  team_seeking_players:{ icon: UserPlus,      iconClass: "text-accent",     bgClass: "bg-accent/15" },
  spot_applied:        { icon: Users,         iconClass: "text-muted-foreground", bgClass: "bg-muted" },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? { icon: Bell, iconClass: "text-muted-foreground", bgClass: "bg-muted" };
}

interface NotificationsSheetProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkedRead?: () => void;
}

export function NotificationsSheet({ open, onClose, notifications, onMarkedRead }: NotificationsSheetProps) {
  const hasMarkedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      hasMarkedRef.current = false;
      return;
    }
    const hasUnread = notifications.some((n) => !n.read);
    if (hasUnread && !hasMarkedRef.current) {
      hasMarkedRef.current = true;
      markNotificationsReadAction().then(() => onMarkedRead?.());
    }
  }, [open, notifications, onMarkedRead]);

  if (!open) return null;

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);
  const grouped = [
    ...(unread.length > 0 ? [{ label: "New", items: unread }] : []),
    ...(read.length > 0 ? [{ label: unread.length > 0 ? "Earlier" : "All", items: read }] : []),
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-background border-l border-border shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Notifications</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}

          {grouped.map(({ label, items }) => (
            <div key={label}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                {label}
              </p>
              <div className="flex flex-col gap-2">
                {items.map((notif) => {
                  const { icon: Icon, iconClass, bgClass } = getConfig(notif.type);
                  const href = getNotificationHref(notif);
                  const content = (
                    <>
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${bgClass}`}
                        style={notif.avatar_color ? { backgroundColor: notif.avatar_color + "33" } : undefined}
                      >
                        {notif.avatar_emoji ? (
                          <span className="text-base">{notif.avatar_emoji}</span>
                        ) : (
                          <Icon size={16} className={iconClass} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">{notif.title}</p>
                        {notif.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.body}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(parseISO(notif.created_at), "d MMM · HH:mm")}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-1.5" />
                      )}
                    </>
                  );
                  const className = `rounded-xl border p-4 flex items-start gap-3 transition-colors shadow-card ${
                    !notif.read ? "bg-card border-accent/20" : "bg-card border-border"
                  } ${href ? "cursor-pointer hover:border-accent/40" : ""}`;
                  return href ? (
                    <Link
                      key={notif.id}
                      href={href}
                      onClick={onClose}
                      className={className}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={notif.id} className={className}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
