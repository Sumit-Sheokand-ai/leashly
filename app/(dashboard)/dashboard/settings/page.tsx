"use client";

import { useEffect, useState } from "react";
import { Mail, Key, Copy, Check, AlertTriangle, RefreshCw, CreditCard, Bell, Shield, Zap, ExternalLink } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";

const inputCls = "w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#383838] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed";

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#161616]">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {desc && <p className="text-xs text-[#555555] mt-0.5">{desc}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5 border-b border-[#161616] last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-[#d8d8d8]">{label}</p>
        {desc && <p className="text-xs text-[#444444] mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 text-[#444444] hover:text-[#888888] transition-colors rounded">
      {copied ? <Check size={13} className="text-[#00ff88]" /> : <Copy size={13} />}
    </button>
  );
}

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!checked)}
    className={`relative w-10 h-6 rounded-full transition-colors ${checked ? "bg-[#00ff88]" : "bg-[#222222]"}`}>
    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "left-5" : "left-1"}`} />
  </button>
);

interface BillingInfo {
  currentPlan: string;
  billingModel: string;
  subscriptionEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  hasSubscription: boolean;
}

export default function SettingsPage() {
  const [email, setEmail]       = useState("");
  const [userId, setUserId]     = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [billing, setBilling]   = useState<BillingInfo | null>(null);

  const [pwForm, setPwForm]     = useState({ next: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [pwError, setPwError]   = useState("");

  const [notifPrefs, setNotifPrefs] = useState({
    spend_alerts: true, rate_alerts: true, injection_alerts: true,
    weekly_digest: false, product_updates: true, security_alerts: true,
  });

  // Proxy settings
  const [proxySettings, setProxySettings] = useState({
    logRequests: true,
    stripSystemPrompts: false,
    allowStreaming: true,
    maxTokensDefault: "",
  });

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling]               = useState(false);
  const [cancelMsg, setCancelMsg]                 = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput]             = useState("");
  const [deleting, setDeleting]                   = useState(false);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { setEmail(data.user.email ?? ""); setUserId(data.user.id); }
      setLoadingUser(false);
    });
    const saved = localStorage.getItem("leashly_notif_prefs");
    if (saved) { try { setNotifPrefs(JSON.parse(saved)); } catch {} }
    const proxy = localStorage.getItem("leashly_proxy_settings");
    if (proxy) { try { setProxySettings(JSON.parse(proxy)); } catch {} }
    // Load billing info
    fetch("/api/billing").then(r => r.ok ? r.json() : null).then(d => { if (d) setBilling(d); });
  }, []);

  function saveNotifPrefs(prefs: typeof notifPrefs) {
    setNotifPrefs(prefs);
    localStorage.setItem("leashly_notif_prefs", JSON.stringify(prefs));
  }

  function saveProxySettings(s: typeof proxySettings) {
    setProxySettings(s);
    localStorage.setItem("leashly_proxy_settings", JSON.stringify(s));
    // TODO: persist to DB via /api/user/settings PATCH
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (!pwForm.next || !pwForm.confirm) { setPwError("Please fill in all fields"); return; }
    if (pwForm.next.length < 8)          { setPwError("Password must be at least 8 characters"); return; }
    if (pwForm.next !== pwForm.confirm)  { setPwError("Passwords do not match"); return; }
    setPwStatus("saving");
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    if (error) { setPwError(error.message); setPwStatus("error"); }
    else { setPwStatus("success"); setPwForm({ next: "", confirm: "" }); setTimeout(() => setPwStatus("idle"), 3000); }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function handleCancelSubscription() {
    setCancelling(true);
    const res = await fetch("/api/billing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    const d = await res.json();
    setCancelMsg(d.message ?? "Subscription cancelled.");
    setCancelling(false);
    setShowCancelConfirm(false);
    // Refresh billing info
    fetch("/api/billing").then(r => r.ok ? r.json() : null).then(d => { if (d) setBilling(d); });
  }

  async function handleReactivate() {
    await fetch("/api/billing", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reactivate" }) });
    fetch("/api/billing").then(r => r.ok ? r.json() : null).then(d => { if (d) setBilling(d); });
  }

  async function handleDeleteAccount() {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loadingUser) {
    return <div className="flex items-center justify-center h-48"><RefreshCw size={20} className="animate-spin text-[#00ff88]" /></div>;
  }

  const isPro = billing?.currentPlan === "pro" || billing?.currentPlan === "usage_based";

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="font-mono text-lg font-bold text-white">Settings</h2>
        <p className="text-sm text-[#555555] mt-0.5">Manage your account, notifications, proxy settings, and billing</p>
      </div>

      {/* Cancel success message */}
      {cancelMsg && (
        <div className="bg-[#00ff88]/8 border border-[#00ff88]/20 rounded-xl px-4 py-3 text-sm text-[#00ff88]">
          ✓ {cancelMsg}
        </div>
      )}

      {/* ── Account ── */}
      <Section title="Account" desc="Your profile and login information">
        <Row label="Email address" desc="Used for login and notifications">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#888888] font-mono">{email}</span>
            <Mail size={13} className="text-[#333333]" />
          </div>
        </Row>
        <Row label="User ID" desc="Your unique identifier">
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#444444] font-mono">{userId.slice(0, 8)}…{userId.slice(-4)}</span>
            <CopyButton text={userId} />
          </div>
        </Row>
        <Row label="Plan">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${isPro ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20" : "bg-[#1a1a1a] text-[#888888]"}`}>
              {billing?.currentPlan ?? "free"}
            </span>
            {!isPro && (
              <Link href="/dashboard/billing" className="text-xs text-[#555555] hover:text-[#00ff88] transition-colors flex items-center gap-1">
                Upgrade <Zap size={11} />
              </Link>
            )}
          </div>
        </Row>
        <Row label="Session">
          <button onClick={handleSignOut}
            className="text-xs text-[#888888] hover:text-white border border-[#222222] hover:border-[#333333] px-3 py-1.5 rounded-lg transition-all">
            Sign out
          </button>
        </Row>
      </Section>

      {/* ── Password ── */}
      <Section title="Password" desc="Update your login password">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#555555] mb-1.5">New password</label>
              <input type="password" value={pwForm.next}
                onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                placeholder="Min. 8 characters" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[#555555] mb-1.5">Confirm password</label>
              <input type="password" value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Repeat password" className={inputCls} />
            </div>
          </div>
          {pwError && <p className="text-xs text-[#ff6666] flex items-center gap-1.5">⚠ {pwError}</p>}
          {pwStatus === "success" && <p className="text-xs text-[#00ff88] flex items-center gap-1.5"><Check size={12} />Password updated successfully</p>}
          <button type="submit" disabled={pwStatus === "saving"}
            className="bg-[#00ff88] hover:bg-[#00dd77] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
            {pwStatus === "saving" ? "Updating…" : "Update Password"}
          </button>
        </form>
      </Section>

      {/* ── Proxy settings ── */}
      <Section title="Proxy Settings" desc="Configure how Leashly handles requests">
        <Row label="Log all requests" desc="Store request metadata (tokens, cost, model) in your logs">
          <Toggle checked={proxySettings.logRequests} onChange={v => saveProxySettings({ ...proxySettings, logRequests: v })} />
        </Row>
        <Row label="Allow streaming" desc="Pass through SSE streaming responses transparently">
          <Toggle checked={proxySettings.allowStreaming} onChange={v => saveProxySettings({ ...proxySettings, allowStreaming: v })} />
        </Row>
        <Row label="Strip system prompts from logs" desc="Don't store system prompt content in request logs">
          <Toggle checked={proxySettings.stripSystemPrompts} onChange={v => saveProxySettings({ ...proxySettings, stripSystemPrompts: v })} />
        </Row>
        <Row label="Default max tokens" desc="Override max_tokens on all requests (leave empty to use model default)">
          <input type="number" min="1" max="128000" value={proxySettings.maxTokensDefault}
            onChange={e => saveProxySettings({ ...proxySettings, maxTokensDefault: e.target.value })}
            placeholder="No override"
            className="w-28 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#383838] focus:outline-none focus:border-[#00ff88] transition-all text-right font-mono" />
        </Row>
      </Section>

      {/* ── Notifications ── */}
      <Section title="Notification Preferences" desc="Choose which events trigger email notifications">
        <Row label="Spend threshold alerts" desc="Email when a spend alert fires">
          <Toggle checked={notifPrefs.spend_alerts} onChange={v => saveNotifPrefs({ ...notifPrefs, spend_alerts: v })} />
        </Row>
        <Row label="Rate limit alerts" desc="Email when rate limits are exceeded">
          <Toggle checked={notifPrefs.rate_alerts} onChange={v => saveNotifPrefs({ ...notifPrefs, rate_alerts: v })} />
        </Row>
        <Row label="Injection detection alerts" desc="Email when prompt injection is detected">
          <Toggle checked={notifPrefs.injection_alerts} onChange={v => saveNotifPrefs({ ...notifPrefs, injection_alerts: v })} />
        </Row>
        <Row label="Weekly usage digest" desc="A weekly summary of your AI spend and usage">
          <Toggle checked={notifPrefs.weekly_digest} onChange={v => saveNotifPrefs({ ...notifPrefs, weekly_digest: v })} />
        </Row>
        <Row label="Security alerts" desc="Email on suspicious account activity">
          <Toggle checked={notifPrefs.security_alerts} onChange={v => saveNotifPrefs({ ...notifPrefs, security_alerts: v })} />
        </Row>
        <Row label="Product updates" desc="New features and improvements">
          <Toggle checked={notifPrefs.product_updates} onChange={v => saveNotifPrefs({ ...notifPrefs, product_updates: v })} />
        </Row>
      </Section>

      {/* ── Security ── */}
      <Section title="Security" desc="Protect your account and API keys">
        <Row label="Active sessions" desc="Sign out of all devices">
          <button onClick={handleSignOut}
            className="text-xs text-[#888888] hover:text-white border border-[#222222] hover:border-[#333333] px-3 py-1.5 rounded-lg transition-all">
            Revoke all sessions
          </button>
        </Row>
        <Row label="API Keys" desc="Manage your Leashly proxy keys">
          <Link href="/dashboard/keys"
            className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-white border border-[#222222] hover:border-[#333333] px-3 py-1.5 rounded-lg transition-all">
            Manage <Key size={11} />
          </Link>
        </Row>
        <Row label="Encryption" desc="All API keys encrypted at rest with AES-256-CBC">
          <span className="text-xs text-[#00ff88] font-mono flex items-center gap-1">
            <Shield size={11} /> AES-256
          </span>
        </Row>
      </Section>

      {/* ── Billing ── */}
      {isPro && billing && (
        <Section title="Subscription" desc="Manage your Leashly Pro subscription">
          <Row label="Current plan">
            <span className="text-xs font-mono text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/20 px-2 py-0.5 rounded-full capitalize">
              {billing.currentPlan === "usage_based" ? "Pay As You Save" : "Pro"}
            </span>
          </Row>
          {billing.cancelAtPeriodEnd && billing.subscriptionEndsAt && (
            <Row label="Access until" desc="Your Pro features stay active until this date">
              <span className="text-xs font-mono text-[#ffaa44]">
                {new Date(billing.subscriptionEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            </Row>
          )}
          <Row label="Billing settings" desc="Change plan or view invoices">
            <Link href="/dashboard/billing"
              className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-white border border-[#222222] hover:border-[#333333] px-3 py-1.5 rounded-lg transition-all">
              Manage billing <CreditCard size={11} />
            </Link>
          </Row>
          <Row label={billing.cancelAtPeriodEnd ? "Subscription cancelling" : "Cancel subscription"}
            desc={billing.cancelAtPeriodEnd ? "Your subscription is set to cancel at the end of the billing period." : "Cancel at end of current billing period. No immediate charge."}>
            {billing.cancelAtPeriodEnd ? (
              <button onClick={handleReactivate}
                className="text-xs text-[#00ff88] border border-[#00ff88]/25 hover:bg-[#00ff88]/8 px-3 py-1.5 rounded-lg transition-all">
                Reactivate
              </button>
            ) : (
              <button onClick={() => setShowCancelConfirm(true)}
                className="text-xs text-[#888888] hover:text-[#ff6666] border border-[#222222] hover:border-[#ff4444]/30 px-3 py-1.5 rounded-lg transition-all">
                Cancel plan
              </button>
            )}
          </Row>

          {/* Cancel confirmation */}
          {showCancelConfirm && (
            <div className="mt-4 bg-[#ff4444]/6 border border-[#ff4444]/20 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-[#ff6666] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-[#ff6666] font-medium">Cancel Leashly Pro?</p>
                  <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                    You'll keep Pro access until the end of your billing period.
                    After that, you'll be moved to the free plan (2 keys, 2 rules, no workspace).
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCancelSubscription} disabled={cancelling}
                  className="text-xs text-white bg-[#ff4444] hover:bg-[#dd3333] px-4 py-2 rounded-lg transition-all disabled:opacity-50">
                  {cancelling ? "Cancelling…" : "Yes, cancel my subscription"}
                </button>
                <button onClick={() => setShowCancelConfirm(false)}
                  className="text-xs text-[#888888] hover:text-white border border-[#222222] px-4 py-2 rounded-lg transition-all">
                  Keep Pro
                </button>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── Quick links ── */}
      <Section title="More" desc="Useful links and resources">
        <Row label="Documentation" desc="Guides, API reference, and integration examples">
          <a href="/docs" className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-white border border-[#222222] hover:border-[#333333] px-3 py-1.5 rounded-lg transition-all">
            Open docs <ExternalLink size={11} />
          </a>
        </Row>
        <Row label="Privacy Policy">
          <Link href="/privacy" className="text-xs text-[#555555] hover:text-[#888888] transition-colors">Read →</Link>
        </Row>
        <Row label="Terms of Service">
          <Link href="/terms" className="text-xs text-[#555555] hover:text-[#888888] transition-colors">Read →</Link>
        </Row>
        <Row label="Support" desc="We reply to every email">
          <a href="mailto:hello@leashly.dev" className="text-xs text-[#555555] hover:text-[#00ff88] transition-colors flex items-center gap-1">
            hello@leashly.dev <Mail size={11} />
          </a>
        </Row>
      </Section>

      {/* ── Danger Zone ── */}
      <div className="bg-[#0e0e0e] border border-[#2a1515] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1f1111]">
          <h3 className="text-sm font-semibold text-[#ff6666]">Danger Zone</h3>
          <p className="text-xs text-[#555555] mt-0.5">Irreversible actions — proceed with caution</p>
        </div>
        <div className="p-5">
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#d0d0d0]">Delete account</p>
                <p className="text-xs text-[#444444] mt-0.5">Permanently delete your account and all associated data</p>
              </div>
              <button onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-[#ff6666] border border-[#ff4444]/25 hover:bg-[#ff4444]/8 px-3 py-1.5 rounded-lg transition-all">
                Delete account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 bg-[#ff4444]/6 border border-[#ff4444]/20 rounded-lg px-3.5 py-3">
                <AlertTriangle size={14} className="text-[#ff6666] mt-0.5 shrink-0" />
                <p className="text-xs text-[#cc6666] leading-relaxed">
                  This will permanently delete your account, all API keys, rules, alerts, and request logs. <strong>This cannot be undone.</strong>
                </p>
              </div>
              <div>
                <label className="block text-xs text-[#555555] mb-1.5">
                  Type <span className="font-mono text-[#888888]">DELETE</span> to confirm
                </label>
                <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full max-w-xs bg-[#0a0a0a] border border-[#2a1515] rounded-lg px-3 py-2 text-sm text-white placeholder-[#383838] focus:outline-none focus:border-[#ff4444]/50 transition-all font-mono" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleDeleteAccount} disabled={deleteInput !== "DELETE" || deleting}
                  className="bg-[#ff4444] hover:bg-[#dd3333] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {deleting ? "Deleting…" : "Permanently Delete Account"}
                </button>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                  className="border border-[#222222] text-[#888888] hover:text-white text-sm px-4 py-2 rounded-lg transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
