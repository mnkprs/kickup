"use client";

import { useState, useCallback, useEffect } from "react";
import { Bell } from "lucide-react";
import { getNotificationsAction } from "@/app/actions/profile";
import { NotificationsSheet } from "@/components/notifications-sheet";
import type { Notification } from "@/lib/types";

export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const data = await getNotificationsAction();
    setNotifications(data ?? []);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleOpen = useCallback(async () => {
    setOpen(true);
    if (notifications.length === 0) {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    }
  }, [notifications.length, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
        aria-label="View notifications"
      >
        <Bell size={18} className="text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        )}
      </button>

      <NotificationsSheet
        open={open}
        onClose={() => {
          setOpen(false);
          fetchNotifications();
        }}
        notifications={loading ? [] : notifications}
        onMarkedRead={() => fetchNotifications()}
      />
    </>
  );
}
