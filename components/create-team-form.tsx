"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { NotificationsButton } from "@/components/notifications-button";
import { ColorSwatchPicker } from "@/components/color-swatch-picker";
import { AreaGroupSelect } from "@/components/area-group-select";
import { createTeamAction } from "@/app/actions/teams";
import type { AreaGroup } from "@/lib/types";

const FORMAT_OPTIONS = ["5v5", "6v6", "7v7", "8v8", "11v11"];

interface CreateTeamFormProps {
  areaGroups: AreaGroup[];
  emojis: string[];
  colors: string[];
}

export function CreateTeamForm({ areaGroups, emojis, colors }: CreateTeamFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [formats, setFormats] = useState<string[]>([]);
  const [area, setArea] = useState("");
  const [emoji, setEmoji] = useState(emojis[0] ?? "⚽");
  const [color, setColor] = useState(colors[0] ?? "#2E7D32");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = name.trim().length > 0 && formats.length > 0 && area !== "" && !loading;

  function toggleFormat(fmt: string) {
    setFormats((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]
    );
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    const result = await createTeamAction({
      name,
      formats,
      area,
      emoji,
      color,
      description,
    });

    setLoading(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.push(`/teams/${result.teamId}`);
  }

  return (
    <>
      <header className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/teams"
            className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors pressable"
          >
            <ArrowLeft size={18} className="text-muted-foreground" />
          </Link>
          <h1 className="text-foreground font-semibold text-lg">Create Team</h1>
        </div>
        <NotificationsButton />
      </header>

      <main className="px-5 pb-24 flex flex-col gap-6">
        {/* Live preview badge */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-card">
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: color + "33" }}
          >
            {emoji}
          </div>
          <div className="min-w-0">
            <p className="text-foreground font-semibold text-sm truncate">
              {name.trim() || "Your Team Name"}
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {area || "Area"} · {formats.length > 0 ? formats.join(", ") : "Formats"}
            </p>
          </div>
        </div>

        {/* Team name */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Team Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Pangrati Wolves"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        {/* Formats */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Formats <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {FORMAT_OPTIONS.map((fmt) => {
              const active = formats.includes(fmt);
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => toggleFormat(fmt)}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    active
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {fmt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Area */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Area <span className="text-destructive">*</span>
          </label>
          <AreaGroupSelect
            areaGroups={areaGroups}
            value={area}
            onChange={setArea}
            required
          />
        </div>

        {/* Emoji */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Team Emoji
          </label>
          <div className="grid grid-cols-6 gap-2">
            {emojis.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`h-12 rounded-xl text-2xl flex items-center justify-center transition-all border ${
                  emoji === e
                    ? "bg-accent/15 border-accent"
                    : "bg-card border-border hover:bg-muted"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Team Color
          </label>
          <ColorSwatchPicker colors={colors} value={color} onChange={setColor} />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Description{" "}
            <span className="font-normal normal-case text-muted-foreground">
              (optional)
            </span>
          </label>
          <textarea
            placeholder="Tell players about your team..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            rows={3}
            className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors resize-none"
          />
          <p className="text-muted-foreground text-xs mt-1 text-right">
            {description.length}/200
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center bg-destructive/10 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 pressable"
        >
          {loading ? (
            <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
          ) : (
            <>
              <Users size={16} />
              Create Team
            </>
          )}
        </button>
      </main>
    </>
  );
}
