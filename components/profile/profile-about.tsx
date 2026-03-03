"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { format, parseISO } from "date-fns";
import {
  MapPin,
  Calendar,
  Globe,
  Ruler,
  Footprints,
  Cake,
  ChevronDown,
} from "lucide-react";

interface ProfileAboutProps {
  profile: Profile;
}

function formatFoot(foot: string | null | undefined): string {
  if (!foot) return "";
  if (foot === "both") return "Both feet";
  return `${foot.charAt(0).toUpperCase() + foot.slice(1)} foot`;
}

function getAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  try {
    const dob = parseISO(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  } catch {
    return null;
  }
}

const ICON_CONFIG: Record<
  string,
  { bgClass: string; iconClass: string }
> = {
  area: { bgClass: "bg-accent/10", iconClass: "text-accent" },
  joined: { bgClass: "bg-accent/10", iconClass: "text-accent" },
  nationality: { bgClass: "bg-info/10", iconClass: "text-info" },
  height: { bgClass: "bg-draw/10", iconClass: "text-draw" },
  foot: { bgClass: "bg-muted", iconClass: "text-muted-foreground" },
  age: { bgClass: "bg-draw/10", iconClass: "text-draw" },
};

export function ProfileAbout({ profile }: ProfileAboutProps) {
  const [open, setOpen] = useState(true);

  const items: {
    key: string;
    icon: typeof MapPin;
    label: string;
    value: string;
  }[] = [];

  if (profile.area) {
    items.push({ key: "area", icon: MapPin, label: "Area", value: profile.area });
  }
  if (profile.joined_date) {
    items.push({
      key: "joined",
      icon: Calendar,
      label: "Joined",
      value: format(parseISO(profile.joined_date), "MMM yyyy"),
    });
  }
  if (profile.nationality) {
    items.push({
      key: "nationality",
      icon: Globe,
      label: "Nationality",
      value: profile.nationality,
    });
  }
  if (profile.height) {
    items.push({
      key: "height",
      icon: Ruler,
      label: "Height",
      value: `${profile.height} cm`,
    });
  }
  if (profile.preferred_foot) {
    items.push({
      key: "foot",
      icon: Footprints,
      label: "Preferred foot",
      value: formatFoot(profile.preferred_foot),
    });
  }
  const age = getAge(profile.date_of_birth);
  if (age !== null) {
    items.push({ key: "age", icon: Cake, label: "Age", value: `${age} years` });
  } else if (profile.date_of_birth) {
    items.push({
      key: "age",
      icon: Cake,
      label: "Date of birth",
      value: format(parseISO(profile.date_of_birth), "d MMM yyyy"),
    });
  }

  if (items.length === 0) return null;

  return (
    <section className="profile-about">
      <div className="profile-about__card rounded-xl bg-card border border-border shadow-card overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors pressable text-left"
          aria-expanded={open}
          aria-controls="profile-about-content"
          id="profile-about-trigger"
        >
          <h2 className="text-foreground font-semibold text-sm">About</h2>
          <ChevronDown
            size={18}
            className={`text-muted-foreground shrink-0 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
        <div
          id="profile-about-content"
          role="region"
          aria-labelledby="profile-about-trigger"
          className="grid transition-[grid-template-rows] duration-200 ease-out"
          style={{
            gridTemplateRows: open ? "1fr" : "0fr",
          }}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4 pt-0 border-t border-border">
              <div className="grid grid-cols-2 gap-3 pt-3">
                {items.map(({ key, icon: Icon, label, value }) => {
                  const config = ICON_CONFIG[key] ?? {
                    bgClass: "bg-muted",
                    iconClass: "text-muted-foreground",
                  };
                  return (
                    <div
                      key={`${key}-${label}`}
                      className="flex items-start gap-3 min-w-0"
                    >
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${config.bgClass}`}
                      >
                        <Icon size={16} className={config.iconClass} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-muted-foreground text-[11px] font-medium block">
                          {label}
                        </span>
                        <span className="text-foreground text-sm font-semibold truncate block">
                          {value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
