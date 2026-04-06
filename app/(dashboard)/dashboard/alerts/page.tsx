"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Bell, BellOff, DollarSign, Zap, Shield, Info, Lock } from "lucide-react";
import Link from "next/link";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { PlanBanner } from "@/components/layout/plan-gate";

interface AlertRow {
  id: string; type: string; threshold: number;
  notifyEmail: string; isActive: boolean; createdAt: string;
}

const ALERT_META = {
  spend_threshold:    { label: "Spend Threshold",  color: "#ffaa00", icon: DollarSign, unit: "$",          desc: "Triggers when cumulative daily spend exceeds this amount" },
  rate_exceeded:      { label: "Rate Exceeded",     color: "#00aaff", icon: Zap,        unit: "hits",       desc: "Triggers when a rate limit is hit this many times in an hour" },
  injection_detected: { label: "Injection Detected",color: "#ff4444", icon: Shield,     unit: "detections", desc: "Triggers when this many injection attempts are detected in an hour" },
} as const;

type AlertType = keyof typeof ALERT_META;

// Alert templates
const ALERT_TEMPLATES = [
  { label: "Daily $10 spend alert",  type: "spend_threshold" as AlertType, threshold: "10",  desc: "Get notified when you hit $10/day" },
  { label: "Daily $50 spend alert",  type: "spend_threshold" as AlertType, threshold: "50",  desc: "Good for moderate usage" },
  { label: "Injection alert",         type: "injection_detected" as AlertType, threshold: "1", desc: "Immediate alert on any injection attempt" },
  { label: "Rate limit alert",        type: "rate_exceeded" as AlertType, threshold: "10",    desc: "Alert when rate limits fire 10+ times" },
];

const inputCls = "w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#383838] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/20 transition-all";

export default function AlertsPage() {
  const [alerts, setAlerts]     = useState<AlertRow[]>([]);
  const [plan, setPlan]         = useState("free");
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [form, setForm]         = useState<{ type: AlertType; threshold: string; notifyEmail: string }>({
    type: "spend_threshold", threshold: "", notifyEmail: "",
  });
  const [formError, setFormError]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const limit   = PLAN_LIMITS[(plan as keyof typeof PLAN_LIMITS)]?.alertRules ?? PLAN_LIMITS.free.alertRules;
  const atLimit = alerts.length >= limit;

  async function load() {
    try {
      const [aRes, uRes] = await Promise.all([fetch("/api/alerts"), fetch("/api/user/settings")]);
      if (aRes.ok) setAlerts(await aRes.json());
      if (uRes.ok) { const u = await uRes.json(); setPlan(u.plan ?? "free"); }
    } catch {}
    setLoading(false);
  }

  function applyTemplate(t: typeof ALERT_TEMPLATES[0]) {
    setForm({ type: t.type, threshold: t.threshold, notifyEmail: "" });
    setShowTemplates(false);
    setShowForm(true);
  }

  async function createAlert() {
    setFormError("");
    if (!form.threshold)   { setFormError("Enter a threshold value"); return; }
    if (!form.notifyEmail) { setFormError("Enter a notification email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.notifyEmail)) { setFormError("Invalid email"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: form.type, threshold: parseFloat(form.threshold), notifyEmail: form.notifyEmail }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ type: "spend_threshold", threshold: "", notifyEmail: "" });
        load();
      } else {
        const d = await res.json();
        setFormError(d.code === "LIMIT_REACHED"
          ? `Free plan allows ${limit} alert rules. Upgrade to Pro for more.`
          : d.error ?? "Failed");
      }
    } catch { setFormError("Network error"); }
    setSaving(false);
  }

  async function toggleAlert(id: string, isActive: boolean) {
    await fetch(`/api/alerts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) });
    setAlerts(a => a.map(alert => alert.id === id ? { ...alert, isActive } : alert));
  }

  async function deleteAlert(id: string) {
    setDeletingId(id);
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    setAlerts(a => a.filter(alert => alert.id !== id));
    setDeletingId(null);
  }

  useEffect(() => { load(); }, []);

  const selectedMeta = ALERT_META[form.type];

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">Alerts</h2>
          <p className="text-sm text-[#555555] mt-0.5">Get notified when spend or security thresholds are crossed</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTemplates(v => !v)}
            className="border border-[#1a1a1a] hover:border-[#333333] text-[#888888] hover:text-white text-sm px-3 py-2 rounded-xl transition-all">
            Templates
          </button>
          {!showForm && (
            <button onClick={() => { if (!atLimit) { setShowForm(true); setFormError(""); } }}
              disabled={atLimit}
              className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00dd77] disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-semibold px-4 py-2 rounded-xl transition-all">
              {atLimit ? <Lock size={13} /> : <Plus size={13} />}
              {atLimit ? "Limit reached" : "New Alert"}
            </button>
          )}
        </div>
      </div>

      {/* Plan banner */}
      <PlanBanner
        feature="Alert Rules"
        description={plan === "free" ? `Free plan: ${limit} alerts max. Upgrade for up to ${PLAN_LIMITS.pro.alertRules}.` : `Pro plan: up to ${limit} alerts.`}
        current={alerts.length}
        limit={limit}
      />

      {/* Upgrade nudge */}
      {atLimit && plan === "free" && (
        <div className="rounded-2xl border border-[#ffaa44]/20 bg-[#ffaa44]/5 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-[#ffaa44]">You&apos;ve used all {limit} alert slots on the free plan.</p>
          <Link href="/dashboard/billing"
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#ffaa44]/15 text-[#ffaa44] border border-[#ffaa44]/30 px-3 py-1.5 rounded-xl hover:bg-[#ffaa44]/25 transition-all shrink-0">
            <Zap size={11} /> Upgrade
          </Link>
        </div>
      )}

      {/* Templates */}
      {showTemplates && (
        <div className="bg-[#0e0e0e] border border-[#222222] rounded-2xl p-4 space-y-2">
          <p className="text-xs text-[#555555] font-mono uppercase tracking-widest mb-3">Alert templates</p>
          <div className="grid grid-cols-2 gap-2">
            {ALERT_TEMPLATES.map(t => (
              <button key={t.label} onClick={() => applyTemplate(t)} disabled={atLimit}
                className="flex flex-col gap-0.5 text-left p-3 rounded-xl border border-[#1a1a1a] hover:border-[#333333] hover:bg-[#111111] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <p className="text-sm font-medium text-white">{t.label}</p>
                <p className="text-xs text-[#555555]">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-[#0e0e0e] border border-[#222222] rounded-2xl overflow-hidden">
          <div className="flex border-b border-[#1a1a1a]">
            {(Object.keys(ALERT_META) as AlertType[]).map(t => {
              const { label, color, icon: Icon } = ALERT_META[t];
              return (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-all border-b-2 ${
                    form.type === t ? "border-[#00ff88] text-white bg-[#111111]" : "border-transparent text-[#555555] hover:text-[#888888]"
                  }`}>
                  <Icon size={12} style={{ color: form.type === t ? color : undefined }} />{label}
                </button>
              );
            })}
            <div className="flex-1" />
            <button onClick={() => { setShowForm(false); setFormError(""); }} className="px-4 text-[#444444] hover:text-[#888888] text-xs">✕</button>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-2.5 bg-[#111111] border border-[#1a1a1a] rounded-xl px-3.5 py-3">
              <Info size={14} className="text-[#00ff88] mt-0.5 shrink-0" />
              <p className="text-xs text-[#666666] leading-relaxed">{selectedMeta.desc}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#d0d0d0] mb-1.5 font-medium">
                  Threshold <span className="text-[#444444] font-normal text-xs">({form.type === "spend_threshold" ? "USD" : "count"})</span>
                </label>
                <div className="relative">
                  {form.type === "spend_threshold" && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555] text-sm">$</span>}
                  <input type="number" min="0" step={form.type === "spend_threshold" ? "0.01" : "1"}
                    value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
                    placeholder={form.type === "spend_threshold" ? "10.00" : "5"}
                    className={`${inputCls} ${form.type === "spend_threshold" ? "pl-7" : ""}`} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#d0d0d0] mb-1.5 font-medium">Notify email</label>
                <input type="email" value={form.notifyEmail} onChange={e => setForm(f => ({ ...f, notifyEmail: e.target.value }))}
                  placeholder="you@example.com" className={inputCls} />
              </div>
            </div>
            {formError && (
              <div className="flex items-center gap-2 bg-[#ff4444]/8 border border-[#ff4444]/20 rounded-xl px-3 py-2.5 text-sm text-[#ff6666]">
                ⚠ {formError}
                {formError.includes("plan") && (
                  <Link href="/dashboard/billing" className="ml-auto text-[#ffaa44] underline text-xs shrink-0">Upgrade →</Link>
                )}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={createAlert} disabled={saving}
                className="bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50">
                {saving ? "Saving…" : "Create Alert"}
              </button>
              <button onClick={() => { setShowForm(false); setFormError(""); }}
                className="border border-[#222222] text-[#888888] hover:text-white text-sm px-5 py-2.5 rounded-xl transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert list */}
      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl animate-pulse" />)}</div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0e0e0e] border border-[#1a1a1a] flex items-center justify-center">
            <Bell size={24} className="text-[#2a2a2a]" />
          </div>
          <div>
            <p className="text-[#888888] font-medium">No alerts configured</p>
            <p className="text-[#444444] text-sm mt-1">Set up email notifications so you&apos;re never surprised by unexpected spend</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTemplates(true)}
              className="border border-[#1a1a1a] text-[#888888] hover:text-white text-sm px-4 py-2 rounded-xl transition-all">
              Use a template
            </button>
            <button onClick={() => { setShowForm(true); setFormError(""); }}
              className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00dd77] text-black text-sm font-semibold px-4 py-2 rounded-xl transition-all">
              <Plus size={14} /> New Alert
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => {
            const meta = ALERT_META[alert.type as AlertType] ?? { label: alert.type, color: "#666666", icon: Bell, unit: "" };
            const Icon = meta.icon;
            const value = alert.type === "spend_threshold" ? `$${alert.threshold}` : `${alert.threshold} ${meta.unit}`;
            return (
              <div key={alert.id} className={`bg-[#0e0e0e] border rounded-2xl px-5 py-4 transition-all ${alert.isActive ? "border-[#1e1e1e]" : "border-[#161616] opacity-60"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl shrink-0" style={{ background: `${meta.color}14` }}>
                      <Icon size={14} style={{ color: meta.color }} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${meta.color}14`, color: meta.color }}>{meta.label}</span>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-sm text-[#e0e0e0]">Notify when <span className="font-mono text-white font-semibold">{value}</span></span>
                        <span className="text-[#333333] text-xs">→</span>
                        <span className="text-sm text-[#666666]">{alert.notifyEmail}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleAlert(alert.id, !alert.isActive)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                        alert.isActive ? "border-[#00ff88]/30 text-[#00ff88] bg-[#00ff88]/5" : "border-[#222222] text-[#555555]"
                      }`}>
                      {alert.isActive ? <Bell size={12} /> : <BellOff size={12} />}
                      {alert.isActive ? "Active" : "Muted"}
                    </button>
                    <button onClick={() => deleteAlert(alert.id)} disabled={deletingId === alert.id}
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
