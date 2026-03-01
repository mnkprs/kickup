"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AUTH_ROUTES = ["/auth/login", "/auth/sign-up", "/auth/sign-up-success", "/auth/error"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

      if (!session && !isAuthRoute) {
        window.location.href = "/auth/login";
      } else if (session && isAuthRoute && pathname !== "/auth/sign-up-success" && pathname !== "/auth/error") {
        window.location.href = "/";
      } else {
        setReady(true);
      }
    });
  }, [pathname]);

  if (!ready) return null;

  return <>{children}</>;
}
