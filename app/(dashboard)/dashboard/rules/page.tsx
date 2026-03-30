"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Shield, ToggleLeft, ToggleRight } from "lucide-react";

interface Rule {
  id: string; name: string; type: "spend_cap" | "rate_limit" | "injection_filter";
  config: Record<string, unknown>; isActive: boolean; createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  spend_cap: "Spend Cap", rate_limit: "Rate Limit", injection_filter: "Injection Filter",
};
const TYPE_COLORS: Record<string, string> = {
  spend_cap: "#ffaa00", rate_limit: "#00aaff", injection_filter: "#ff4444",
};

type FormMode = "none" | "spend_cap" | "rate_limit" | "injection_filter";

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<FormMode>("none");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Spend cap form
  const [sc, setSc] = useState({ name: "", dailyLimit: "", weeklyLimit: "", monthlyLimit: "", action: "block" });
  // Rate limit form
  const [rl, setRl] = useState({ name: "", requestsPerMinute: "", requestsPerHour: "", requestsPerDay: "", per: "account" });
  // Injection filter form
  const [inj, setInj] = useState({ name: "", sensitivity: "medium" });

  async function loadRules() {
    const res = await fetch("/api/rules");
    setRules(await res.json());
    setLoading(false);
  }

  async function saveRule(type: string, config: Record<string, unknown>, name: string) {
    setFormError("");
    if (!name) { setFormError("Name is required"); return; }
    setSaving(true);
    const res = await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, config }),
    });
    setSaving(false);
    if (res.ok) { setMode("none"); loadRules(); }
    else { const d = await res.json(); setFormError(d.error ?? "Failed"); }
  }

  async function toggleRule(id: string, isActive: boolean) {
    await fetch(`/api/rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    setRules(r => r.map(rule => rule.id === id ? { ...rule, isActive } : rule));
  }

  async function deleteRule(id: string) {
    if (!confirm("Delete this rule?")) return;
    await fetch(`/api/rules/${id}`, { method: "DELETE" });
    setRules(r => r.filter(rule => rule.id !== id));
  }

  useEffect(() => { loadRules(); }, []);

  function renderForm() {
    if (mode === "none") return null;
    return (
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
        <h3 className="font-mono text-sm font-bold text-white mb-4">
          New {TYPE_LABELS[mode]} Rule
        </h3>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm text-[#f0f0f0] mb-1.5">Rule name</label>
            <input
              value={mode === "spend_cap" ? sc.name : mode === "rate_limit" ? rl.name : inj.name}
              onChange={e => {
                if (mode === "spend_cap") setSc(s => ({ ...s, name: e.target.value }));
                if (mode === "rate_limit") setRl(s => ({ ...s, name: e.target.value }));
                if (mode === "injection_filter") setInj(s => ({ ...s, name: e.target.value }));
              }}
              placeholder="e.g. Monthly cap"
              className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#444444] focus:outline-none focus:border-[#00ff88] transition-colors"
            />
          </div>

          {mode === "spend_cap" && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[["Daily limit ($)", "dailyLimit"], ["Weekly limit ($)", "weeklyLimit"], ["Monthly limit ($)", "monthlyLimit"]].map(([label, key]) => (
                  <div key={key}>
                    <label className="block text-xs text-[#666666] mb-1">{label}</label>
                    <input type="number" value={sc[key as keyof typeof sc]}
                      onChange={e => setSc(s => ({ ...s, [key]: e.target.value }))}
                      placeholder="0"
                      className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444444] focus:outline-none focus:border-[#00ff88] transition-colors" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">Action when exceeded</label>
                <select value={sc.action} onChange={e => setSc(s => ({ ...s, action: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88] transition-colors">
                  <option value="block">Block request (429)</option>
                  <option value="alert">Alert only (allow request)</option>
                  <option value="both">Block + Alert</option>
                </select>
              </div>
            </>
          )}

          {mode === "rate_limit" && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[["Req / minute", "requestsPerMinute"], ["Req / hour", "requestsPerHour"], ["Req / day", "requestsPerDay"]].map(([label, key]) => (
                  <div key={key}>
                    <label className="block text-xs text-[#666666] mb-1">{label}</label>
                    <input type="number" value={rl[key as keyof typeof rl]}
                      onChange={e => setRl(s => ({ ...s, [key]: e.target.value }))}
                      placeholder="∞"
                      className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444444] focus:outline-none focus:border-[#00ff88] transition-colors" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">Per</label>
                <select value={rl.per} onChange={e => setRl(s => ({ ...s, per: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88] transition-colors">
                  <option value="account">Account</option>
                  <option value="api-key">API Key</option>
                  <option value="ip">IP address</option>
                </select>
              </div>
            </>
          )}

          {mode === "injection_filter" && (
            <div>
              <label className="block text-xs text-[#666666] mb-1">Sensitivity</label>
              <select value={inj.sensitivity} onChange={e => setInj(s => ({ ...s, sensitivity: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88] transition-colors">
                <option value="low">Low — block only obvious attacks</option>
                <option value="medium">Medium — balanced protection</option>
                <option value="high">High — strict, may have false positives</option>
              </select>
              <p className="text-xs text-[#444444] mt-2">Scans for {`>`}20 known jailbreak and injection patterns. Flagged requests return 403.</p>
            </div>
          )}

          {formError && (
            <div className="bg-[#ff4444]/10 border border-[#ff4444]/30 rounded-lg px-3 py-2.5 text-sm text-[#ff4444]">{formError}</div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setMode("none"); setFormError(""); }}
              className="border border-[#1f1f1f] text-[#f0f0f0] hover:border-[#666666] text-sm px-4 py-2 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={() => {
                if (mode === "spend_cap") saveRule("spend_cap", {
                  dailyLimit: sc.dailyLimit ? parseFloat(sc.dailyLimit) : undefined,
                  weeklyLimit: sc.weeklyLimit ? parseFloat(sc.weeklyLimit) : undefined,
                  monthlyLimit: sc.monthlyLimit ? parseFloat(sc.monthlyLimit) : undefined,
                  action: sc.action,
                }, sc.name);
                if (mode === "rate_limit") saveRule("rate_limit", {
                  requestsPerMinute: rl.requestsPerMinute ? parseInt(rl.requestsPerMinute) : undefined,
                  requestsPerHour: rl.requestsPerHour ? parseInt(rl.requestsPerHour) : undefined,
                  requestsPerDay: rl.requestsPerDay ? parseInt(rl.requestsPerDay) : undefined,
                  per: rl.per,
                }, rl.name);
                if (mode === "injection_filter") saveRule("injection_filter", {
                  enabled: true, sensitivity: inj.sensitivity,
                }, inj.name);
              }}
              disabled={saving}
              className="bg-[#00ff88] hover:bg-[#00cc6e] text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Create Rule"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">Rules</h2>
          <p className="text-sm text-[#666666]">Rate limits, spend caps, and injection protection</p>
        </div>
        {mode === "none" && (
          <div className="flex gap-2">
            {(["spend_cap", "rate_limit", "injection_filter"] as const).map(t => (
              <button key={t} onClick={() => setMode(t)}
                className="flex items-center gap-1.5 border border-[#1f1f1f] text-[#f0f0f0] hover:border-[#00ff88] text-xs px-3 py-1.5 rounded-lg transition-colors">
                <Plus size={12} /> {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        )}
      </div>

      {renderForm()}

      {loading ? (
        <div className="text-center py-12 text-[#444444] text-sm">Loading...</div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <Shield size={40} className="text-[#333333]" />
          <p className="text-[#666666] text-sm">No rules yet. Create your first rule above.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {rules.map(rule => {
            const color = TYPE_COLORS[rule.type] ?? "#666666";
            return (
              <div key={rule.id} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 card-glow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: `${color}18` }}>
                      <Shield size={14} style={{ color }} />
                    </div>
                    <div>
                      <div className="font-medium text-white">{rule.name}</div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full mt-1 inline-block"
                        style={{ background: `${color}18`, color }}>
                        {TYPE_LABELS[rule.type]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleRule(rule.id, !rule.isActive)}
                      className="flex items-center gap-1.5 text-xs transition-colors"
                      style={{ color: rule.isActive ? "#00ff88" : "#666666" }}>
                      {rule.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {rule.isActive ? "Active" : "Inactive"}
                    </button>
                    <button onClick={() => deleteRule(rule.id)}
                      className="text-[#444444] hover:text-[#ff4444] p-1 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {Object.entries(rule.config).filter(([k]) => k !== "action" || rule.type === "spend_cap").map(([k, v]) => (
                    v !== undefined && v !== null && v !== "" && (
                      <div key={k} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5">
                        <span className="text-[#666666] text-xs font-mono">{k}: </span>
                        <span className="text-white text-xs font-mono">{String(v)}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
