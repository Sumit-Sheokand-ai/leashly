"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Shield, Zap, DollarSign, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Info } from "lucide-react";

interface Rule {
  id: string; name: string; type: "spend_cap" | "rate_limit" | "injection_filter";
  config: Record<string, unknown>; isActive: boolean; createdAt: string;
}

const TYPE_META = {
  spend_cap:        { label: "Spend Cap",         color: "#ffaa00", icon: DollarSign, desc: "Block or alert when spend exceeds a dollar threshold" },
  rate_limit:       { label: "Rate Limit",         color: "#00aaff", icon: Zap,        desc: "Throttle requests per minute, hour, or day" },
  injection_filter: { label: "Injection Filter",   color: "#ff4444", icon: Shield,     desc: "Detect and block prompt injection & jailbreak attempts" },
} as const;

type RuleType = keyof typeof TYPE_META;

function ConfigPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-2.5 py-1">
      <span className="text-[#555555] text-xs">{label}</span>
      <span className="text-[#e0e0e0] text-xs font-mono font-medium">{value}</span>
    </div>
  );
}

function renderConfig(type: RuleType, config: Record<string, unknown>) {
  if (type === "spend_cap") {
    const pills = [];
    if (config.dailyLimit)   pills.push({ label: "Daily",   value: `$${config.dailyLimit}` });
    if (config.weeklyLimit)  pills.push({ label: "Weekly",  value: `$${config.weeklyLimit}` });
    if (config.monthlyLimit) pills.push({ label: "Monthly", value: `$${config.monthlyLimit}` });
    if (config.action)       pills.push({ label: "Action",  value: config.action as string });
    return pills;
  }
  if (type === "rate_limit") {
    const pills = [];
    if (config.requestsPerMinute) pills.push({ label: "Per min",  value: String(config.requestsPerMinute) });
    if (config.requestsPerHour)   pills.push({ label: "Per hour", value: String(config.requestsPerHour) });
    if (config.requestsPerDay)    pills.push({ label: "Per day",  value: String(config.requestsPerDay) });
    if (config.per)               pills.push({ label: "Scope",    value: config.per as string });
    return pills;
  }
  if (type === "injection_filter") {
    return [{ label: "Sensitivity", value: config.sensitivity as string }];
  }
  return [];
}

type FormMode = "none" | RuleType;

function InputField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-[#d0d0d0] mb-1.5 font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-[#444444] mt-1.5">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#383838] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/20 transition-all";
const selectCls = inputCls;

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<FormMode>("none");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [sc,  setSc]  = useState({ name: "", dailyLimit: "", weeklyLimit: "", monthlyLimit: "", action: "block" });
  const [rl,  setRl]  = useState({ name: "", requestsPerMinute: "", requestsPerHour: "", requestsPerDay: "", per: "account" });
  const [inj, setInj] = useState({ name: "", sensitivity: "medium" });

  async function loadRules() {
    try {
      const res = await fetch("/api/rules");
      if (res.ok) setRules(await res.json());
    } catch {}
    setLoading(false);
  }

  async function saveRule(type: RuleType, config: Record<string, unknown>, name: string) {
    setFormError("");
    if (!name.trim()) { setFormError("Please give this rule a name"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, config }),
      });
      if (res.ok) {
        setMode("none");
        resetForms();
        loadRules();
      } else {
        const d = await res.json();
        setFormError(d.error ?? "Failed to save rule");
      }
    } catch { setFormError("Network error. Please try again."); }
    setSaving(false);
  }

  function resetForms() {
    setSc({ name: "", dailyLimit: "", weeklyLimit: "", monthlyLimit: "", action: "block" });
    setRl({ name: "", requestsPerMinute: "", requestsPerHour: "", requestsPerDay: "", per: "account" });
    setInj({ name: "", sensitivity: "medium" });
    setFormError("");
  }

  async function toggleRule(id: string, isActive: boolean) {
    try {
      await fetch(`/api/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      setRules(r => r.map(rule => rule.id === id ? { ...rule, isActive } : rule));
    } catch {}
  }

  async function deleteRule(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/rules/${id}`, { method: "DELETE" });
      setRules(r => r.filter(rule => rule.id !== id));
    } catch {}
    setDeletingId(null);
  }

  useEffect(() => { loadRules(); }, []);

  function handleSave() {
    if (mode === "spend_cap") {
      saveRule("spend_cap", {
        ...(sc.dailyLimit   && { dailyLimit:   parseFloat(sc.dailyLimit) }),
        ...(sc.weeklyLimit  && { weeklyLimit:  parseFloat(sc.weeklyLimit) }),
        ...(sc.monthlyLimit && { monthlyLimit: parseFloat(sc.monthlyLimit) }),
        action: sc.action,
      }, sc.name);
    } else if (mode === "rate_limit") {
      saveRule("rate_limit", {
        ...(rl.requestsPerMinute && { requestsPerMinute: parseInt(rl.requestsPerMinute) }),
        ...(rl.requestsPerHour   && { requestsPerHour:   parseInt(rl.requestsPerHour) }),
        ...(rl.requestsPerDay    && { requestsPerDay:    parseInt(rl.requestsPerDay) }),
        per: rl.per,
      }, rl.name);
    } else if (mode === "injection_filter") {
      saveRule("injection_filter", { enabled: true, sensitivity: inj.sensitivity }, inj.name);
    }
  }

  const formName = mode !== "none" ? (mode === "spend_cap" ? sc.name : mode === "rate_limit" ? rl.name : inj.name) : "";
  const setFormName = (v: string) => {
    if (mode === "spend_cap")        setSc(s => ({ ...s, name: v }));
    else if (mode === "rate_limit")  setRl(s => ({ ...s, name: v }));
    else if (mode === "injection_filter") setInj(s => ({ ...s, name: v }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">Rules</h2>
          <p className="text-sm text-[#555555] mt-0.5">Enforce spend caps, rate limits, and injection protection on every proxied request</p>
        </div>
        {mode === "none" && (
          <div className="flex items-center gap-2">
            {(Object.keys(TYPE_META) as RuleType[]).map(t => {
              const { label, color, icon: Icon } = TYPE_META[t];
              return (
                <button key={t} onClick={() => { setMode(t); resetForms(); }}
                  className="flex items-center gap-1.5 border border-[#1f1f1f] text-[#aaaaaa] hover:text-white hover:border-[#333333] text-xs px-3 py-2 rounded-lg transition-all">
                  <Icon size={12} style={{ color }} />
                  {label}
                </button>
              );
            })}
            <button onClick={() => { setMode("spend_cap"); resetForms(); }}
              className="flex items-center gap-1.5 bg-[#00ff88] hover:bg-[#00dd77] text-black text-xs font-semibold px-3 py-2 rounded-lg transition-colors ml-1">
              <Plus size={12} /> Add Rule
            </button>
          </div>
        )}
      </div>

      {/* Form */}
      {mode !== "none" && (
        <div className="bg-[#0e0e0e] border border-[#222222] rounded-xl overflow-hidden">
          {/* Form type tabs */}
          <div className="flex border-b border-[#1a1a1a]">
            {(Object.keys(TYPE_META) as RuleType[]).map(t => {
              const { label, color, icon: Icon } = TYPE_META[t];
              return (
                <button key={t} onClick={() => { setMode(t); setFormError(""); }}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-all border-b-2 ${
                    mode === t
                      ? "border-[#00ff88] text-white bg-[#111111]"
                      : "border-transparent text-[#555555] hover:text-[#888888]"
                  }`}>
                  <Icon size={12} style={{ color: mode === t ? color : undefined }} />
                  {label}
                </button>
              );
            })}
            <div className="flex-1" />
            <button onClick={() => { setMode("none"); resetForms(); }}
              className="px-4 text-[#444444] hover:text-[#888888] text-xs transition-colors">
              ✕ Cancel
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Description */}
            <div className="flex items-start gap-2.5 bg-[#111111] border border-[#1a1a1a] rounded-lg px-3.5 py-3">
              <Info size={14} className="text-[#00ff88] mt-0.5 shrink-0" />
              <p className="text-xs text-[#666666] leading-relaxed">{TYPE_META[mode].desc}</p>
            </div>

            {/* Rule name */}
            <InputField label="Rule name" hint="A short, memorable name for this rule">
              <input value={formName} onChange={e => setFormName(e.target.value)}
                placeholder={`e.g. ${mode === "spend_cap" ? "Monthly $100 cap" : mode === "rate_limit" ? "API rate limiter" : "Injection shield"}`}
                className={inputCls} />
            </InputField>

            {/* Spend cap fields */}
            {mode === "spend_cap" && (
              <>
                <div>
                  <label className="block text-sm text-[#d0d0d0] mb-3 font-medium">Spend limits <span className="text-[#444444] font-normal text-xs">(leave blank to skip)</span></label>
                  <div className="grid grid-cols-3 gap-3">
                    {[["Daily ($)", "dailyLimit", "10"], ["Weekly ($)", "weeklyLimit", "50"], ["Monthly ($)", "monthlyLimit", "100"]].map(([label, key, ph]) => (
                      <div key={key}>
                        <label className="block text-xs text-[#555555] mb-1.5">{label}</label>
                        <input type="number" min="0" step="0.01"
                          value={sc[key as keyof typeof sc]}
                          onChange={e => setSc(s => ({ ...s, [key]: e.target.value }))}
                          placeholder={ph}
                          className={inputCls} />
                      </div>
                    ))}
                  </div>
                </div>
                <InputField label="When limit is exceeded"
                  hint="Block returns a 429 error to your app. Alert sends a notification but allows the request through.">
                  <select value={sc.action} onChange={e => setSc(s => ({ ...s, action: e.target.value }))} className={selectCls}>
                    <option value="block">Block request — return 429 to the caller</option>
                    <option value="alert">Alert only — allow request, send notification</option>
                    <option value="both">Block + Alert — block and send notification</option>
                  </select>
                </InputField>
              </>
            )}

            {/* Rate limit fields */}
            {mode === "rate_limit" && (
              <>
                <div>
                  <label className="block text-sm text-[#d0d0d0] mb-3 font-medium">Request limits <span className="text-[#444444] font-normal text-xs">(leave blank to skip)</span></label>
                  <div className="grid grid-cols-3 gap-3">
                    {[["Per minute", "requestsPerMinute", "60"], ["Per hour", "requestsPerHour", "1000"], ["Per day", "requestsPerDay", "10000"]].map(([label, key, ph]) => (
                      <div key={key}>
                        <label className="block text-xs text-[#555555] mb-1.5">{label}</label>
                        <input type="number" min="0"
                          value={rl[key as keyof typeof rl]}
                          onChange={e => setRl(s => ({ ...s, [key]: e.target.value }))}
                          placeholder={ph}
                          className={inputCls} />
                      </div>
                    ))}
                  </div>
                </div>
                <InputField label="Apply limit per" hint="Account applies the limit to all requests. API Key tracks each key separately. IP tracks by client IP address.">
                  <select value={rl.per} onChange={e => setRl(s => ({ ...s, per: e.target.value }))} className={selectCls}>
                    <option value="account">Account — shared across all keys</option>
                    <option value="api-key">API Key — per individual key</option>
                    <option value="ip">IP Address — per client IP</option>
                  </select>
                </InputField>
              </>
            )}

            {/* Injection filter fields */}
            {mode === "injection_filter" && (
              <InputField label="Detection sensitivity"
                hint="Low catches clear jailbreaks only. Medium is recommended for most apps. High is strict and may block edge-case legitimate prompts.">
                <select value={inj.sensitivity} onChange={e => setInj(s => ({ ...s, sensitivity: e.target.value }))} className={selectCls}>
                  <option value="low">Low — obvious attacks only (fewer false positives)</option>
                  <option value="medium">Medium — balanced protection (recommended)</option>
                  <option value="high">High — strict mode (may have false positives)</option>
                </select>
              </InputField>
            )}

            {formError && (
              <div className="flex items-center gap-2 bg-[#ff4444]/8 border border-[#ff4444]/25 rounded-lg px-3.5 py-2.5 text-sm text-[#ff6666]">
                <span>⚠</span> {formError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={handleSave} disabled={saving}
                className="bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? "Saving…" : "Create Rule"}
              </button>
              <button onClick={() => { setMode("none"); resetForms(); }}
                className="border border-[#222222] text-[#888888] hover:text-white hover:border-[#333333] text-sm px-5 py-2.5 rounded-lg transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0e0e0e] border border-[#1a1a1a] flex items-center justify-center">
            <Shield size={24} className="text-[#2a2a2a]" />
          </div>
          <div>
            <p className="text-[#888888] font-medium">No rules yet</p>
            <p className="text-[#444444] text-sm mt-1">Add a spend cap, rate limit, or injection filter to start protecting your AI usage</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => {
            const meta = TYPE_META[rule.type as RuleType] ?? { label: rule.type, color: "#666666", icon: Shield };
            const Icon = meta.icon;
            const pills = renderConfig(rule.type as RuleType, rule.config);
            return (
              <div key={rule.id}
                className={`bg-[#0e0e0e] border rounded-xl px-5 py-4 transition-all ${rule.isActive ? "border-[#1e1e1e]" : "border-[#161616] opacity-60"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg shrink-0" style={{ background: `${meta.color}14` }}>
                      <Icon size={14} style={{ color: meta.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#e8e8e8] text-sm truncate">{rule.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: `${meta.color}14`, color: meta.color }}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {pills.map(p => <ConfigPill key={p.label} label={p.label} value={p.value} />)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleRule(rule.id, !rule.isActive)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        rule.isActive
                          ? "border-[#00ff88]/30 text-[#00ff88] bg-[#00ff88]/5 hover:bg-[#00ff88]/10"
                          : "border-[#222222] text-[#555555] hover:text-[#888888]"
                      }`}>
                      {rule.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {rule.isActive ? "Active" : "Paused"}
                    </button>
                    <button onClick={() => deleteRule(rule.id)} disabled={deletingId === rule.id}
                      className="p-2 text-[#333333] hover:text-[#ff4444] hover:bg-[#ff4444]/8 rounded-lg transition-all disabled:opacity-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
