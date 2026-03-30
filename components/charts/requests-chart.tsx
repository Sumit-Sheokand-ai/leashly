"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

interface Props {
  data: Array<{ hour: string; count: number }>;
}

export function RequestsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
        <XAxis
          dataKey="hour"
          tick={{ fill: "#666666", fontSize: 11, fontFamily: "IBM Plex Mono" }}
          tickLine={false}
          axisLine={{ stroke: "#1f1f1f" }}
          interval={3}
        />
        <YAxis
          tick={{ fill: "#666666", fontSize: 11, fontFamily: "IBM Plex Mono" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "#111111", border: "1px solid #1f1f1f",
            borderRadius: "8px", color: "#f0f0f0",
            fontSize: "12px", fontFamily: "IBM Plex Mono",
          }}
          cursor={{ stroke: "#00ff88", strokeWidth: 1, strokeDasharray: "4 4" }}
        />
        <Line
          type="monotone" dataKey="count" stroke="#00ff88" strokeWidth={2}
          dot={false} activeDot={{ r: 4, fill: "#00ff88", stroke: "#0a0a0a", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
