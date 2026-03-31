"use client";

import { useEffect, useState } from "react";
import { DollarSign, Activity, Zap, ShieldAlert, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Range = "7d" | "30d" | "90d";

interface Analytics {
  range: string; days: number;
  totalCost: number; totalRequests: number; totalTokens: number;
  flaggedCount: number; avgLatency: number;
  costChange: number | null; requestChange: number | null;
  daily: Array<{ date: string; spend: number; requests: number }>;
  byModel: Array<{ model: string; cost: number; requests: number; tokens: number }>;
  byProvider: Array<{ provider: string; cost: number; requests: number }>;
  byKey: Array<{ id: string; name: string; provider: string; cost: number; requests: number; lastUsed: string | null }>;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#7c3aed", anthropic: "#ea580c", gemini: "#2563eb", custom: "#888888",
};
const CHART_COLORS = ["#00ff88", "#00aaff", "#ffaa00", "#ff4444", "#aa44ff", "#00ddcc"];

function StatCard({ icon: Icon, label, value, sub, change, color = "#00ff88" }: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  change?: number | null; color?: string;
}) {
  return (
    <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ background: `${color}14` }}>
          <Icon size={15} style={{ color }} />
        </div>
        {change !== null && change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-mono ${change > 0 ? "text-[#ff4444]" : change < 0 ? "text-[#00ff88]" : "text-[#555555]"}`}>
            {change > 0 ? <TrendingUp size={11} /> : change < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
            {change !== 0 ? `${Math.abs(change)}%` : "—"}
          </div>
        )}
      </div>
      <div className="font-mono text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-[#555555]">{label}</div>
      {sub && <div className="text-xs text-[#333333] mt-0.5">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, prefix = "" }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <p className="text-[#888888] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? "#00ff88" }}>{p.name}: {prefix}{typeof p.value === "number" ? p.value.toFixed(p.name?.includes("spend") || p.name?.includes("cost") ? 5 : 0) : p.value}</p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [range, setRange] = useState<Range>("7d");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"spend" | "requests">("spend");

  async function load(r: Range) {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${r}`);
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(range); }, [range]);

  const rangeLabel = range === "7d" ? "vs prev 7 days" : range === "30d" ? "vs prev 30 days" : "vs prev 90 days";

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="animate-spin text-[#00ff88]" size={22} />
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center h-64 text-[#444444] text-sm">Failed to load analytics</div>
  );

  const hasData = data.totalRequests > 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">Analytics</h2>
          <p className="text-sm text-[#555555] mt-0.5">Usage trends, cost breakdown, and model attribution</p>
        </div>
        <div className="flex items-center gap-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-1">
          {(["7d", "30d", "90d"] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs rounded-md font-mono transition-all ${range === r ? "bg-[#1a1a1a] text-white" : "text-[#555555] hover:text-[#888888]"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label={`Total spend (${range})`} value={`$${data.totalCost.toFixed(4)}`}
          sub={rangeLabel} change={data.costChange} color="#00ff88" />
        <StatCard icon={Activity} label={`Requests (${range})`} value={data.totalRequests.toLocaleString()}
          sub={rangeLabel} change={data.requestChange} color="#00aaff" />
        <StatCard icon={Zap} label="Total tokens" value={data.totalTokens >= 1e6
          ? `${(data.totalTokens / 1e6).toFixed(2)}M` : data.totalTokens.toLocaleString()}
          color="#ffaa00" />
        <StatCard icon={ShieldAlert} label="Flagged requests" value={String(data.flaggedCount)}
          sub={`${data.totalRequests ? ((data.flaggedCount / data.totalRequests) * 100).toFixed(1) : 0}% of total`}
          color="#ff4444" />
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-center">
          <Activity size={36} className="text-[#222222]" />
          <p className="text-[#666666] font-medium">No data for this period</p>
          <p className="text-[#333333] text-sm">Requests will appear here once you start using your proxy key</p>
        </div>
      ) : (
        <>
          {/* Main chart */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#111111]">
              <div className="flex items-center gap-1 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-0.5">
                <button onClick={() => setTab("spend")}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${tab === "spend" ? "bg-[#1a1a1a] text-white" : "text-[#555555]"}`}>
                  Spend
                </button>
                <button onClick={() => setTab("requests")}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${tab === "requests" ? "bg-[#1a1a1a] text-white" : "text-[#555555]"}`}>
                  Requests
                </button>
              </div>
              <span className="text-xs text-[#333333] font-mono">
                {range === "7d" ? "Daily" : range === "30d" ? "Daily" : "Daily"} · last {data.days} days
              </span>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.daily} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff88" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00aaff" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#00aaff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "#444444", fontSize: 11, fontFamily: "monospace" }}
                    tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#444444", fontSize: 11, fontFamily: "monospace" }}
                    axisLine={false} tickLine={false} width={48}
                    tickFormatter={v => tab === "spend" ? `$${v.toFixed(3)}` : String(v)} />
                  <Tooltip content={<CustomTooltip prefix={tab === "spend" ? "$" : ""} />} />
                  {tab === "spend"
                    ? <Area type="monotone" dataKey="spend" name="spend" stroke="#00ff88" strokeWidth={1.5} fill="url(#cg)" dot={false} />
                    : <Area type="monotone" dataKey="requests" name="requests" stroke="#00aaff" strokeWidth={1.5} fill="url(#rg)" dot={false} />
                  }
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model + Provider breakdown */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Model table */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
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
                        <span className="text-xs font-mono text-[#888888] shrink-0 ml-2">${m.cost.toFixed(5)}</span>
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
                {data.byModel.length === 0 && (
                  <div className="px-5 py-8 text-center text-[#333333] text-xs">No model data</div>
                )}
              </div>
            </div>

            {/* Provider pie */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#111111]">
                <h3 className="text-sm font-semibold text-white">Requests by provider</h3>
              </div>
              <div className="p-5 flex items-center gap-6">
                {data.byProvider.length > 0 ? (
                  <>
                    <ResponsiveContainer width={120} height={120}>
                      <PieChart>
                        <Pie data={data.byProvider} dataKey="requests" cx="50%" cy="50%"
                          innerRadius={32} outerRadius={55} strokeWidth={0}>
                          {data.byProvider.map((entry, i) => (
                            <Cell key={entry.provider} fill={PROVIDER_COLORS[entry.provider] ?? CHART_COLORS[i]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 flex-1">
                      {data.byProvider.map((p, i) => (
                        <div key={p.provider} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: PROVIDER_COLORS[p.provider] ?? CHART_COLORS[i] }} />
                            <span className="text-xs text-[#aaaaaa] capitalize">{p.provider}</span>
                          </div>
                          <span className="text-xs font-mono text-[#555555]">{p.requests.toLocaleString()} req</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center text-[#333333] text-xs py-8">No provider data</div>
                )}
              </div>
            </div>
          </div>

          {/* Per-key stats */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#111111]">
              <h3 className="text-sm font-semibold text-white">Cost per API key</h3>
            </div>
            {data.byKey.length === 0 ? (
              <div className="px-5 py-8 text-center text-[#333333] text-xs">No key data</div>
            ) : (
              <div className="divide-y divide-[#0d0d0d]">
                {data.byKey.map(k => {
                  const pct = data.totalCost > 0 ? (k.cost / data.totalCost) * 100 : 0;
                  const color = PROVIDER_COLORS[k.provider] ?? "#888888";
                  return (
                    <div key={k.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-[#cccccc] truncate">{k.name}</span>
                          <span className="text-xs font-mono text-[#888888] shrink-0 ml-4">${k.cost.toFixed(5)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-[#111111] rounded-full h-1">
                            <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                          </div>
                          <span className="text-[10px] font-mono text-[#444444] shrink-0">{k.requests} req</span>
                          {k.lastUsed && (
                            <span className="text-[10px] font-mono text-[#333333] shrink-0">
                              last {new Date(k.lastUsed).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
