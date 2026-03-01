"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"
      >
        <div className="h-4 w-4" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="h-9 w-9 rounded-full bg-muted flex items-center justify-center transition-colors hover:bg-muted-foreground/20"
    >
      {isDark ? (
        <Sun size={16} className="text-foreground" />
      ) : (
        <Moon size={16} className="text-foreground" />
      )}
    </button>
  );
}
