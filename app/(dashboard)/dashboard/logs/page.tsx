"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, ChevronLeft, ChevronRight, X, ScrollText } from "lucide-react";

interface LogRow {
  id: string; timestamp: string; provider: string; model: string;
  promptTokens: number; completionTokens: number; totalCost: number;
  flagged: boolean; flagReason: string | null; durationMs: number; statusCode: number;
  apiKeyId: string;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#7c3aed", anthropic: "#ea580c", gemini: "#2563eb", custom: "#666666",
};

function ProviderBadge({ provider }: { provider: string }) {
  const color = PROVIDER_COLORS[provider] ?? "#666666";
  return <span className="px-2 py-0.5 rounded-full text-xs font-mono" style={{ background: `${color}22`, color }}>{provider}</span>;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LogRow | null>(null);

  // Filters
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const loadLogs = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (provider) params.set("provider", provider);
    if (model) params.set("model", model);
    if (flaggedOnly) params.set("flagged", "true");
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/logs?${params}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [provider, model, flaggedOnly, from, to]);

  useEffect(() => { loadLogs(page); }, [page, loadLogs]);

  function exportCSV() {
    const headers = ["id", "timestamp", "provider", "model", "promptTokens", "completionTokens", "totalCost", "flagged", "flagReason", "durationMs", "statusCode"];
    const rows = logs.map(l => headers.map(h => {
      const v = l[h as keyof LogRow];
      return typeof v === "string" && v.includes(",") ? `"${v}"` : String(v ?? "");
    }).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "leashly-logs.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">Request Logs</h2>
          <p className="text-sm text-[#666666]">{total.toLocaleString()} total requests</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 border border-[#1f1f1f] text-[#f0f0f0] hover:border-[#00ff88] text-xs px-3 py-2 rounded-lg transition-colors">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-[#666666] mb-1">Provider</label>
          <select value={provider} onChange={e => { setProvider(e.target.value); setPage(1); }}
            className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88] transition-colors">
            <option value="">All</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#666666] mb-1">Model</label>
          <input value={model} onChange={e => { setModel(e.target.value); setPage(1); }}
            placeholder="gpt-4o"
            className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444444] focus:outline-none focus:border-[#00ff88] transition-colors w-36" />
        </div>
        <div>
          <label className="block text-xs text-[#666666] mb-1">From</label>
          <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }}
            className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88] transition-colors [color-scheme:dark]" />
        </div>
        <div>
          <label className="block text-xs text-[#666666] mb-1">To</label>
          <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }}
            className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88] transition-colors [color-scheme:dark]" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={flaggedOnly} onChange={e => { setFlaggedOnly(e.target.checked); setPage(1); }}
            className="accent-[#00ff88]" />
          <span className="text-sm text-[#f0f0f0]">Flagged only</span>
        </label>
        <button onClick={() => { setProvider(""); setModel(""); setFlaggedOnly(false); setFrom(""); setTo(""); setPage(1); }}
          className="text-xs text-[#666666] hover:text-white transition-colors">
          Clear filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-[#444444] text-sm">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <ScrollText size={36} className="text-[#333333]" />
            <p className="text-[#666666] text-sm">No logs match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f1f1f]">
                  {["Timestamp", "Provider", "Model", "Prompt", "Completion", "Cost", "Duration", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-[#444444] font-mono font-normal whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id} onClick={() => setSelected(log)}
                    className={`border-b border-[#1f1f1f] cursor-pointer hover:bg-[#1a1a1a] transition-colors ${i % 2 !== 0 ? "bg-[#0d0d0d]" : ""} ${log.flagged ? "border-l-2 border-l-[#ff4444]" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-[#666666] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3"><ProviderBadge provider={log.provider} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-[#f0f0f0] max-w-[160px] truncate">{log.model}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#666666]">{log.promptTokens.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#666666]">{log.completionTokens.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#f0f0f0]">${log.totalCost.toFixed(6)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#666666]">{log.durationMs}ms</td>
                    <td className="px-4 py-3">
                      {log.flagged
                        ? <span className="bg-[#ff4444]/15 text-[#ff4444] text-xs px-2 py-0.5 rounded-full font-mono">flagged</span>
                        : <span className="bg-[#00ff88]/10 text-[#00ff88] text-xs px-2 py-0.5 rounded-full font-mono">{log.statusCode}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#666666] font-mono">Page {page} of {totalPages} · {total} results</p>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="border border-[#1f1f1f] text-[#f0f0f0] disabled:opacity-30 hover:border-[#00ff88] p-2 rounded-lg transition-colors">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="border border-[#1f1f1f] text-[#f0f0f0] disabled:opacity-30 hover:border-[#00ff88] p-2 rounded-lg transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute right-0 top-0 h-full w-[420px] bg-[#111111] border-l border-[#1f1f1f] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f] sticky top-0 bg-[#111111]">
              <h3 className="font-mono text-sm font-bold text-white">Request Detail</h3>
              <button onClick={() => setSelected(null)} className="text-[#666666] hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                ["ID", selected.id],
                ["Timestamp", new Date(selected.timestamp).toLocaleString()],
                ["Provider", selected.provider],
                ["Model", selected.model],
                ["Status", String(selected.statusCode)],
                ["Duration", `${selected.durationMs}ms`],
                ["Prompt tokens", selected.promptTokens.toLocaleString()],
                ["Completion tokens", selected.completionTokens.toLocaleString()],
                ["Total cost", `$${selected.totalCost.toFixed(8)}`],
                ["Flagged", selected.flagged ? "Yes" : "No"],
                ["Flag reason", selected.flagReason ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-start gap-4">
                  <span className="text-xs text-[#666666] font-mono shrink-0">{label}</span>
                  <span className="text-xs text-[#f0f0f0] font-mono text-right break-all">{value}</span>
                </div>
              ))}
              {selected.flagged && selected.flagReason && (
                <div className="bg-[#ff4444]/10 border border-[#ff4444]/30 rounded-lg p-3 mt-2">
                  <p className="text-xs text-[#ff4444] font-mono">{selected.flagReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
