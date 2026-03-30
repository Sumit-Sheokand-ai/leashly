"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Props {
  data: Array<{ model: string; cost: number }>;
}

const COLORS = ["#00ff88", "#00aaff", "#ffaa00", "#ff4444", "#aa44ff", "#ff44aa"];

export function CostChart({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.cost - a.cost).slice(0, 6);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={sorted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
        <XAxis
          dataKey="model"
          tick={{ fill: "#666666", fontSize: 10, fontFamily: "IBM Plex Mono" }}
          tickLine={false}
          axisLine={{ stroke: "#1f1f1f" }}
          tickFormatter={(v: string) => v.length > 10 ? v.slice(0, 10) + "…" : v}
        />
        <YAxis
          tick={{ fill: "#666666", fontSize: 11, fontFamily: "IBM Plex Mono" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${v.toFixed(3)}`}
        />
        <Tooltip
          contentStyle={{
            background: "#111111", border: "1px solid #1f1f1f",
            borderRadius: "8px", color: "#f0f0f0",
            fontSize: "12px", fontFamily: "IBM Plex Mono",
          }}
          formatter={(value) => [`$${Number(value).toFixed(6)}`, "Cost"]}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
          {sorted.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
