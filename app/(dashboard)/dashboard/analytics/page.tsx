"use client";

import { useCallback, useState } from "react";
import {
  DollarSign, Activity, Zap, ShieldAlert, TrendingUp, TrendingDown,
  Minus, RefreshCw, Database, Minimize2, Clock, GitBranch,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { useDashboardData } from "@/lib/use-dashboard-data";

type Range = "7d" | "30d" | "90d";

interface Analytics {
  range: string; days: number;
  totalCost: number; totalRequests: number; totalTokens: number;
  flaggedCount: number; avgLatency: number;
  totalSaved: number; routingSaved: number; cacheSaved: number; compressionSaved: number;
  cacheHitRate: number; routingRate: number;
  costChange: number | null; requestChange: number | null; savingsChange: number | null;
  daily: Array<{ date: string; spend: number; requests: number; saved: number }>;
  byModel: Array<{ model: string; cost: number; requests: number; tokens: number }>;
  byProvider: Array<{ provider: string; cost: number; requests: number }>;
  byKey: Array<{ id: string; name: string; provider: string; cost: number; requests: number; saved: number; lastUsed: string | null }>;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#7c3aed", anthropic: "#ea580c", gemini: "#2563eb", custom: "#888888",
};
const CHART_COLORS = ["#00ff88", "#00aaff", "#ffaa00", "#ff4444", "#aa44ff", "#00ddcc"];

function Trend({ change }: { change: number | null | undefined }) {
  if (change === null || change === undefined) return null;
  return (
    <div className={`flex items-center gap-1 text-xs font-mono ${change > 0 ? "text-[#ff4444]" : change < 0 ? "text-[#00ff88]" : "text-[#555555]"}`}>
      {change > 0 ? <TrendingUp size={11} /> : change < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
      {change !== 0 ? `${Math.abs(change)}%` : "—"}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, change, color = "#00ff88" }: {
  icon: React.ElementType; label: string; value: string; sub?: string; change?: number | null; color?: string;
}) {
  return (
    <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-xl" style={{ background: `${color}14` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <Trend change={change} />
      </div>
      <div>
        <div className="font-mono text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-[#555555] mt-0.5">{label}</div>
        {sub && <div className="text-xs text-[#333333] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, prefix = "" }: {
  active?: boolean; payload?: Array<{ color?: string; name?: string; value?: number }>; label?: string; prefix?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-xl px-3 py-2 text-xs font-mono shadow-xl">
      <p className="text-[#888888] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? "#00ff88" }}>
          {p.name}: {prefix}{typeof p.value === "number" ? (p.name?.includes("spend") || p.name?.includes("saved") ? p.value.toFixed(5) : p.value.toLocaleString()) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("7d");
  const [tab, setTab]     = useState<"spend" | "requests" | "savings">("spend");

  const fetcher = useCallback(async (): Promise<Analytics> => {
    const res = await fetch(`/api/analytics?range=${range}`);
    if (!res.ok) throw new Error("Failed");
    return res.json();
  }, [range]);

  const { data, loading, refresh } = useDashboardData<Analytics>(`dashboard:analytics:${range}`, fetcher, { deps: [range] });

  if (loading && !data) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="animate-spin text-[#00ff88]" size={22} />
    </div>
  );
  if (!data) return (
    <div className="flex items-center justify-center h-64 text-[#444444] text-sm">
      Failed to load analytics
    </div>
  );

  const hasData    = data.totalRequests > 0;
  const rangeLabel = `vs prev ${range}`;

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">Analytics</h2>
          <p className="text-sm text-[#555555] mt-0.5">Usage, cost breakdown, and savings</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-1">
            {(["7d", "30d", "90d"] as Range[]).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs rounded-lg font-mono transition-all ${range === r ? "bg-[#1a1a1a] text-white" : "text-[#555555] hover:text-[#888888]"}`}>
                {r}
              </button>
            ))}
          </div>
          <button onClick={refresh}
            className="border border-[#1a1a1a] text-[#555555] hover:text-white px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats row 1 — usage */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard icon={DollarSign}  label={`Total spend`}    value={`$${data.totalCost.toFixed(4)}`}   sub={rangeLabel} change={data.costChange}    color="#00ff88" />
        <StatCard icon={Activity}    label={`Requests`}       value={data.totalRequests.toLocaleString()} sub={rangeLabel} change={data.requestChange} color="#00aaff" />
        <StatCard icon={Zap}         label="Total tokens"     value={data.totalTokens >= 1e6 ? `${(data.totalTokens / 1e6).toFixed(2)}M` : data.totalTokens.toLocaleString()} color="#ffaa00" />
        <StatCard icon={Clock}       label="Avg latency"      value={`${data.avgLatency}ms`} color="#aa66ff" />
      </div>

      {/* Stats row 2 — savings */}
      {data.totalSaved > 0 && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard icon={TrendingDown}  label="Total saved"          value={`$${data.totalSaved.toFixed(4)}`}       sub={rangeLabel} change={data.savingsChange} color="#00ff88" />
          <StatCard icon={GitBranch}     label="Routing savings"      value={`$${data.routingSaved.toFixed(4)}`}     sub={`${data.routingRate}% of requests routed`}  color="#4488ff" />
          <StatCard icon={Database}      label="Cache savings"        value={`$${data.cacheSaved.toFixed(4)}`}       sub={`${data.cacheHitRate}% cache hit rate`}      color="#aa66ff" />
          <StatCard icon={Minimize2}     label="Compression savings"  value={`$${data.compressionSaved.toFixed(4)}`} color="#ffaa44" />
        </div>
      )}

      {/* Flagged */}
      {data.flaggedCount > 0 && (
        <div className="bg-[#ff4444]/5 border border-[#ff4444]/15 rounded-2xl px-4 py-3 flex items-center gap-3">
          <ShieldAlert size={14} className="text-[#ff4444] shrink-0" />
          <span className="text-sm text-[#ff4444]">
            {data.flaggedCount} flagged request{data.flaggedCount !== 1 ? "s" : ""} detected in this period
          </span>
        </div>
      )}

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl text-center">
          <Activity size={36} className="text-[#222222]" />
          <p className="text-[#666666] font-medium">No data for this period</p>
          <p className="text-[#333333] text-sm">Start sending requests through the proxy to see analytics here</p>
        </div>
      ) : (
        <>
          {/* Main chart */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#111111]">
              <div className="flex items-center gap-1 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-0.5">
                {(["spend", "requests", "savings"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-3 py-1 text-xs rounded-lg transition-all capitalize ${tab === t ? "bg-[#1a1a1a] text-white" : "text-[#555555]"}`}>
                    {t}
                  </button>
                ))}
              </div>
              <span className="text-xs text-[#333333] font-mono">last {data.days} days</span>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.daily} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    {[["cg","#00ff88"],["rg","#00aaff"],["sg","#aa66ff"]].map(([id, c]) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={c} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={c} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "#444444", fontSize: 11, fontFamily: "monospace" }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#444444", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={52}
                    tickFormatter={v => tab === "requests" ? String(v) : `$${v.toFixed(3)}`} />
                  <Tooltip content={<CustomTooltip prefix={tab !== "requests" ? "$" : ""} />} />
                  {tab === "spend"    && <Area type="monotone" dataKey="spend"    name="spend"    stroke="#00ff88" strokeWidth={1.5} fill="url(#cg)" dot={false} />}
                  {tab === "requests" && <Area type="monotone" dataKey="requests" name="requests" stroke="#00aaff" strokeWidth={1.5} fill="url(#rg)" dot={false} />}
                  {tab === "savings"  && <Area type="monotone" dataKey="saved"    name="saved"    stroke="#aa66ff" strokeWidth={1.5} fill="url(#sg)" dot={false} />}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Cost by model */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#111111]">
                <h3 className="text-sm font-semibold text-white">Cost by model</h3>
              </div>
              <div className="divide-y divide-[#0d0d0d]">
                {data.byModel.slice(0, 6).map((m, i) => {
                  const pct = data.totalCost > 0 ? (m.cost / data.totalCost) * 100 : 0;
                  return (
                    <div key={m.model} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono text-[#cccccc] truncate max-w-[200px]">{m.model}</span>
                        <div className="flex items-center gap-3 ml-2 shrink-0">
                          <span className="text-[10px] text-[#444444] font-mono">{m.requests.toLocaleString()} req</span>
                          <span className="text-xs font-mono text-[#888888]">${m.cost.toFixed(5)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#111111] rounded-full h-1">
                          <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        </div>
                        <span className="text-[10px] font-mono text-[#444444] w-8 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Requests by provider */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#111111]">
                <h3 className="text-sm font-semibold text-white">Requests by provider</h3>
              </div>
              <div className="p-5 flex items-center gap-6">
                {data.byProvider.length > 0 ? (
                  <>
                    <ResponsiveContainer width={110} height={110}>
                      <PieChart>
                        <Pie data={data.byProvider} dataKey="requests" cx="50%" cy="50%" innerRadius={30} outerRadius={52} strokeWidth={0}>
                          {data.byProvider.map((entry, i) => (
                            <Cell key={entry.provider} fill={PROVIDER_COLORS[entry.provider] ?? CHART_COLORS[i]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2.5 flex-1">
                      {data.byProvider.map((p, i) => (
                        <div key={p.provider} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: PROVIDER_COLORS[p.provider] ?? CHART_COLORS[i] }} />
                            <span className="text-xs text-[#aaaaaa] capitalize">{p.provider}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-[#555555]">${p.cost.toFixed(4)}</span>
                            <span className="text-xs font-mono text-[#444444]">{p.requests.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center text-[#333333] text-xs py-8">No data</div>
                )}
              </div>
            </div>
          </div>

          {/* Cost per API key */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#111111]">
              <h3 className="text-sm font-semibold text-white">Cost per API key</h3>
            </div>
            {data.byKey.filter(k => k.requests > 0).length === 0 ? (
              <div className="text-center text-[#333333] text-xs py-8">No key usage in this period</div>
            ) : (
              <div className="divide-y divide-[#0d0d0d]">
                {data.byKey.filter(k => k.requests > 0).map(k => {
                  const pct   = data.totalCost > 0 ? (k.cost / data.totalCost) * 100 : 0;
                  const color = PROVIDER_COLORS[k.provider] ?? "#888888";
                  return (
                    <div key={k.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-[#cccccc] truncate">{k.name}</span>
                          <div className="flex items-center gap-3 ml-4 shrink-0">
                            {k.saved > 0 && (
                              <span className="text-xs font-mono text-[#00ff88]">saved ${k.saved.toFixed(4)}</span>
                            )}
                            <span className="text-xs font-mono text-[#888888]">${k.cost.toFixed(5)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-[#111111] rounded-full h-1">
                            <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: color }} />
                          </div>
                          <span className="text-[10px] font-mono text-[#444444] shrink-0">{k.requests} req</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hourly bar chart */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#111111]">
              <h3 className="text-sm font-semibold text-white">Spend over time</h3>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.daily} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: "#333333", fontSize: 10, fontFamily: "monospace" }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip prefix="$" />} />
                  <Bar dataKey="spend" name="spend" fill="#00ff88" opacity={0.6} radius={[2, 2, 0, 0]} />
                  {data.totalSaved > 0 && (
                    <Bar dataKey="saved" name="saved" fill="#aa66ff" opacity={0.5} radius={[2, 2, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
