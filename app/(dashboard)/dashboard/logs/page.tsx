"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Download, ChevronLeft, ChevronRight, X, ScrollText, RefreshCw, Filter } from "lucide-react";

interface LogRow {
  id: string; timestamp: string; provider: string; model: string;
  promptTokens: number; completionTokens: number; totalCost: number;
  flagged: boolean; flagReason: string | null; durationMs: number; statusCode: number;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#7c3aed", anthropic: "#ea580c", gemini: "#2563eb", custom: "#666666",
};

function ProviderBadge({ provider }: { provider: string }) {
  const color = PROVIDER_COLORS[provider] ?? "#666666";
  return <span className="px-2 py-0.5 rounded-full text-xs font-mono" style={{ background: `${color}20`, color }}>{provider}</span>;
}

function StatusBadge({ log }: { log: LogRow }) {
  if (log.flagged) return <span className="bg-[#ff4444]/12 text-[#ff5555] text-xs px-2 py-0.5 rounded-full font-mono">flagged</span>;
  if (log.statusCode >= 400) return <span className="bg-[#ffaa00]/12 text-[#ffaa00] text-xs px-2 py-0.5 rounded-full font-mono">{log.statusCode}</span>;
  return <span className="bg-[#00ff88]/8 text-[#00dd77] text-xs px-2 py-0.5 rounded-full font-mono">{log.statusCode}</span>;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<LogRow | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const activeFilters = [provider, model, flaggedOnly, from, to].filter(Boolean).length;

  const loadLogs = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (provider) params.set("provider", provider);
      if (model) params.set("model", model);
      if (flaggedOnly) params.set("flagged", "true");
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {}
    if (!silent) setLoading(false); else setRefreshing(false);
  }, [provider, model, flaggedOnly, from, to]);

  useEffect(() => { loadLogs(page); }, [page, loadLogs]);

  // Auto-refresh every 30s
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    intervalRef.current = setInterval(() => loadLogs(page, true), 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [page, loadLogs]);

  function clearFilters() {
    setProvider(""); setModel(""); setFlaggedOnly(false); setFrom(""); setTo(""); setPage(1);
  }

  function exportCSV() {
    const headers = ["timestamp", "provider", "model", "promptTokens", "completionTokens", "totalCost", "flagged", "flagReason", "durationMs", "statusCode"];
    const rows = logs.map(l => headers.map(h => {
      const v = l[h as keyof LogRow];
      return typeof v === "string" && v.includes(",") ? `"${v}"` : String(v ?? "");
    }).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leashly-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));
  const inputCls = "bg-[#060606] border border-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88] transition-all";

  return (
    <div className="space-y-4 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">Request Logs</h2>
          <p className="text-sm text-[#555555] mt-0.5">
            {total > 0 ? `${total.toLocaleString()} total requests` : "All proxied requests appear here"}
            {refreshing && <span className="ml-2 text-[#333333] text-xs">· refreshing…</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all ${
              showFilters || activeFilters > 0
                ? "border-[#00ff88]/40 text-[#00ff88] bg-[#00ff88]/5"
                : "border-[#1a1a1a] text-[#666666] hover:text-[#888888]"
            }`}>
            <Filter size={12} />
            Filters
            {activeFilters > 0 && <span className="bg-[#00ff88] text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeFilters}</span>}
          </button>
          <button onClick={() => loadLogs(page, true)} disabled={refreshing}
            className="flex items-center gap-1.5 text-xs border border-[#1a1a1a] text-[#666666] hover:text-[#888888] px-3 py-2 rounded-lg transition-all">
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={exportCSV} disabled={logs.length === 0}
            className="flex items-center gap-1.5 border border-[#1a1a1a] text-[#666666] hover:text-[#888888] text-xs px-3 py-2 rounded-lg transition-all disabled:opacity-30">
            <Download size={12} /> CSV
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-[#555555] mb-1.5">Provider</label>
            <select value={provider} onChange={e => { setProvider(e.target.value); setPage(1); }} className={inputCls}>
              <option value="">All providers</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Gemini</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#555555] mb-1.5">Model</label>
            <input value={model} onChange={e => { setModel(e.target.value); setPage(1); }}
              placeholder="e.g. gpt-4o" className={`${inputCls} w-32`} />
          </div>
          <div>
            <label className="block text-xs text-[#555555] mb-1.5">From</label>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }}
              className={`${inputCls} [color-scheme:dark]`} />
          </div>
          <div>
            <label className="block text-xs text-[#555555] mb-1.5">To</label>
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }}
              className={`${inputCls} [color-scheme:dark]`} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer pb-1">
            <input type="checkbox" checked={flaggedOnly} onChange={e => { setFlaggedOnly(e.target.checked); setPage(1); }}
              className="accent-[#00ff88] w-3.5 h-3.5" />
            <span className="text-sm text-[#aaaaaa]">Flagged only</span>
          </label>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="text-xs text-[#ff5555] hover:text-[#ff7777] transition-colors pb-1">
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
        {loading ? (
          <div className="space-y-px">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-11 bg-[#0d0d0d] animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <ScrollText size={32} className="text-[#222222]" />
            <div>
              <p className="text-[#666666] text-sm font-medium">
                {activeFilters > 0 ? "No logs match your filters" : "No requests yet"}
              </p>
              <p className="text-[#333333] text-xs mt-1">
                {activeFilters > 0
                  ? "Try adjusting or clearing your filters"
                  : "Requests will appear here once you start using your proxy key"}
              </p>
            </div>
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="text-xs text-[#00ff88] hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#111111]">
                  {["Time", "Provider", "Model", "Tokens", "Cost", "Latency", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] text-[#333333] font-mono font-normal tracking-wider uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0d0d0d]">
                {logs.map(log => (
                  <tr key={log.id} onClick={() => setSelected(log)}
                    className={`cursor-pointer hover:bg-[#0e0e0e] transition-colors ${log.flagged ? "border-l-2 border-l-[#ff4444]/60" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-[#555555] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3"><ProviderBadge provider={log.provider} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-[#cccccc] max-w-[140px] truncate">{log.model}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#555555]">
                      {(log.promptTokens + log.completionTokens).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#cccccc]">${log.totalCost.toFixed(5)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#555555]">
                      <span className={log.durationMs > 3000 ? "text-[#ffaa00]" : ""}>{log.durationMs}ms</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge log={log} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#333333] font-mono">
            {((page - 1) * 20 + 1).toLocaleString()}–{Math.min(page * 20, total).toLocaleString()} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="text-xs border border-[#1a1a1a] text-[#555555] disabled:opacity-25 hover:border-[#333333] px-2 py-1.5 rounded-lg transition-all">
              First
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="border border-[#1a1a1a] text-[#555555] disabled:opacity-25 hover:border-[#333333] p-1.5 rounded-lg transition-all">
              <ChevronLeft size={13} />
            </button>
            <span className="text-xs text-[#444444] px-2 font-mono">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="border border-[#1a1a1a] text-[#555555] disabled:opacity-25 hover:border-[#333333] p-1.5 rounded-lg transition-all">
              <ChevronRight size={13} />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="text-xs border border-[#1a1a1a] text-[#555555] disabled:opacity-25 hover:border-[#333333] px-2 py-1.5 rounded-lg transition-all">
              Last
            </button>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
          <div className="absolute right-0 top-0 h-full w-[400px] bg-[#0a0a0a] border-l border-[#1a1a1a] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#111111] sticky top-0 bg-[#0a0a0a]">
              <div>
                <h3 className="font-mono text-sm font-bold text-white">Request Detail</h3>
                <p className="text-xs text-[#444444] mt-0.5">{new Date(selected.timestamp).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 text-[#444444] hover:text-[#888888] hover:bg-[#111111] rounded-lg transition-all">
                <X size={14} />
              </button>
            </div>

            <div className="p-5 space-y-1">
              {/* Status banner */}
              {selected.flagged && (
                <div className="bg-[#ff4444]/8 border border-[#ff4444]/20 rounded-lg px-4 py-3 mb-4">
                  <p className="text-xs text-[#ff5555] font-semibold mb-1">⚠ Injection Detected</p>
                  <p className="text-xs text-[#cc4444]">{selected.flagReason}</p>
                </div>
              )}

              {/* Details */}
              {[
                { label: "Provider", value: <ProviderBadge provider={selected.provider} /> },
                { label: "Model",    value: <span className="font-mono text-xs text-[#cccccc]">{selected.model}</span> },
                { label: "Status",   value: <StatusBadge log={selected} /> },
                { label: "Duration", value: <span className="font-mono text-xs text-[#cccccc]">{selected.durationMs}ms</span> },
                { label: "Prompt tokens",     value: <span className="font-mono text-xs text-[#aaaaaa]">{selected.promptTokens.toLocaleString()}</span> },
                { label: "Completion tokens", value: <span className="font-mono text-xs text-[#aaaaaa]">{selected.completionTokens.toLocaleString()}</span> },
                { label: "Total tokens",      value: <span className="font-mono text-xs text-white font-medium">{(selected.promptTokens + selected.completionTokens).toLocaleString()}</span> },
                { label: "Cost",     value: <span className="font-mono text-xs text-[#00ff88] font-medium">${selected.totalCost.toFixed(8)}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-[#0d0d0d] last:border-0">
                  <span className="text-xs text-[#444444]">{label}</span>
                  {value}
                </div>
              ))}

              <div className="pt-3">
                <p className="text-[10px] text-[#333333] font-mono break-all">{selected.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
