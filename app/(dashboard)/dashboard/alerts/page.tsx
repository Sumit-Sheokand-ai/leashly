"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Bell, BellOff, DollarSign, Zap, Shield, Info } from "lucide-react";

interface AlertRow {
  id: string; type: string; threshold: number;
  notifyEmail: string; isActive: boolean; createdAt: string;
}

const ALERT_META = {
  spend_threshold:   { label: "Spend Threshold",    color: "#ffaa00", icon: DollarSign, unit: "$",  desc: "Triggers when cumulative daily spend exceeds this amount" },
  rate_exceeded:     { label: "Rate Exceeded",       color: "#00aaff", icon: Zap,        unit: "hits", desc: "Triggers when a rate limit is hit this many times in an hour" },
  injection_detected:{ label: "Injection Detected",  color: "#ff4444", icon: Shield,     unit: "detections", desc: "Triggers when this many injection attempts are detected in an hour" },
} as const;

type AlertType = keyof typeof ALERT_META;

const inputCls = "w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#383838] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/20 transition-all";
const selectCls = inputCls;

function AlertCard({ alert, onToggle, onDelete, deleting }: {
  alert: AlertRow;
  onToggle: (id: string, v: boolean) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const meta = ALERT_META[alert.type as AlertType] ?? { label: alert.type, color: "#666666", icon: Bell, unit: "", desc: "" };
  const Icon = meta.icon;
  const value = alert.type === "spend_threshold" ? `$${alert.threshold}` : `${alert.threshold} ${meta.unit}`;

  return (
    <div className={`bg-[#0e0e0e] border rounded-xl px-5 py-4 transition-all ${alert.isActive ? "border-[#1e1e1e]" : "border-[#161616] opacity-60"}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg shrink-0" style={{ background: `${meta.color}14` }}>
            <Icon size={14} style={{ color: meta.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: `${meta.color}14`, color: meta.color }}>
                {meta.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-sm text-[#e0e0e0]">
                Notify when <span className="font-mono text-white font-semibold">{value}</span>
              </span>
              <span className="text-[#333333] text-xs">→</span>
              <span className="text-sm text-[#666666]">{alert.notifyEmail}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onToggle(alert.id, !alert.isActive)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              alert.isActive
                ? "border-[#00ff88]/30 text-[#00ff88] bg-[#00ff88]/5 hover:bg-[#00ff88]/10"
                : "border-[#222222] text-[#555555] hover:text-[#888888]"
            }`}>
            {alert.isActive ? <Bell size={12} /> : <BellOff size={12} />}
            {alert.isActive ? "Active" : "Muted"}
          </button>
          <button onClick={() => onDelete(alert.id)} disabled={deleting}
            className="p-2 text-[#333333] hover:text-[#ff4444] hover:bg-[#ff4444]/8 rounded-lg transition-all disabled:opacity-50">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ type: AlertType; threshold: string; notifyEmail: string }>({
    type: "spend_threshold", threshold: "", notifyEmail: "",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadAlerts() {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) setAlerts(await res.json());
    } catch {}
    setLoading(false);
  }

  async function createAlert() {
    setFormError("");
    if (!form.threshold)    { setFormError("Please enter a threshold value"); return; }
    if (!form.notifyEmail)  { setFormError("Please enter a notification email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.notifyEmail)) { setFormError("Invalid email address"); return; }
    if (parseFloat(form.threshold) <= 0) { setFormError("Threshold must be greater than 0"); return; }

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
        loadAlerts();
      } else {
        const d = await res.json();
        setFormError(d.error ?? "Failed to create alert");
      }
    } catch { setFormError("Network error. Please try again."); }
    setSaving(false);
  }

  async function toggleAlert(id: string, isActive: boolean) {
    try {
      await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      setAlerts(a => a.map(alert => alert.id === id ? { ...alert, isActive } : alert));
    } catch {}
  }

  async function deleteAlert(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/alerts/${id}`, { method: "DELETE" });
      setAlerts(a => a.filter(alert => alert.id !== id));
    } catch {}
    setDeletingId(null);
  }

  useEffect(() => { loadAlerts(); }, []);

  const selectedMeta = ALERT_META[form.type];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">Alerts</h2>
          <p className="text-sm text-[#555555] mt-0.5">Get notified by email when spend, rate, or security thresholds are crossed</p>
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setFormError(""); }}
            className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00dd77] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Plus size={14} /> New Alert
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#0e0e0e] border border-[#222222] rounded-xl overflow-hidden">
          {/* Alert type selector */}
          <div className="flex border-b border-[#1a1a1a]">
            {(Object.keys(ALERT_META) as AlertType[]).map(t => {
              const { label, color, icon: Icon } = ALERT_META[t];
              return (
                <button key={t} onClick={() => { setForm(f => ({ ...f, type: t })); setFormError(""); }}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-all border-b-2 ${
                    form.type === t
                      ? "border-[#00ff88] text-white bg-[#111111]"
                      : "border-transparent text-[#555555] hover:text-[#888888]"
                  }`}>
                  <Icon size={12} style={{ color: form.type === t ? color : undefined }} />
                  {label}
                </button>
              );
            })}
            <div className="flex-1" />
            <button onClick={() => { setShowForm(false); setFormError(""); }}
              className="px-4 text-[#444444] hover:text-[#888888] text-xs transition-colors">
              ✕ Cancel
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Description */}
            <div className="flex items-start gap-2.5 bg-[#111111] border border-[#1a1a1a] rounded-lg px-3.5 py-3">
              <Info size={14} className="text-[#00ff88] mt-0.5 shrink-0" />
              <p className="text-xs text-[#666666] leading-relaxed">{selectedMeta.desc}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Threshold */}
              <div>
                <label className="block text-sm text-[#d0d0d0] mb-1.5 font-medium">
                  Threshold&nbsp;
                  <span className="text-[#444444] font-normal text-xs">
                    ({form.type === "spend_threshold" ? "USD" : "count"})
                  </span>
                </label>
                <div className="relative">
                  {form.type === "spend_threshold" && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555] text-sm">$</span>
                  )}
                  <input type="number" min="0" step={form.type === "spend_threshold" ? "0.01" : "1"}
                    value={form.threshold}
                    onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
                    placeholder={form.type === "spend_threshold" ? "10.00" : "5"}
                    className={`${inputCls} ${form.type === "spend_threshold" ? "pl-7" : ""}`} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-[#d0d0d0] mb-1.5 font-medium">Notify email</label>
                <input type="email"
                  value={form.notifyEmail}
                  onChange={e => setForm(f => ({ ...f, notifyEmail: e.target.value }))}
                  placeholder="you@example.com"
                  className={inputCls} />
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-[#ff4444]/8 border border-[#ff4444]/25 rounded-lg px-3.5 py-2.5 text-sm text-[#ff6666]">
                <span>⚠</span> {formError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={createAlert} disabled={saving}
                className="bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
                {saving ? "Saving…" : "Create Alert"}
              </button>
              <button onClick={() => { setShowForm(false); setFormError(""); }}
                className="border border-[#222222] text-[#888888] hover:text-white hover:border-[#333333] text-sm px-5 py-2.5 rounded-lg transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => (
            <div key={i} className="h-16 bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0e0e0e] border border-[#1a1a1a] flex items-center justify-center">
            <Bell size={24} className="text-[#2a2a2a]" />
          </div>
          <div>
            <p className="text-[#888888] font-medium">No alerts configured</p>
            <p className="text-[#444444] text-sm mt-1">Set up email notifications so you're never caught off guard by unexpected spend</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <AlertCard key={alert.id} alert={alert}
              onToggle={toggleAlert} onDelete={deleteAlert}
              deleting={deletingId === alert.id} />
          ))}
        </div>
      )}
    </div>
  );
}
