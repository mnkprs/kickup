"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Plus, X, Swords, Trophy, Users, UserSearch } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const HIDDEN_ON = ["/auth"];

export function CreateMatchFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isFieldOwner, setIsFieldOwner] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("is_field_owner")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setIsFieldOwner(data?.is_field_owner ?? false));
    });
  }, []);

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const actions = [
    { label: "Challenge a team", icon: Swords },
    ...(isFieldOwner ? [{ label: "Create league", icon: Trophy }] : []),
    { label: "Create a team", icon: Users },
    { label: "Find players", icon: UserSearch },
  ];

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setOpen(false)} />
      )}

      {/* Single column container anchored above the nav */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3">
        {open && actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <div
              key={action.label}
              className="flex items-center gap-2"
              style={{ animation: `fabItemIn 0.15s ease both`, animationDelay: `${i * 40}ms` }}
            >
              <span className="bg-card border border-border text-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap">
                {action.label}
              </span>
              <button className="h-11 w-11 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-muted transition-colors shrink-0">
                <Icon size={18} className="text-foreground" />
              </button>
            </div>
          );
        })}

        {/* FAB toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Quick actions"
          className="h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/25 flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
        >
          {open ? <X size={22} strokeWidth={2.5} /> : <Plus size={24} strokeWidth={2.5} />}
        </button>
      </div>

      <style>{`
        @keyframes fabItemIn {
          from { opacity: 0; transform: translateY(6px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
