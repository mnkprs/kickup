import type { AreaGroup } from "@/lib/types";

interface AreaGroupSelectProps {
  areaGroups: AreaGroup[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function AreaGroupSelect({
  areaGroups,
  value,
  onChange,
  placeholder = "Select area...",
  required = false,
}: AreaGroupSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
    >
      <option value="" disabled={required}>
        {placeholder}
      </option>
      {areaGroups.map(({ city, areas }) => (
        <optgroup key={city} label={city}>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
