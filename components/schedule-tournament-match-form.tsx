"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { setTournamentMatchScheduleAction } from "@/app/actions/tournaments";

interface ScheduleTournamentMatchFormProps {
  matchId: string;
  tournamentId: string;
  currentDate: string | null;
  currentTime: string | null;
  onClose: () => void;
}

export function ScheduleTournamentMatchForm({
  matchId,
  tournamentId,
  currentDate,
  currentTime,
  onClose,
}: ScheduleTournamentMatchFormProps) {
  const router = useRouter();
  const [date, setDate] = useState(currentDate || "");
  const [time, setTime] = useState(
    currentTime ? currentTime.slice(0, 5) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date.trim()) {
      setError("Date is required");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await setTournamentMatchScheduleAction({
      matchId,
      tournamentId,
      date,
      time: time.trim() || "",
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Date
        </label>
        <div className="relative">
          <Calendar
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Time (optional)
        </label>
        <div className="relative">
          <Clock
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>
      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-10 rounded-lg border border-border bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Save"
          )}
        </button>
      </div>
    </form>
  );
}
