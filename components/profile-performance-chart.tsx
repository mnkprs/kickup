"use client";

const weeklyPerformance = [
  { week: "W1", goals: 2, assists: 1, matches: 2 },
  { week: "W2", goals: 3, assists: 0, matches: 2 },
  { week: "W3", goals: 1, assists: 2, matches: 1 },
  { week: "W4", goals: 4, assists: 1, matches: 3 },
  { week: "W5", goals: 2, assists: 3, matches: 2 },
  { week: "W6", goals: 3, assists: 1, matches: 2 },
  { week: "W7", goals: 1, assists: 2, matches: 1 },
  { week: "W8", goals: 5, assists: 1, matches: 3 },
];

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      {payload.map((item) => (
        <p
          key={item.name}
          className="text-xs font-medium"
          style={{ color: item.color }}
        >
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

export function ProfilePerformanceChart() {
  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-sm">Performance</h2>
        <span className="text-muted-foreground text-xs">Last 8 weeks</span>
      </div>
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-accent" />
            <span className="text-muted-foreground text-xs">Goals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-[#42A5F5]" />
            <span className="text-muted-foreground text-xs">Assists</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={weeklyPerformance}
            barGap={2}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--color-muted)", opacity: 0.5 }}
            />
            <Bar
              dataKey="goals"
              fill="#2E7D32"
              radius={[4, 4, 0, 0]}
              name="Goals"
            />
            <Bar
              dataKey="assists"
              fill="#42A5F5"
              radius={[4, 4, 0, 0]}
              name="Assists"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
