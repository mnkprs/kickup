"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import Link from "next/link";
import { NotificationsButton } from "@/components/notifications/notifications-button";
import { AreaGroupSelect } from "@/components/ui/area-group-select";
import type { AreaGroup } from "@/lib/types";
import { createTournamentAction } from "@/app/actions/tournaments";

const FORMAT_OPTIONS = ["5v5", "6v6", "7v7", "8v8", "11v11"];
const MAX_TEAMS_OPTIONS = [4, 8, 16, 32];
const BRACKET_FORMAT_OPTIONS = [
  { value: "group_stage", label: "Groups + Knockout" },
  { value: "round_robin", label: "Round Robin only" },
  { value: "knockout", label: "Knockout only" },
] as const;
const TEAMS_PER_GROUP_OPTIONS = [2, 3, 4];
const KNOCKOUT_MODE_OPTIONS = [
  { value: "auto", label: "Auto (system creates matches)" },
  { value: "custom", label: "Custom (you create & assign matches)" },
] as const;

interface CreateTournamentFormProps {
  areaGroups: AreaGroup[];
}

export function CreateTournamentForm({ areaGroups }: CreateTournamentFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [matchFormat, setMatchFormat] = useState("7v7");
  const [maxTeams, setMaxTeams] = useState(8);
  const [bracketFormat, setBracketFormat] = useState<"group_stage" | "round_robin" | "knockout">("group_stage");
  const [teamsPerGroup, setTeamsPerGroup] = useState(4);
  const [knockoutMode, setKnockoutMode] = useState<"auto" | "custom">("auto");
  const [venue, setVenue] = useState("");
  const [area, setArea] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [prize, setPrize] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = name.trim().length > 0 && matchFormat && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    const result = await createTournamentAction({
      name,
      description,
      match_format: matchFormat,
      max_teams: maxTeams,
      bracket_format: bracketFormat,
      teams_per_group: bracketFormat === "group_stage" ? teamsPerGroup : undefined,
      knockout_mode: bracketFormat === "group_stage" ? knockoutMode : undefined,
      venue,
      area,
      start_date: startDate,
      end_date: endDate,
      prize,
    });

    setLoading(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.push(`/tournaments/${result.tournamentId}`);
  }

  return (
    <>
      <header className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-foreground font-semibold text-lg">Create League</h1>
        </div>
        <NotificationsButton />
      </header>

      <main className="px-5 pb-24 flex flex-col gap-6">
        {/* Name */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            League Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Athens Winter Cup 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        {/* Match Format */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Match Format <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {FORMAT_OPTIONS.map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setMatchFormat(fmt)}
                className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  matchFormat === fmt
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Max Teams */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Max Teams
          </label>
          <div className="flex gap-2">
            {MAX_TEAMS_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMaxTeams(n)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  maxTeams === n
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Bracket Format */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Bracket Format
          </label>
          <div className="flex flex-wrap gap-2">
            {BRACKET_FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBracketFormat(opt.value)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  bracketFormat === opt.value
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Groups + Knockout is the most common format.
          </p>
        </div>

        {/* Teams per group (only when group_stage) */}
        {bracketFormat === "group_stage" && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Teams per Group
            </label>
            <div className="flex gap-2">
              {TEAMS_PER_GROUP_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setTeamsPerGroup(n)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                    teamsPerGroup === n
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Knockout mode (only when group_stage) */}
        {bracketFormat === "group_stage" && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Knockout Mode
            </label>
            <div className="flex flex-col gap-2">
              {KNOCKOUT_MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKnockoutMode(opt.value)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left ${
                    knockoutMode === opt.value
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Venue */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Venue
          </label>
          <input
            type="text"
            placeholder="e.g. Karaiskakis Stadium"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            maxLength={100}
            className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        {/* Area */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Area
          </label>
          <AreaGroupSelect
            areaGroups={areaGroups}
            value={area}
            onChange={setArea}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>

        {/* Prize */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Prize{" "}
            <span className="font-normal normal-case text-muted-foreground">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Trophy + €500"
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
            maxLength={100}
            className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Description{" "}
            <span className="font-normal normal-case text-muted-foreground">(optional)</span>
          </label>
          <textarea
            placeholder="Tell teams about this league..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={400}
            rows={3}
            className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors resize-none"
          />
          <p className="text-muted-foreground text-xs mt-1 text-right">{description.length}/400</p>
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
              <Trophy size={16} />
              Create League
            </>
          )}
        </button>
      </main>
    </>
  );
}
