"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Users,
  Trophy,
  User,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import { format, parseISO } from "date-fns";

function getFormatLabel(fmt: string) {
  switch (fmt) {
    case "knockout": return "Knockout";
    case "round_robin": return "Round Robin";
    case "group_stage": return "Groups + KO";
    default: return fmt;
  }
}

interface TournamentDetailsAccordionProps {
  details: {
    organizerId: string;
    organizer: string;
    bracketFormat: string;
    matchFormat?: string;
    startDate: string | null;
    endDate: string | null;
    area: string;
    venue: string;
    teamsCount: number;
    maxTeams: number;
    prize: string;
    description: string;
  };
}

function DetailRow({
  icon: Icon,
  label,
  value,
  valueAsLink,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  valueAsLink?: boolean;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
        <Icon size={14} className="text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
          {label}
        </p>
        {href && valueAsLink ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 hover:underline underline-offset-2 transition-colors"
          >
            {value}
            <ChevronRight size={14} className="opacity-60" />
          </Link>
        ) : (
          <p className="text-sm text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}

export function TournamentDetailsAccordion({ details }: TournamentDetailsAccordionProps) {
  const {
    organizerId,
    organizer,
    bracketFormat,
    matchFormat,
    startDate,
    endDate,
    area,
    venue,
    teamsCount,
    maxTeams,
    prize,
    description,
  } = details;

  const formatDisplay = [getFormatLabel(bracketFormat), matchFormat].filter(Boolean).join(" · ");
  const [open, setOpen] = useState(true);

  const previewParts: string[] = [];
  if (formatDisplay) previewParts.push(formatDisplay);
  if (organizer) previewParts.push(organizer);
  previewParts.push(`${teamsCount}/${maxTeams} teams`);
  if (area) previewParts.push(area);
  const preview = previewParts.join(" · ");

  return (
    <section className="px-5">
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between gap-3 py-4 px-4 hover:bg-muted/20 active:bg-muted/30 transition-colors text-left pressable"
        >
          <div className="min-w-0 flex-1">
            <span className="text-foreground font-semibold text-sm block">
              Tournament details
            </span>
            {!open && preview && (
              <span className="text-muted-foreground text-xs mt-1 block truncate">
                {preview}
              </span>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-1">
            <span className="text-muted-foreground text-xs hidden sm:inline">
              {open ? "Less" : "More"}
            </span>
            {open ? (
              <ChevronUp size={18} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={18} className="text-muted-foreground" />
            )}
          </div>
        </button>

        {open && (
          <div className="border-t border-border px-4 pb-4">
            <div className="divide-y divide-border/80">
              {formatDisplay && (
                <DetailRow
                  icon={LayoutGrid}
                  label="Format"
                  value={formatDisplay}
                />
              )}
              {organizer && (
                <DetailRow
                  icon={User}
                  label="Organiser"
                  value={organizer}
                  valueAsLink
                  href={`/profile/${organizerId}`}
                />
              )}
              {startDate && (
                <DetailRow
                  icon={Calendar}
                  label="Dates"
                  value={
                    <>
                      {format(parseISO(startDate), "d MMM yyyy")}
                      {endDate && endDate !== startDate && (
                        <> – {format(parseISO(endDate), "d MMM yyyy")}</>
                      )}
                    </>
                  }
                />
              )}
              {(area || venue) && (
                <DetailRow
                  icon={MapPin}
                  label="Location"
                  value={
                    <>
                      {area && <span>{area}</span>}
                      {area && venue && <span className="text-muted-foreground"> · </span>}
                      {venue && <span>{venue}</span>}
                    </>
                  }
                />
              )}
              <DetailRow
                icon={Users}
                label="Teams"
                value={`${teamsCount} of ${maxTeams} registered`}
              />
              {prize && (
                <DetailRow
                  icon={Trophy}
                  label="Prize"
                  value={<span className="text-draw font-medium">{prize}</span>}
                />
              )}
            </div>
            {description && (
              <div className="pt-4 mt-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  About
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
