"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronDown, UserPlus } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { searchProfilesAction } from "@/app/actions/profile";

export interface PlayerSearchResult {
  id: string;
  full_name: string;
  avatar_initials: string;
  avatar_color: string;
  avatar_url: string | null;
}

interface PlayerSearchSelectProps {
  onSelect: (player: PlayerSearchResult) => void;
  excludeIds?: Set<string>;
  placeholder?: string;
  disabled?: boolean;
}

export function PlayerSearchSelect({
  onSelect,
  excludeIds = new Set(),
  placeholder = "Search player by name...",
  disabled = false,
}: PlayerSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchPlayers = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const data = await searchProfilesAction(q.trim(), 15);
    setResults(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchPlayers(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchPlayers]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (player: PlayerSearchResult) => {
    if (excludeIds.has(player.id)) return;
    onSelect(player);
    setSearch("");
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearch("");
    }
  };

  const filtered = results.filter((p) => !excludeIds.has(p.id));

  return (
    <div ref={containerRef} className="relative">
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`flex items-center gap-2 w-full rounded-xl bg-card border border-border px-4 py-2.5 text-sm text-foreground focus-within:border-accent/50 transition-colors ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <UserPlus size={16} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-autocomplete="list"
          disabled={disabled}
          className="flex-1 min-w-0 bg-transparent focus:outline-none placeholder:text-muted-foreground"
        />
        <ChevronDown
          size={16}
          className={`text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl bg-card border border-border shadow-lg py-1"
        >
          {search.trim().length < 2 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Type at least 2 characters to search
            </div>
          ) : loading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">No players found</div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                role="option"
                onClick={() => handleSelect(p)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors"
              >
                <Avatar
                  avatar_url={p.avatar_url}
                  avatar_initials={p.avatar_initials}
                  avatar_color={p.avatar_color}
                  full_name={p.full_name}
                  size="2xs"
                />
                <span className="truncate">{p.full_name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
