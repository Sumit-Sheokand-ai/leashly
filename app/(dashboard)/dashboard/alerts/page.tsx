"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Bell, ToggleLeft, ToggleRight } from "lucide-react";

interface AlertRow {
  id: string; type: string; threshold: number;
  notifyEmail: string; isActive: boolean; createdAt: string;
}

const ALERT_LABELS: Record<string, string> = {
  spend_threshold: "Spend Threshold",
  rate_exceeded: "Rate Exceeded",
  injection_detected: "Injection Detected",
};
const ALERT_COLORS: Record<string, string> = {
  spend_threshold: "#ffaa00",
  rate_exceeded: "#00aaff",
  injection_detected: "#ff4444",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "spend_threshold", threshold: "", notifyEmail: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadAlerts() {
    const res = await fetch("/api/alerts");
    setAlerts(await res.json());
    setLoading(false);
  }

  async function createAlert() {
    setFormError("");
    if (!form.threshold || !form.notifyEmail) { setFormError("All fields are required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.notifyEmail)) { setFormError("Invalid email address"); return; }
    setSaving(true);
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: form.type, threshold: parseFloat(form.threshold), notifyEmail: form.notifyEmail }),
    });
    setSaving(false);
    if (res.ok) { setShowForm(false); setForm({ type: "spend_threshold", threshold: "", notifyEmail: "" }); loadAlerts(); }
    else { const d = await res.json(); setFormError(d.error ?? "Failed"); }
  }

  async function toggleAlert(id: string, isActive: boolean) {
    await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    setAlerts(a => a.map(alert => alert.id === id ? { ...alert, isActive } : alert));
  }

  async function deleteAlert(id: string) {
    if (!confirm("Delete this alert?")) return;
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    setAlerts(a => a.filter(alert => alert.id !== id));
  }

  useEffect(() => { loadAlerts(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">Alerts</h2>
          <p className="text-sm text-[#666666]">Get notified when thresholds are crossed</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00cc6e] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} /> New Alert
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 max-w-lg">
          <h3 className="font-mono text-sm font-bold text-white mb-4">New Alert</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#f0f0f0] mb-1.5">Alert type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff88] transition-colors">
                <option value="spend_threshold">Spend Threshold — notify when daily spend exceeds $X</option>
                <option value="rate_exceeded">Rate Exceeded — notify when rate limit is hit</option>
                <option value="injection_detected">Injection Detected — notify on any injection attempt</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#f0f0f0] mb-1.5">
                Threshold {form.type === "spend_threshold" ? "($)" : form.type === "injection_detected" ? "(# detections)" : "(# rate events)"}
              </label>
              <input type="number" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
                placeholder="10"
                className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#444444] focus:outline-none focus:border-[#00ff88] transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-[#f0f0f0] mb-1.5">Notify email</label>
              <input type="email" value={form.notifyEmail} onChange={e => setForm(f => ({ ...f, notifyEmail: e.target.value }))}
                placeholder="you@example.com"
                className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#444444] focus:outline-none focus:border-[#00ff88] transition-colors" />
              <p className="text-xs text-[#444444] mt-1">Notifications are logged in the system (email sending requires configuration).</p>
            </div>
            {formError && (
              <div className="bg-[#ff4444]/10 border border-[#ff4444]/30 rounded-lg px-3 py-2.5 text-sm text-[#ff4444]">{formError}</div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setShowForm(false); setFormError(""); }}
                className="border border-[#1f1f1f] text-[#f0f0f0] hover:border-[#666666] text-sm px-4 py-2 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={createAlert} disabled={saving}
                className="bg-[#00ff88] hover:bg-[#00cc6e] text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Create Alert"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-[#444444] text-sm">Loading...</div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <Bell size={40} className="text-[#333333]" />
          <p className="text-[#666666] text-sm">No alerts configured. Create your first alert above.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {alerts.map(alert => {
            const color = ALERT_COLORS[alert.type] ?? "#666666";
            return (
              <div key={alert.id} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 card-glow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: `${color}18` }}>
                      <Bell size={14} style={{ color }} />
                    </div>
                    <div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full mb-1 inline-block"
                        style={{ background: `${color}18`, color }}>
                        {ALERT_LABELS[alert.type] ?? alert.type}
                      </span>
                      <div className="text-sm text-white mt-1">
                        Threshold: <span className="font-mono text-[#f0f0f0]">
                          {alert.type === "spend_threshold" ? `$${alert.threshold}` : String(alert.threshold)}
                        </span>
                      </div>
                      <div className="text-xs text-[#666666] mt-0.5">Notify: {alert.notifyEmail}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleAlert(alert.id, !alert.isActive)}
                      className="flex items-center gap-1.5 text-xs transition-colors"
                      style={{ color: alert.isActive ? "#00ff88" : "#666666" }}>
                      {alert.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {alert.isActive ? "Active" : "Inactive"}
                    </button>
                    <button onClick={() => deleteAlert(alert.id)}
                      className="text-[#444444] hover:text-[#ff4444] p-1 transition-colors">
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
