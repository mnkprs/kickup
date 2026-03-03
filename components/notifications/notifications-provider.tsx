"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Notification } from "@/lib/types";

const NotificationsContext = createContext<Notification[] | null>(null);

export function NotificationsProvider({
  notifications,
  children,
}: {
  notifications: Notification[];
  children: ReactNode;
}) {
  return (
    <NotificationsContext.Provider value={notifications}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext) ?? [];
}
