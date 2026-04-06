"use client";

import { useCallback, useState } from "react";
import { Zap, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import { useDashboardData } from "@/lib/use-dashboard-data";

interface RoutingRule { id: string; name: string; condition: Record<string, unknown>; targetModel: string; provider: string; priority: number; isActive: boolean; }
interface RoutingData { rules: RoutingRule[]; routingEnabled: boolean; }

const MODEL_OPTIONS = [
  { label: "GPT-4o",            value: "gpt-4o",                     provider: "openai" },
  { label: "GPT-4o Mini",       value: "gpt-4o-mini",                provider: "openai" },
  { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20241022", provider: "anthropic" },
  { label: "Claude 3 Haiku",    value: "claude-3-haiku-20240307",    provider: "anthropic" },
  { label: "Gemini 1.5 Flash",  value: "gemini-1.5-flash",           provider: "gemini" },
  { label: "Gemini 1.5 Pro",    value: "gemini-1.5-pro",             provider: "gemini" },
];

const inputCls = "w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#383838] focus:outline-none focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/10 transition-all";

export default function RoutingPage() {
  const fetcher = useCallback(async (): Promise<RoutingData> => {
    const res = await fetch("/api/routing");
    if (!res.ok) throw new Error("Failed");
    return res.json();
  }, []);

  const { data, loading, invalidate } = useDashboardData<RoutingData>("dashboard:routing", fetcher);

  const rules          = data?.rules ?? [];
  const routingEnabled = data?.routingEnabled ?? false;
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({ name: "", complexity: "simple", targetModel: "gpt-4o-mini", provider: "openai" });

  async function toggleRouting() {
    await fetch("/api/routing", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ routingEnabled: !routingEnabled }) });
    invalidate();
  }

  async function createRule() {
    if (!form.name.trim()) return;
    setSaving(true);
    const model = MODEL_OPTIONS.find(m => m.value === form.targetModel);
    await fetch("/api/routing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, condition: { complexity: form.complexity }, targetModel: form.targetModel, provider: model?.provider ?? "openai", priority: 0 }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ name: "", complexity: "simple", targetModel: "gpt-4o-mini", provider: "openai" });
    invalidate();
  }

  async function deleteRule(id: string) {
    await fetch(`/api/routing?ruleId=${id}`, { method: "DELETE" });
    invalidate();
  }

  if (loading && !data) return <div className="flex items-center justify-center h-48"><RefreshCw className="animate-spin text-[#00ff88]" size={20} /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2"><Zap size={18} className="text-[#4488ff]" /> Smart Routing</h2>
          <p className="text-sm text-[#555555] mt-0.5">Automatically send simple requests to cheaper models.</p>
        </div>
        <button onClick={toggleRouting} className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-all">
          {routingEnabled ? <ToggleRight size={24} className="text-[#00ff88]" /> : <ToggleLeft size={24} className="text-[#333333]" />}
          <span className={routingEnabled ? "text-[#00ff88]" : "text-[#555555]"}>{routingEnabled ? "Enabled" : "Disabled"}</span>
        </button>
      </div>

      {/* Flow diagram */}
      <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5">
        <p className="text-xs text-[#444444] uppercase tracking-widest font-mono mb-4">Default routing logic</p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { label: "Simple", model: "GPT-4o Mini / Haiku", bg: "bg-[#4488ff]/10 text-[#4488ff] border-[#4488ff]/20" },
            { label: "Medium", model: "Claude Sonnet / GPT-4o", bg: "bg-[#aa66ff]/10 text-[#aa66ff] border-[#aa66ff]/20" },
            { label: "Complex", model: "Your requested model", bg: "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={`rounded-xl border px-3 py-1.5 text-xs font-medium ${item.bg}`}>{item.label}</span>
              <span className="text-[#333333]">→</span>
              <span className="text-[#555555] text-xs">{item.model}</span>
              <span className="text-[#222222] mx-1">·</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#888888]">Custom Rules</p>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222222] px-3 py-1.5 text-xs font-medium text-white transition-all">
            <Plus size={13} /> Add rule
          </button>
        </div>

        {rules.length === 0 && !showForm && (
          <p className="text-sm text-[#333333] py-4">No custom rules — default complexity routing applies.</p>
        )}

        {rules.map(rule => (
          <div key={rule.id} className="flex items-center justify-between bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">{rule.name}</p>
              <p className="text-xs text-[#444444] mt-0.5 font-mono">
                {JSON.stringify(rule.condition)} → {rule.targetModel}
              </p>
            </div>
            <button onClick={() => deleteRule(rule.id)} className="text-[#333333] hover:text-[#ff4444] transition-colors p-1">
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {showForm && (
          <div className="bg-[#0e0e0e] border border-[#2a2a2a] rounded-2xl p-5 space-y-4">
            <p className="text-sm font-semibold text-white">New Routing Rule</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#555555] block mb-1.5">Rule name</label>
                <input className={inputCls} placeholder="Route simple queries" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-[#555555] block mb-1.5">Complexity</label>
                <select className={inputCls} value={form.complexity} onChange={e => setForm(f => ({ ...f, complexity: e.target.value }))}>
                  <option value="simple">Simple</option>
                  <option value="medium">Medium</option>
                  <option value="complex">Complex</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-[#555555] block mb-1.5">Route to model</label>
                <select className={inputCls} value={form.targetModel}
                  onChange={e => { const m = MODEL_OPTIONS.find(o => o.value === e.target.value); setForm(f => ({ ...f, targetModel: e.target.value, provider: m?.provider ?? "openai" })); }}>
                  {MODEL_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={createRule} disabled={!form.name.trim() || saving}
                className="rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-40 px-4 py-2 text-sm font-semibold text-black transition-all">
                {saving ? "Creating..." : "Create rule"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="rounded-xl border border-[#222222] px-4 py-2 text-sm text-[#555555] hover:text-white transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
