"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useNotifications } from "@/components/notifications/notifications-provider";

const NotificationsSheet = dynamic(
  () => import("@/components/notifications/notifications-sheet").then((m) => m.NotificationsSheet),
  { ssr: false },
);

export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const notifications = useNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors pressable"
        aria-label="View notifications"
      >
        <Bell size={18} className="text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        )}
      </button>

      {open && (
        <NotificationsSheet
          open={open}
          onClose={() => setOpen(false)}
          notifications={notifications}
          onMarkedRead={() => router.refresh()}
        />
      )}
    </>
  );
}
