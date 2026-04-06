"use client";

import { useCallback, useState } from "react";
import { Database, Trash2, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import { useDashboardData } from "@/lib/use-dashboard-data";

interface CacheStats { totalEntries: number; totalHits: number; hitRate: number; moneySaved: number; }
interface CacheEntry { id: string; model: string; hitCount: number; cost: number; createdAt: string; expiresAt: string; }
interface CacheSettings { cacheEnabled: boolean; cacheTtlHours: number; similarityThreshold: number; }
interface CacheData { stats: CacheStats; topEntries: CacheEntry[]; settings: CacheSettings | null; }

const TTL_OPTIONS = [1, 6, 24, 72, 168];

export default function CachePage() {
  const fetcher = useCallback(async (): Promise<CacheData> => {
    const res = await fetch("/api/proxy/cache");
    if (!res.ok) throw new Error("Failed");
    return res.json();
  }, []);

  const { data, loading, invalidate } = useDashboardData<CacheData>("dashboard:cache", fetcher);

  const stats    = data?.stats;
  const entries  = data?.topEntries ?? [];
  const settings = data?.settings ?? { cacheEnabled: true, cacheTtlHours: 24, similarityThreshold: 0.97 };

  const [flushing, setFlushing]     = useState(false);
  const [threshold, setThreshold]   = useState(settings.similarityThreshold);

  async function patchSettings(updates: Partial<CacheSettings>) {
    await fetch("/api/proxy/cache", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
    invalidate();
  }

  async function flushCache() {
    setFlushing(true);
    await fetch("/api/proxy/cache", { method: "DELETE" });
    setFlushing(false);
    invalidate();
  }

  if (loading && !data) return <div className="flex items-center justify-center h-48"><RefreshCw className="animate-spin text-[#00ff88]" size={20} /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2"><Database size={18} className="text-[#aa66ff]" /> Semantic Cache</h2>
          <p className="text-sm text-[#555555] mt-0.5">Identical or similar prompts return instantly at $0 cost.</p>
        </div>
        <button onClick={() => patchSettings({ cacheEnabled: !settings.cacheEnabled })}
          className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-all">
          {settings.cacheEnabled ? <ToggleRight size={24} className="text-[#00ff88]" /> : <ToggleLeft size={24} className="text-[#333333]" />}
          <span className={settings.cacheEnabled ? "text-[#00ff88]" : "text-[#555555]"}>{settings.cacheEnabled ? "Enabled" : "Disabled"}</span>
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Cached entries", value: stats.totalEntries.toLocaleString() },
            { label: "Total hits",     value: stats.totalHits.toLocaleString() },
            { label: "Hit rate",       value: `${stats.hitRate}%` },
            { label: "Money saved",    value: `$${stats.moneySaved.toFixed(4)}` },
          ].map(s => (
            <div key={s.label} className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-4">
              <p className="text-xs text-[#444444] mb-1">{s.label}</p>
              <p className="text-xl font-bold text-white font-mono">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Settings */}
      <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5 space-y-5">
        <p className="text-sm font-semibold text-white">Cache Settings</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm text-[#888888]">Similarity threshold: <span className="text-white font-mono">{threshold.toFixed(2)}</span></label>
            <span className="text-xs text-[#333333]">0.90 loose · 0.99 strict</span>
          </div>
          <input type="range" min={0.90} max={0.99} step={0.01} value={threshold}
            onChange={e => setThreshold(parseFloat(e.target.value))}
            onMouseUp={() => patchSettings({ similarityThreshold: threshold })}
            onTouchEnd={() => patchSettings({ similarityThreshold: threshold })}
            className="w-full accent-[#aa66ff]" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-[#888888]">Cache TTL</label>
          <div className="flex flex-wrap gap-2">
            {TTL_OPTIONS.map(h => (
              <button key={h} onClick={() => patchSettings({ cacheTtlHours: h })}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${settings.cacheTtlHours === h ? "bg-[#aa66ff]/20 text-[#aa66ff] border border-[#aa66ff]/30" : "bg-[#1a1a1a] text-[#555555] hover:text-white border border-transparent"}`}>
                {h}h
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top entries */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#888888]">Top Cached Prompts</p>
          <button onClick={flushCache} disabled={flushing || entries.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-[#ff4444]/20 px-3 py-1.5 text-xs text-[#ff4444] hover:border-[#ff4444]/50 disabled:opacity-40 transition-all">
            <Trash2 size={13} /> {flushing ? "Flushing..." : "Flush cache"}
          </button>
        </div>

        {entries.length === 0 && <p className="text-sm text-[#333333] py-4">No cache entries yet.</p>}

        {entries.map(entry => (
          <div key={entry.id} className="flex items-center justify-between bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl px-4 py-3">
            <div>
              <p className="text-sm text-white font-mono">{entry.model}</p>
              <p className="text-xs text-[#444444] mt-0.5">
                {entry.hitCount} hits · ${entry.cost.toFixed(6)}/call · expires {new Date(entry.expiresAt).toLocaleDateString()}
              </p>
            </div>
            <span className="rounded-full bg-[#aa66ff]/10 border border-[#aa66ff]/20 px-2 py-0.5 text-xs text-[#aa66ff] font-mono">
              {entry.hitCount}× hit
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
