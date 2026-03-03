"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { AreaGroup } from "@/lib/types";

interface AreaGroupSelectProps {
  areaGroups: AreaGroup[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  /** When set, adds a clearable option at the top (e.g. "All areas") that sets value to "" */
  emptyOptionLabel?: string;
  className?: string;
}

export function AreaGroupSelect({
  areaGroups,
  value,
  onChange,
  placeholder = "Select area...",
  required = false,
  emptyOptionLabel,
  className,
}: AreaGroupSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const flatAreas = areaGroups.flatMap(({ city, areas }) =>
    areas.map((a) => ({ city, name: a }))
  );

  const filtered = search.trim()
    ? flatAreas.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.city.toLowerCase().includes(search.toLowerCase())
      )
    : flatAreas;

  const selectedLabel = value
    ? flatAreas.find((a) => a.name === value)?.name ?? value
    : "";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (name: string) => {
    onChange(name);
    setSearch("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearch("");
    }
  };

  return (
    <div ref={containerRef} className={`relative ${isOpen ? "z-[100]" : ""} ${className ?? ""}`}>
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="area-listbox"
        id="area-combobox"
        className="flex items-center gap-2 w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground focus-within:border-accent/50 transition-colors"
      >
        <input
          type="text"
          value={isOpen ? search : selectedLabel}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          aria-autocomplete="list"
          aria-required={required}
          className="flex-1 min-w-0 bg-transparent focus:outline-none placeholder:text-muted-foreground"
        />
        <ChevronDown
          size={16}
          className={`text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div
          id="area-listbox"
          role="listbox"
          className="absolute z-[100] mt-1 w-full max-h-60 overflow-auto rounded-xl bg-card border border-border shadow-lg py-1"
        >
          {emptyOptionLabel && (
            <div
              role="option"
              aria-selected={!value}
              onClick={() => handleSelect("")}
              className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-muted transition-colors ${
                !value ? "bg-accent/10 text-accent" : ""
              }`}
            >
              {emptyOptionLabel}
            </div>
          )}
          {filtered.length === 0 && !emptyOptionLabel ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No areas found
            </div>
          ) : filtered.length > 0 ? (
            areaGroups.map(({ city, areas }) => {
              const cityAreas = areas.filter((a) =>
                filtered.some((f) => f.city === city && f.name === a)
              );
              if (cityAreas.length === 0) return null;
              return (
                <div key={city} role="group" aria-label={city}>
                  <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-card">
                    {city}
                  </div>
                  {cityAreas.map((a) => (
                    <div
                      key={a}
                      role="option"
                      aria-selected={value === a}
                      onClick={() => handleSelect(a)}
                      className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-muted transition-colors ${
                        value === a ? "bg-accent/10 text-accent" : ""
                      }`}
                    >
                      {a}
                    </div>
                  ))}
                </div>
              );
            })
          ) : null}
        </div>
      )}
    </div>
  );
}
