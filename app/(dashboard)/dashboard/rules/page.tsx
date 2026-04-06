"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Shield, Zap, DollarSign, ToggleLeft, ToggleRight, Info, Lock, Lightbulb } from "lucide-react";
import Link from "next/link";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { PlanBanner } from "@/components/layout/plan-gate";

interface Rule {
  id: string; name: string; type: "spend_cap" | "rate_limit" | "injection_filter";
  config: Record<string, unknown>; isActive: boolean; createdAt: string;
}

const TYPE_META = {
  spend_cap:        { label: "Spend Cap",       color: "#ffaa00", icon: DollarSign, desc: "Block or alert when spend exceeds a dollar threshold per day, week, or month." },
  rate_limit:       { label: "Rate Limit",       color: "#00aaff", icon: Zap,        desc: "Throttle requests per minute, hour, or day to prevent runaway usage." },
  injection_filter: { label: "Injection Filter", color: "#ff4444", icon: Shield,     desc: "Detect and block prompt injection & jailbreak attempts before they hit your LLM." },
} as const;

type RuleType = keyof typeof TYPE_META;

// Quick templates for each rule type
const RULE_TEMPLATES: Record<RuleType, Array<{ label: string; config: Record<string, unknown>; name: string }>> = {
  spend_cap: [
    { label: "$10/day cap",    name: "Daily $10 cap",    config: { dailyLimit: 10,  action: "block" } },
    { label: "$50/day cap",    name: "Daily $50 cap",    config: { dailyLimit: 50,  action: "block" } },
    { label: "$100/month cap", name: "Monthly $100 cap", config: { monthlyLimit: 100, action: "both" } },
    { label: "Alert at $5",    name: "Alert at $5/day",  config: { dailyLimit: 5,   action: "alert" } },
  ],
  rate_limit: [
    { label: "60 req/min",     name: "60 requests per minute", config: { requestsPerMinute: 60,   per: "account" } },
    { label: "1000 req/hour",  name: "1000 requests per hour", config: { requestsPerHour: 1000,   per: "account" } },
    { label: "10k req/day",    name: "10,000 requests per day",config: { requestsPerDay: 10000,    per: "account" } },
    { label: "Per IP: 10/min", name: "IP rate limit",          config: { requestsPerMinute: 10,   per: "ip" } },
  ],
  injection_filter: [
    { label: "Medium (recommended)", name: "Injection shield", config: { enabled: true, sensitivity: "medium" } },
    { label: "High (strict)",        name: "Strict injection shield", config: { enabled: true, sensitivity: "high" } },
    { label: "Low (minimal)",        name: "Basic injection shield",  config: { enabled: true, sensitivity: "low" } },
  ],
};

function ConfigPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-2.5 py-1">
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
    const pills = [{ label: "Sensitivity", value: config.sensitivity as string }];
    if (config.blockPatterns) pills.push({ label: "Custom patterns", value: "on" });
    if (config.logOnly)       pills.push({ label: "Mode", value: "log only" });
    return pills;
  }
  return [];
}

type FormMode = "none" | RuleType;

const inputCls = "w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#383838] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/20 transition-all";
const selectCls = inputCls;

export default function RulesPage() {
  const [rules, setRules]       = useState<Rule[]>([]);
  const [plan, setPlan]         = useState("free");
  const [loading, setLoading]   = useState(true);
  const [mode, setMode]         = useState<FormMode>("none");
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const limit   = PLAN_LIMITS[(plan as keyof typeof PLAN_LIMITS)]?.rules ?? PLAN_LIMITS.free.rules;
  const atLimit = rules.length >= limit;

  // Form state
  const [sc,  setSc]  = useState({ name: "", dailyLimit: "", weeklyLimit: "", monthlyLimit: "", action: "block" });
  const [rl,  setRl]  = useState({ name: "", requestsPerMinute: "", requestsPerHour: "", requestsPerDay: "", per: "account" });
  const [inj, setInj] = useState({ name: "", sensitivity: "medium", logOnly: false, blockOnError: true });

  async function loadRules() {
    try {
      const [rRes, uRes] = await Promise.all([fetch("/api/rules"), fetch("/api/user/settings")]);
      if (rRes.ok) setRules(await rRes.json());
      if (uRes.ok) { const u = await uRes.json(); setPlan(u.plan ?? "free"); }
    } catch {}
    setLoading(false);
  }

  function applyTemplate(type: RuleType, tpl: typeof RULE_TEMPLATES[RuleType][0]) {
    setMode(type);
    setShowTemplates(false);
    setFormError("");
    if (type === "spend_cap") {
      const c = tpl.config as { dailyLimit?: number; weeklyLimit?: number; monthlyLimit?: number; action?: string };
      setSc({ name: tpl.name, dailyLimit: String(c.dailyLimit ?? ""), weeklyLimit: String(c.weeklyLimit ?? ""), monthlyLimit: String(c.monthlyLimit ?? ""), action: c.action ?? "block" });
    } else if (type === "rate_limit") {
      const c = tpl.config as { requestsPerMinute?: number; requestsPerHour?: number; requestsPerDay?: number; per?: string };
      setRl({ name: tpl.name, requestsPerMinute: String(c.requestsPerMinute ?? ""), requestsPerHour: String(c.requestsPerHour ?? ""), requestsPerDay: String(c.requestsPerDay ?? ""), per: c.per ?? "account" });
    } else {
      const c = tpl.config as { sensitivity?: string };
      setInj(i => ({ ...i, name: tpl.name, sensitivity: c.sensitivity ?? "medium" }));
    }
  }

  async function saveRule(type: RuleType, config: Record<string, unknown>, name: string) {
    setFormError("");
    if (!name.trim()) { setFormError("Give this rule a name"); return; }
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
        setFormError(d.code === "LIMIT_REACHED"
          ? `Free plan allows ${limit} rules. Upgrade to Pro for up to ${PLAN_LIMITS.pro.rules}.`
          : d.error ?? "Failed to save rule");
      }
    } catch { setFormError("Network error. Please try again."); }
    setSaving(false);
  }

  function resetForms() {
    setSc({ name: "", dailyLimit: "", weeklyLimit: "", monthlyLimit: "", action: "block" });
    setRl({ name: "", requestsPerMinute: "", requestsPerHour: "", requestsPerDay: "", per: "account" });
    setInj({ name: "", sensitivity: "medium", logOnly: false, blockOnError: true });
    setFormError("");
  }

  async function toggleRule(id: string, isActive: boolean) {
    await fetch(`/api/rules/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) });
    setRules(r => r.map(rule => rule.id === id ? { ...rule, isActive } : rule));
  }

  async function deleteRule(id: string) {
    setDeletingId(id);
    await fetch(`/api/rules/${id}`, { method: "DELETE" });
    setRules(r => r.filter(rule => rule.id !== id));
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
      saveRule("injection_filter", {
        enabled: true,
        sensitivity: inj.sensitivity,
        logOnly: inj.logOnly,
        blockOnError: inj.blockOnError,
      }, inj.name);
    }
  }

  const formName = mode !== "none" ? (mode === "spend_cap" ? sc.name : mode === "rate_limit" ? rl.name : inj.name) : "";
  const setFormName = (v: string) => {
    if (mode === "spend_cap") setSc(s => ({ ...s, name: v }));
    else if (mode === "rate_limit") setRl(s => ({ ...s, name: v }));
    else if (mode === "injection_filter") setInj(s => ({ ...s, name: v }));
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">Rules</h2>
          <p className="text-sm text-[#555555] mt-0.5">Enforce spend caps, rate limits, and injection protection on every request</p>
        </div>
        {mode === "none" && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowTemplates(v => !v)}
              className="flex items-center gap-1.5 border border-[#1f1f1f] text-[#888888] hover:text-white hover:border-[#333333] text-xs px-3 py-2 rounded-xl transition-all">
              <Lightbulb size={12} /> Templates
            </button>
            <button
              onClick={() => { if (!atLimit) { setMode("spend_cap"); resetForms(); } }}
              disabled={atLimit}
              className="flex items-center gap-1.5 bg-[#00ff88] hover:bg-[#00dd77] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-semibold px-3 py-2 rounded-xl transition-all">
              {atLimit ? <Lock size={12} /> : <Plus size={12} />}
              {atLimit ? "Limit reached" : "Add Rule"}
            </button>
          </div>
        )}
      </div>

      {/* Plan banner */}
      <PlanBanner
        feature="Rules"
        description={plan === "free" ? `Free plan: ${limit} rules max. Upgrade for up to ${PLAN_LIMITS.pro.rules}.` : `Pro plan: up to ${limit} rules.`}
        current={rules.length}
        limit={limit}
      />

      {/* Upgrade nudge at limit */}
      {atLimit && plan === "free" && (
        <div className="rounded-2xl border border-[#ffaa44]/20 bg-[#ffaa44]/5 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-[#ffaa44]">
            You&apos;ve used all {limit} rules on the free plan. Upgrade to Pro for up to {PLAN_LIMITS.pro.rules} rules.
          </p>
          <Link href="/dashboard/billing"
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#ffaa44]/15 text-[#ffaa44] border border-[#ffaa44]/30 px-3 py-1.5 rounded-xl hover:bg-[#ffaa44]/25 transition-all shrink-0">
            <Zap size={11} /> Upgrade to Pro
          </Link>
        </div>
      )}

      {/* Templates */}
      {showTemplates && mode === "none" && (
        <div className="bg-[#0e0e0e] border border-[#222222] rounded-2xl p-5 space-y-4">
          <p className="text-xs text-[#555555] font-mono uppercase tracking-widest">Quick-start templates</p>
          {(Object.keys(RULE_TEMPLATES) as RuleType[]).map(type => {
            const meta = TYPE_META[type];
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <meta.icon size={12} style={{ color: meta.color }} />
                  <p className="text-xs font-medium text-[#888888]">{meta.label}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {RULE_TEMPLATES[type].map(tpl => (
                    <button key={tpl.label} onClick={() => applyTemplate(type, tpl)} disabled={atLimit}
                      className="text-left p-3 rounded-xl border border-[#1a1a1a] hover:border-[#333333] hover:bg-[#111111] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      <p className="text-sm font-medium text-white">{tpl.label}</p>
                      <p className="text-xs text-[#444444] mt-0.5">{tpl.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form */}
      {mode !== "none" && (
        <div className="bg-[#0e0e0e] border border-[#222222] rounded-2xl overflow-hidden">
          {/* Type tabs */}
          <div className="flex border-b border-[#1a1a1a]">
            {(Object.keys(TYPE_META) as RuleType[]).map(t => {
              const { label, color, icon: Icon } = TYPE_META[t];
              return (
                <button key={t} onClick={() => { setMode(t); setFormError(""); }}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-all border-b-2 ${
                    mode === t ? "border-[#00ff88] text-white bg-[#111111]" : "border-transparent text-[#555555] hover:text-[#888888]"
                  }`}>
                  <Icon size={12} style={{ color: mode === t ? color : undefined }} />
                  {label}
                </button>
              );
            })}
            <div className="flex-1" />
            <button onClick={() => { setMode("none"); resetForms(); }}
              className="px-4 text-[#444444] hover:text-[#888888] text-xs">✕ Cancel</button>
          </div>

          <div className="p-5 space-y-5">
            {/* Description */}
            <div className="flex items-start gap-2.5 bg-[#111111] border border-[#1a1a1a] rounded-xl px-3.5 py-3">
              <Info size={14} className="text-[#00ff88] mt-0.5 shrink-0" />
              <p className="text-xs text-[#666666] leading-relaxed">{TYPE_META[mode].desc}</p>
            </div>

            {/* Rule name */}
            <div>
              <label className="block text-sm text-[#d0d0d0] mb-1.5 font-medium">Rule name</label>
              <input value={formName} onChange={e => setFormName(e.target.value)}
                placeholder={mode === "spend_cap" ? "Monthly $100 cap" : mode === "rate_limit" ? "API rate limiter" : "Injection shield"}
                className={inputCls} />
            </div>

            {/* ── Spend cap fields ── */}
            {mode === "spend_cap" && (
              <>
                <div>
                  <label className="block text-sm text-[#d0d0d0] mb-3 font-medium">
                    Spend limits <span className="text-[#444444] font-normal text-xs">(leave blank to skip)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[["Daily ($)", "dailyLimit", "10"], ["Weekly ($)", "weeklyLimit", "50"], ["Monthly ($)", "monthlyLimit", "100"]].map(([label, key, ph]) => (
                      <div key={key}>
                        <label className="block text-xs text-[#555555] mb-1.5">{label}</label>
                        <input type="number" min="0" step="0.01"
                          value={sc[key as keyof typeof sc] as string}
                          onChange={e => setSc(s => ({ ...s, [key]: e.target.value }))}
                          placeholder={ph} className={inputCls} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#d0d0d0] mb-1.5 font-medium">When limit is hit</label>
                  <select value={sc.action} onChange={e => setSc(s => ({ ...s, action: e.target.value }))} className={selectCls}>
                    <option value="block">Block — return 429 error to the caller</option>
                    <option value="alert">Alert only — allow request, send email notification</option>
                    <option value="both">Block + Alert — block and send notification</option>
                  </select>
                  <p className="text-xs text-[#444444] mt-1.5">Block returns a 429 to your app. Alert sends a notification but allows the request through.</p>
                </div>
              </>
            )}

            {/* ── Rate limit fields ── */}
            {mode === "rate_limit" && (
              <>
                <div>
                  <label className="block text-sm text-[#d0d0d0] mb-3 font-medium">
                    Request limits <span className="text-[#444444] font-normal text-xs">(leave blank to skip)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[["Per minute", "requestsPerMinute", "60"], ["Per hour", "requestsPerHour", "1000"], ["Per day", "requestsPerDay", "10000"]].map(([label, key, ph]) => (
                      <div key={key}>
                        <label className="block text-xs text-[#555555] mb-1.5">{label}</label>
                        <input type="number" min="0"
                          value={rl[key as keyof typeof rl] as string}
                          onChange={e => setRl(s => ({ ...s, [key]: e.target.value }))}
                          placeholder={ph} className={inputCls} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#d0d0d0] mb-1.5 font-medium">Apply limit per</label>
                  <select value={rl.per} onChange={e => setRl(s => ({ ...s, per: e.target.value }))} className={selectCls}>
                    <option value="account">Account — shared across all keys and IPs</option>
                    <option value="api-key">API Key — tracked per individual key</option>
                    <option value="ip">IP Address — tracked per client IP</option>
                  </select>
                  <p className="text-xs text-[#444444] mt-1.5">Account limits are shared. Per-key and per-IP allow each caller their own quota.</p>
                </div>
              </>
            )}

            {/* ── Injection filter fields ── */}
            {mode === "injection_filter" && (
              <>
                <div>
                  <label className="block text-sm text-[#d0d0d0] mb-1.5 font-medium">Detection sensitivity</label>
                  <select value={inj.sensitivity} onChange={e => setInj(s => ({ ...s, sensitivity: e.target.value }))} className={selectCls}>
                    <option value="low">Low — obvious attacks only (fewer false positives)</option>
                    <option value="medium">Medium — balanced protection (recommended)</option>
                    <option value="high">High — strict mode (may flag edge-case prompts)</option>
                  </select>
                  <p className="text-xs text-[#444444] mt-1.5">Medium catches 95%+ of real attacks with minimal false positives. Start here.</p>
                </div>

                {/* Extra options */}
                <div className="space-y-3 pt-1 border-t border-[#1a1a1a]">
                  <p className="text-xs text-[#555555] uppercase tracking-widest font-mono pt-1">Advanced options</p>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <p className="text-sm text-[#d0d0d0]">Log only mode</p>
                      <p className="text-xs text-[#444444] mt-0.5">Log detections but allow requests through (useful for testing)</p>
                    </div>
                    <button
                      onClick={() => setInj(s => ({ ...s, logOnly: !s.logOnly }))}
                      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ml-4 ${inj.logOnly ? "bg-[#00ff88]" : "bg-[#2a2a2a]"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${inj.logOnly ? "left-5" : "left-0.5"}`} />
                    </button>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <p className="text-sm text-[#d0d0d0]">Block on filter error</p>
                      <p className="text-xs text-[#444444] mt-0.5">If the filter crashes, block the request instead of allowing it</p>
                    </div>
                    <button
                      onClick={() => setInj(s => ({ ...s, blockOnError: !s.blockOnError }))}
                      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ml-4 ${inj.blockOnError ? "bg-[#00ff88]" : "bg-[#2a2a2a]"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${inj.blockOnError ? "left-5" : "left-0.5"}`} />
                    </button>
                  </label>
                </div>
              </>
            )}

            {formError && (
              <div className="flex items-center gap-2 bg-[#ff4444]/8 border border-[#ff4444]/20 rounded-xl px-3.5 py-2.5 text-sm text-[#ff6666]">
                ⚠ {formError}
                {formError.includes("plan") && (
                  <Link href="/dashboard/billing" className="ml-auto text-[#ffaa44] underline text-xs shrink-0">Upgrade →</Link>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={handleSave} disabled={saving}
                className="bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50">
                {saving ? "Saving…" : "Create Rule"}
              </button>
              <button onClick={() => { setMode("none"); resetForms(); }}
                className="border border-[#222222] text-[#888888] hover:text-white text-sm px-5 py-2.5 rounded-xl transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl animate-pulse" />)}
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
          <div className="flex gap-2">
            <button onClick={() => { setShowTemplates(true); }}
              className="border border-[#1a1a1a] text-[#888888] hover:text-white text-sm px-4 py-2 rounded-xl transition-all">
              Use a template
            </button>
            <button onClick={() => { setMode("spend_cap"); resetForms(); }}
              className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00dd77] text-black text-sm font-semibold px-4 py-2 rounded-xl transition-all">
              <Plus size={14} /> Add Rule
            </button>
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
                className={`bg-[#0e0e0e] border rounded-2xl px-5 py-4 transition-all ${rule.isActive ? "border-[#1e1e1e]" : "border-[#161616] opacity-60"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl shrink-0" style={{ background: `${meta.color}14` }}>
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
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                        rule.isActive
                          ? "border-[#00ff88]/30 text-[#00ff88] bg-[#00ff88]/5"
                          : "border-[#222222] text-[#555555]"
                      }`}>
                      {rule.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                      {rule.isActive ? "Active" : "Paused"}
                    </button>
                    <button onClick={() => deleteRule(rule.id)} disabled={deletingId === rule.id}
                      className="p-2 text-[#333333] hover:text-[#ff4444] hover:bg-[#ff4444]/8 rounded-xl transition-all disabled:opacity-50">
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
