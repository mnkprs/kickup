"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Swords, Search, Check } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Team } from "@/lib/types";
import { sendChallengeAction } from "@/app/actions/matches";

const FORMAT_OPTIONS = ["5v5", "6v6", "7v7", "8v8", "11v11"];
const STEPS = ["Opponent", "Format", "Message", "Confirm"];

interface SendChallengeFormProps {
  userTeam: Team;
  opponents: Team[];
}

export function SendChallengeForm({ userTeam, opponents }: SendChallengeFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [opponent, setOpponent] = useState<Team | null>(null);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredOpponents = opponents.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.area.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSend() {
    if (!opponent || !selectedFormat) return;
    setLoading(true);
    setError("");
    const result = await sendChallengeAction({
      homeTeamId: userTeam.id,
      awayTeamId: opponent.id,
      format: selectedFormat,
      message,
    });
    setLoading(false);
    if ("error" in result && result.error) { setError(result.error); return; }
    router.push(`/matches/${result.matchId}`);
  }

  return (
    <>
      <header className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {step === 0 ? (
            <Link
              href="/matches"
              className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
            >
              <ArrowLeft size={18} className="text-muted-foreground" />
            </Link>
          ) : (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
            >
              <ArrowLeft size={18} className="text-muted-foreground" />
            </button>
          )}
          <div>
            <h1 className="text-foreground font-semibold text-lg leading-tight">Challenge</h1>
            <p className="text-muted-foreground text-xs">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Progress dots */}
      <div className="px-5 flex gap-1.5 mb-6">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full flex-1 transition-colors ${i <= step ? "bg-accent" : "bg-muted"}`}
          />
        ))}
      </div>

      <main className="px-5 pb-24 flex flex-col gap-5">

        {/* Step 0: Pick opponent */}
        {step === 0 && (
          <>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search teams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl bg-card border border-border pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              {filteredOpponents.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">No teams found</p>
              )}
              {filteredOpponents.map((team) => (
                <button
                  key={team.id}
                  onClick={() => {
                    setOpponent(team);
                    setStep(1);
                  }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-accent/40 hover:bg-muted/30 transition-all text-left"
                >
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: team.color + "33" }}
                  >
                    {team.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-semibold text-sm truncate">{team.name}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {team.area} · {team.wins}W {team.draws}D {team.losses}L
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {team.format}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 1: Pick format */}
        {step === 1 && (
          <>
            {opponent && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: opponent.color + "33" }}
                >
                  {opponent.emoji}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Challenging</p>
                  <p className="text-foreground font-semibold text-sm">{opponent.name}</p>
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                Choose Format
              </label>
              <div className="flex flex-col gap-2">
                {FORMAT_OPTIONS.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      selectedFormat === fmt
                        ? "bg-accent/10 border-accent text-foreground"
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                    }`}
                  >
                    <span className="font-semibold text-sm">{fmt}</span>
                    {selectedFormat === fmt && <Check size={16} className="text-accent" />}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedFormat}
              className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </>
        )}

        {/* Step 2: Message */}
        {step === 2 && (
          <>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                Message to Opponent{" "}
                <span className="font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hey ${opponent?.name ?? "team"}, up for a ${selectedFormat} game?`}
                maxLength={200}
                rows={4}
                className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors resize-none"
              />
              <p className="text-muted-foreground text-xs mt-1 text-right">{message.length}/200</p>
            </div>
            <button
              onClick={() => setStep(3)}
              className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <>
            <div className="rounded-xl bg-card border border-border divide-y divide-border">
              <div className="flex items-center gap-4 px-4 py-4">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: userTeam.color + "33" }}
                >
                  {userTeam.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-muted-foreground text-xs">Your team</p>
                  <p className="text-foreground font-semibold text-sm">{userTeam.name}</p>
                </div>
              </div>
              <div className="flex items-center justify-center py-2">
                <Swords size={16} className="text-muted-foreground" />
              </div>
              <div className="flex items-center gap-4 px-4 py-4">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: opponent!.color + "33" }}
                >
                  {opponent!.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-muted-foreground text-xs">Opponent</p>
                  <p className="text-foreground font-semibold text-sm">{opponent!.name}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-card border border-border px-4 py-3 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Format</span>
              <span className="text-foreground font-semibold text-sm">{selectedFormat}</span>
            </div>

            {message && (
              <div className="rounded-xl bg-card border border-border px-4 py-3">
                <p className="text-muted-foreground text-xs mb-1">Your message</p>
                <p className="text-foreground text-sm">{message}</p>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 text-center">{error}</p>
            )}

            <button
              onClick={handleSend}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
              ) : (
                <>
                  <Swords size={16} />
                  Send Challenge
                </>
              )}
            </button>
          </>
        )}
      </main>
    </>
  );
}
