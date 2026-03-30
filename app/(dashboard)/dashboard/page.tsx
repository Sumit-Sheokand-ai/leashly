"use client";

import { useEffect, useState } from "react";
import { RequestsChart } from "@/components/charts/requests-chart";
import { CostChart } from "@/components/charts/cost-chart";
import { DollarSign, Activity, ShieldAlert, Shield, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalSpendToday: number;
  requestsToday: number;
  flaggedToday: number;
  activeRules: number;
  requestsPerHour: Array<{ hour: string; count: number }>;
  costPerModel: Array<{ model: string; cost: number }>;
}

interface LogRow {
  id: string; timestamp: string; provider: string; model: string;
  promptTokens: number; completionTokens: number; totalCost: number;
  flagged: boolean; statusCode: number;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#7c3aed", anthropic: "#ea580c", gemini: "#2563eb", custom: "#666666",
};

function ProviderBadge({ provider }: { provider: string }) {
  const color = PROVIDER_COLORS[provider] ?? "#666666";
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium"
      style={{ background: `${color}22`, color }}>
      {provider}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color = "#00ff88" }: {
  icon: React.ElementType; label: string; value: string; color?: string;
}) {
  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 card-glow">
      <div className="mb-3">
        <div className="p-2 rounded-lg w-fit" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="font-mono text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-[#666666]">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [sRes, lRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/logs?page=1"),
      ]);

      if (sRes.ok) {
        const s = await sRes.json();
        setStats(s);
      }

      if (lRes.ok) {
        const l = await lRes.json();
        setLogs(l.logs ?? []);
        setHasData((l.total ?? 0) > 0);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-[#00ff88]" size={24} />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#111111] border border-[#1f1f1f] flex items-center justify-center">
          <Activity size={24} className="text-[#333333]" />
        </div>
        <div>
          <h2 className="font-mono text-xl text-white mb-2">No requests yet</h2>
          <p className="text-[#666666] text-sm mb-6 max-w-sm">
            Add your first API key, then point your app at the Leashly proxy to start tracking usage.
          </p>
          <Link href="/dashboard/keys"
            className="bg-[#00ff88] hover:bg-[#00cc6e] text-black text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
            Add API Key →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">Overview</h2>
          <p className="text-sm text-[#666666]">Last 24 hours</p>
        </div>
        <button onClick={loadData}
          className="text-xs border border-[#1f1f1f] text-[#666666] hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total spend today" value={`$${(stats?.totalSpendToday ?? 0).toFixed(4)}`} color="#00ff88" />
        <StatCard icon={Activity} label="Requests today" value={String(stats?.requestsToday ?? 0)} color="#00aaff" />
        <StatCard icon={ShieldAlert} label="Flagged requests" value={String(stats?.flaggedToday ?? 0)} color="#ff4444" />
        <StatCard icon={Shield} label="Active rules" value={String(stats?.activeRules ?? 0)} color="#ffaa00" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="font-mono text-sm font-semibold text-white mb-4">Requests / hour</h3>
          <RequestsChart data={stats?.requestsPerHour ?? []} />
        </div>
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="font-mono text-sm font-semibold text-white mb-4">Cost by model</h3>
          <CostChart data={stats?.costPerModel ?? []} />
        </div>
      </div>

      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f]">
          <h3 className="font-mono text-sm font-semibold text-white">Recent requests</h3>
          <Link href="/dashboard/logs"
            className="text-xs text-[#666666] hover:text-[#00ff88] flex items-center gap-1 transition-colors">
            View all <ExternalLink size={11} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f1f1f]">
                {["Time", "Provider", "Model", "Tokens", "Cost", "Status"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-[#444444] font-mono font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 10).map((log, i) => (
                <tr key={log.id} className={`border-b border-[#1f1f1f] hover:bg-[#1a1a1a] transition-colors ${i % 2 !== 0 ? "bg-[#0d0d0d]" : ""}`}>
                  <td className="px-5 py-3 font-mono text-xs text-[#666666]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="px-5 py-3"><ProviderBadge provider={log.provider} /></td>
                  <td className="px-5 py-3 font-mono text-xs text-[#f0f0f0]">{log.model}</td>
                  <td className="px-5 py-3 font-mono text-xs text-[#666666]">{(log.promptTokens + log.completionTokens).toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-xs text-[#f0f0f0]">${log.totalCost.toFixed(6)}</td>
                  <td className="px-5 py-3">
                    {log.flagged
                      ? <span className="bg-[#ff4444]/15 text-[#ff4444] text-xs px-2 py-0.5 rounded-full font-mono">flagged</span>
                      : <span className="bg-[#00ff88]/10 text-[#00ff88] text-xs px-2 py-0.5 rounded-full font-mono">ok</span>}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-[#444444] text-sm">No requests yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
