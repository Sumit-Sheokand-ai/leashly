"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FlaskConical, Play, Clock, DollarSign, RefreshCw } from "lucide-react";
import { useDashboardData } from "@/lib/use-dashboard-data";

interface BenchmarkResult { provider: string; model: string; avgCost: number; p50Ms: number; p95Ms: number; errorRate: number; }
interface BenchmarkJob { id: string; status: string; testType: string; results: BenchmarkResult[] | null; createdAt: string; }
interface BenchmarkData { jobs: BenchmarkJob[] }

const TEST_TYPES = [
  { value: "short_factual", label: "Short / Factual" },
  { value: "code",          label: "Code" },
  { value: "long_form",     label: "Long form" },
];
const PROVIDERS = ["openai", "anthropic"];

export default function BenchmarkPage() {
  const fetcher = useCallback(async (): Promise<BenchmarkData> => {
    const res = await fetch("/api/benchmark");
    return { jobs: res.ok ? await res.json() : [] };
  }, []);

  const { data, loading, invalidate } = useDashboardData<BenchmarkData>("dashboard:benchmark", fetcher);

  const jobs = data?.jobs ?? [];
  const [activeJob, setActiveJob]             = useState<BenchmarkJob | null>(null);
  const [selectedProviders, setSelectedProviders] = useState(["openai", "anthropic"]);
  const [testType, setTestType]               = useState("short_factual");
  const [running, setRunning]                 = useState(false);
  const pollRef                               = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function runBenchmark() {
    setRunning(true);
    const res = await fetch("/api/benchmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providers: selectedProviders, testType }),
    });
    const { jobId } = await res.json();
    pollRef.current = setInterval(async () => {
      const r = await fetch(`/api/benchmark?jobId=${jobId}`);
      const job: BenchmarkJob = await r.json();
      if (job.status === "complete" || job.status === "failed") {
        clearInterval(pollRef.current!);
        setRunning(false);
        setActiveJob(job);
        invalidate();
      }
    }, 2500);
  }

  const results = (activeJob?.results ?? jobs.find(j => j.status === "complete")?.results ?? [])
    .slice().sort((a, b) => a.avgCost - b.avgCost);
  const cheapest = results[0];

  if (loading && !data) return <div className="flex items-center justify-center h-48"><RefreshCw className="animate-spin text-[#00ff88]" size={20} /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2"><FlaskConical size={18} className="text-[#ffaa44]" /> Benchmark</h2>
        <p className="text-sm text-[#555555] mt-0.5">Compare models on your actual usage pattern.</p>
      </div>

      {/* Config */}
      <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold text-white">Configure benchmark</p>
        <div>
          <p className="text-xs text-[#555555] mb-2">Prompt type</p>
          <div className="flex flex-wrap gap-2">
            {TEST_TYPES.map(t => (
              <button key={t.value} onClick={() => setTestType(t.value)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${testType === t.value ? "bg-[#ffaa44]/20 text-[#ffaa44] border border-[#ffaa44]/30" : "bg-[#1a1a1a] text-[#555555] hover:text-white border border-transparent"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-[#555555] mb-2">Providers</p>
          <div className="flex gap-2">
            {PROVIDERS.map(p => (
              <button key={p} onClick={() => setSelectedProviders(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all capitalize ${selectedProviders.includes(p) ? "bg-[#1f1f1f] text-white border border-[#444444]" : "bg-[#111111] text-[#444444] border border-[#1a1a1a]"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <button onClick={runBenchmark} disabled={running || selectedProviders.length === 0}
          className="flex items-center gap-2 rounded-xl bg-[#ffaa44] hover:bg-[#ff9922] disabled:opacity-50 px-4 py-2 text-sm font-semibold text-black transition-all">
          <Play size={14} />{running ? "Running..." : "Run benchmark"}
        </button>
        {running && <p className="text-xs text-[#555555] flex items-center gap-2"><RefreshCw size={11} className="animate-spin" /> Running 5 prompts per model (~30s)...</p>}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-[#888888]">Results</p>
          {cheapest && (
            <div className="rounded-2xl border border-[#00ff88]/20 bg-[#00ff88]/5 px-4 py-3 text-sm text-[#00ff88]">
              💡 For your usage, <strong>{cheapest.model}</strong> is cheapest at ${(cheapest.avgCost * 1000).toFixed(4)}/1K calls with {cheapest.p50Ms}ms median latency.
            </div>
          )}
          <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#111111] text-xs text-[#444444] font-mono">
                  <th className="text-left px-4 py-3">Model</th>
                  <th className="text-right px-4 py-3"><span className="flex items-center justify-end gap-1"><DollarSign size={11} />Cost/call</span></th>
                  <th className="text-right px-4 py-3"><span className="flex items-center justify-end gap-1"><Clock size={11} />p50</span></th>
                  <th className="text-right px-4 py-3">p95</th>
                  <th className="text-right px-4 py-3">Errors</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.model} className={`border-b border-[#0d0d0d] last:border-0 ${i === 0 ? "bg-[#00ff88]/5" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {i === 0 && <span className="text-[10px] bg-[#00ff88]/20 text-[#00ff88] px-1.5 py-0.5 rounded-full font-mono">best</span>}
                        <span className="text-white font-mono text-xs">{r.model}</span>
                        <span className="text-[#333333] text-xs">{r.provider}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-[#aaaaaa]">${(r.avgCost * 1000).toFixed(4)}/K</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-[#aaaaaa]">{r.p50Ms}ms</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-[#555555]">{r.p95Ms}ms</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-[#555555]">{(r.errorRate * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {cheapest && (
            <button onClick={async () => {
              await fetch("/api/routing", { method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: `Benchmark: simple → ${cheapest.model}`, condition: { complexity: "simple" }, targetModel: cheapest.model, provider: cheapest.provider, priority: 10 }) });
              alert(`Routing rule created: simple requests → ${cheapest.model}`);
            }} className="rounded-xl bg-[#1a1a1a] hover:bg-[#222222] px-4 py-2 text-sm font-medium text-white transition-all">
              Apply cheapest as routing rule →
            </button>
          )}
        </div>
      )}

      {/* History */}
      {jobs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[#444444] uppercase tracking-widest font-mono">Previous runs</p>
          {jobs.map(job => (
            <button key={job.id} onClick={() => setActiveJob(job)}
              className="w-full flex items-center justify-between bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl px-4 py-3 text-left hover:border-[#222222] transition-all">
              <span className="text-sm text-[#888888] font-mono">{job.testType} · {new Date(job.createdAt).toLocaleDateString()}</span>
              <span className={`text-xs font-mono ${job.status === "complete" ? "text-[#00ff88]" : "text-[#333333]"}`}>{job.status}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
