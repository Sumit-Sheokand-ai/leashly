"use client";

import { useCallback } from "react";
import { RequestsChart } from "@/components/charts/requests-chart";
import { CostChart } from "@/components/charts/cost-chart";
import { DollarSign, Activity, ShieldAlert, Shield, ExternalLink, RefreshCw, TrendingUp, Zap, Database, Minimize2 } from "lucide-react";
import Link from "next/link";
import { OnboardingChecklist } from "@/components/layout/onboarding-checklist";
import { useDashboardData } from "@/lib/use-dashboard-data";

interface Stats {
  totalSpendToday: number; requestsToday: number; flaggedToday: number; activeRules: number;
  requestsPerHour: Array<{ hour: string; count: number }>;
  costPerModel: Array<{ model: string; cost: number }>;
}
interface LogRow {
  id: string; timestamp: string; provider: string; model: string;
  promptTokens: number; completionTokens: number; totalCost: number;
  flagged: boolean; statusCode: number;
}
interface SavingsData {
  totalSpent: number; totalSaved: number; routingSaved: number; cacheSaved: number; compressionSaved: number;
}
interface DashboardAll {
  stats: Stats | null; logs: LogRow[]; hasData: boolean;
  onboarding: { hasKey: boolean; hasRule: boolean; hasRequests: boolean };
  savings: SavingsData | null;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#7c3aed", anthropic: "#ea580c", gemini: "#2563eb", custom: "#666666",
};

function ProviderBadge({ provider }: { provider: string }) {
  const color = PROVIDER_COLORS[provider] ?? "#666666";
  return <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium" style={{ background: `${color}20`, color }}>{provider}</span>;
}

function StatCard({ icon: Icon, label, value, href, color = "#00ff88" }: { icon: React.ElementType; label: string; value: string; href?: string; color?: string }) {
  const inner = (
    <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5 transition-all hover:border-[#2a2a2a] group">
      <div className="mb-3">
        <div className="p-2 rounded-xl w-fit" style={{ background: `${color}14` }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div className="font-mono text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-[#555555]">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function SavingsWidget({ data }: { data: SavingsData | null }) {
  if (!data) return null;
  const actualBill = Math.max(0, data.totalSpent - data.totalSaved);
  const pct = data.totalSpent > 0 ? Math.round((data.totalSaved / data.totalSpent) * 100) : 0;
  return (
    <div className="bg-[#0e0e0e] border border-[#1a2a1a] rounded-2xl p-5 space-y-4"
      style={{ boxShadow: "0 0 40px rgba(0,255,136,0.04)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-[#555555] uppercase tracking-widest">Leashly saved you · This month</span>
        {pct > 0 && (
          <span className="rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 px-2.5 py-0.5 text-xs font-semibold text-[#00ff88]">
            -{pct}% off your bill
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-[#444444] mb-1">Would have spent</p>
          <p className="text-xl font-bold text-[#888888] font-mono">${data.totalSpent.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-[#444444] mb-1">Leashly saved</p>
          <p className="text-xl font-bold text-[#00ff88] font-mono">${data.totalSaved.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-[#444444] mb-1">Actual bill</p>
          <p className="text-xl font-bold text-white font-mono">${actualBill.toFixed(2)}</p>
        </div>
      </div>
      {data.totalSaved > 0 && (
        <div className="flex items-center gap-5 pt-1 border-t border-[#1a1a1a]">
          {data.routingSaved > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-[#4488ff]">
              <Zap size={11} /> <span className="text-[#444444]">Routing</span> ${data.routingSaved.toFixed(3)}
            </span>
          )}
          {data.cacheSaved > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-[#aa66ff]">
              <Database size={11} /> <span className="text-[#444444]">Cache</span> ${data.cacheSaved.toFixed(3)}
            </span>
          )}
          {data.compressionSaved > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-[#ffaa44]">
              <Minimize2 size={11} /> <span className="text-[#444444]">Compression</span> ${data.compressionSaved.toFixed(3)}
            </span>
          )}
          {data.totalSaved === 0 && (
            <Link href="/dashboard/routing" className="text-xs text-[#444444] hover:text-[#00ff88] transition-colors">
              Enable smart routing to start saving →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const fetcher = useCallback(async (): Promise<DashboardAll> => {
    const [sRes, lRes, kRes, rRes, savRes] = await Promise.all([
      fetch("/api/stats"),
      fetch("/api/logs?page=1"),
      fetch("/api/keys"),
      fetch("/api/rules"),
      fetch("/api/savings"),
    ]);
    const stats   = sRes.ok   ? await sRes.json()   : null;
    const logsData = lRes.ok  ? await lRes.json()   : { logs: [], total: 0 };
    const keys    = kRes.ok   ? await kRes.json()   : [];
    const rules   = rRes.ok   ? await rRes.json()   : [];
    const savings = savRes.ok ? await savRes.json() : null;
    const hasData = (logsData.total ?? 0) > 0;
    return {
      stats, logs: logsData.logs ?? [], hasData, savings,
      onboarding: {
        hasKey: Array.isArray(keys) && keys.length > 0,
        hasRule: Array.isArray(rules) && rules.length > 0,
        hasRequests: hasData,
      },
    };
  }, []);

  const { data, loading, refresh } = useDashboardData<DashboardAll>("dashboard:overview", fetcher);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-[#00ff88]" size={22} />
      </div>
    );
  }

  const stats      = data?.stats ?? null;
  const logs       = data?.logs ?? [];
  const hasData    = data?.hasData ?? false;
  const onboarding = data?.onboarding ?? { hasKey: false, hasRule: false, hasRequests: false };

  return (
    <div className="space-y-5 max-w-5xl">
      <OnboardingChecklist {...onboarding} />

      {/* Savings widget — most important UI */}
      <SavingsWidget data={data?.savings ?? null} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">Overview</h2>
          <p className="text-sm text-[#555555] mt-0.5">Last 24 hours</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/analytics"
            className="flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#888888] border border-[#1a1a1a] hover:border-[#222222] px-3 py-1.5 rounded-xl transition-all">
            <TrendingUp size={12} /> Analytics
          </Link>
          <button onClick={refresh}
            className="text-xs border border-[#1a1a1a] text-[#555555] hover:text-[#888888] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Spend today"     value={`$${(stats?.totalSpendToday ?? 0).toFixed(4)}`} href="/dashboard/analytics" color="#00ff88" />
        <StatCard icon={Activity}   label="Requests today"  value={String(stats?.requestsToday ?? 0)} href="/dashboard/logs" color="#00aaff" />
        <StatCard icon={ShieldAlert} label="Flagged today"  value={String(stats?.flaggedToday ?? 0)} href="/dashboard/logs?flagged=true" color="#ff4444" />
        <StatCard icon={Shield}     label="Active rules"    value={String(stats?.activeRules ?? 0)} href="/dashboard/rules" color="#ffaa00" />
      </div>

      {/* Charts */}
      {hasData && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5">
            <h3 className="font-mono text-xs font-semibold text-[#888888] uppercase tracking-wider mb-4">Requests / hour</h3>
            <RequestsChart data={stats?.requestsPerHour ?? []} />
          </div>
          <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5">
            <h3 className="font-mono text-xs font-semibold text-[#888888] uppercase tracking-wider mb-4">Cost by model</h3>
            <CostChart data={stats?.costPerModel ?? []} />
          </div>
        </div>
      )}

      {/* Recent requests */}
      <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#111111]">
          <h3 className="font-mono text-xs font-semibold text-[#888888] uppercase tracking-wider">Recent requests</h3>
          <Link href="/dashboard/logs" className="text-xs text-[#444444] hover:text-[#00ff88] flex items-center gap-1 transition-colors">
            View all <ExternalLink size={11} />
          </Link>
        </div>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
            <Activity size={28} className="text-[#222222]" />
            <div>
              <p className="text-[#666666] text-sm font-medium">No requests yet</p>
              <p className="text-[#333333] text-xs mt-1 max-w-xs">Add an API key and point your app at the Leashly proxy to start seeing usage here</p>
            </div>
            <Link href="/dashboard/keys" className="mt-2 bg-[#00ff88] hover:bg-[#00dd77] text-black text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
              Add API Key →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#111111]">
                  {["Time", "Provider", "Model", "Tokens", "Cost", "Saved", "Status"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] text-[#333333] font-mono font-normal tracking-wider uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0d0d0d]">
                {logs.slice(0, 8).map((log: LogRow & { totalSavings?: number; wasCacheHit?: boolean }) => (
                  <tr key={log.id} className="hover:bg-[#0d0d0d] transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-[#555555] whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="px-5 py-3"><ProviderBadge provider={log.provider} /></td>
                    <td className="px-5 py-3 font-mono text-xs text-[#cccccc] max-w-[140px] truncate">{log.model}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#555555]">{(log.promptTokens + log.completionTokens).toLocaleString()}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#cccccc]">${log.totalCost.toFixed(6)}</td>
                    <td className="px-5 py-3 font-mono text-xs">
                      {(log as { totalSavings?: number }).totalSavings ? (
                        <span className="text-[#00ff88]">-${((log as { totalSavings?: number }).totalSavings ?? 0).toFixed(6)}</span>
                      ) : (log as { wasCacheHit?: boolean }).wasCacheHit ? (
                        <span className="text-[#aa66ff] text-[10px]">cache</span>
                      ) : <span className="text-[#333333]">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {log.flagged
                        ? <span className="bg-[#ff4444]/12 text-[#ff5555] text-xs px-2 py-0.5 rounded-full font-mono">flagged</span>
                        : <span className="bg-[#00ff88]/8 text-[#00dd77] text-xs px-2 py-0.5 rounded-full font-mono">ok</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
