"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { updateThemeAction } from "@/app/actions/profile";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleClick = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    updateThemeAction(next);
  };

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border"
      >
        <div className="h-4 w-4" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={handleClick}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
    >
      {isDark ? (
        <Sun size={18} className="text-muted-foreground" />
      ) : (
        <Moon size={18} className="text-muted-foreground" />
      )}
    </button>
  );
}
