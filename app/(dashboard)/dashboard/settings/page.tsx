"use client";

import { useEffect, useState } from "react";
import { User, Mail, Shield, Bell, Key, ExternalLink, Copy, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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

export default function SettingsPage() {
  const [email, setEmail]   = useState("");
  const [userId, setUserId] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  // Password change
  const [pwForm, setPwForm]     = useState({ current: "", next: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [pwError, setPwError]   = useState("");

  // Notification prefs (stored in localStorage for now)
  const [notifPrefs, setNotifPrefs] = useState({
    spend_alerts: true,
    rate_alerts: true,
    injection_alerts: true,
    weekly_digest: false,
  });

  // Danger zone
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput]             = useState("");
  const [deleting, setDeleting]                   = useState(false);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? "");
        setUserId(data.user.id);
      }
      setLoadingUser(false);
    });

    const saved = localStorage.getItem("leashly_notif_prefs");
    if (saved) {
      try { setNotifPrefs(JSON.parse(saved)); } catch {}
    }
  }, []);

  function saveNotifPrefs(prefs: typeof notifPrefs) {
    setNotifPrefs(prefs);
    localStorage.setItem("leashly_notif_prefs", JSON.stringify(prefs));
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (!pwForm.next || !pwForm.confirm) { setPwError("Please fill in all fields"); return; }
    if (pwForm.next.length < 8)          { setPwError("New password must be at least 8 characters"); return; }
    if (pwForm.next !== pwForm.confirm)  { setPwError("Passwords do not match"); return; }

    setPwStatus("saving");
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    if (error) {
      setPwError(error.message);
      setPwStatus("error");
    } else {
      setPwStatus("success");
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwStatus("idle"), 3000);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function handleDeleteAccount() {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    // Sign out — actual account deletion requires a server-side admin call
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors ${checked ? "bg-[#00ff88]" : "bg-[#222222]"}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "left-5" : "left-1"}`} />
    </button>
  );

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw size={20} className="animate-spin text-[#00ff88]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="font-mono text-lg font-bold text-white">Settings</h2>
        <p className="text-sm text-[#555555] mt-0.5">Manage your account, notifications, and security preferences</p>
      </div>

      {/* Account */}
      <Section title="Account" desc="Your profile and login information">
        <Row label="Email address" desc="Used for login and notifications">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#888888] font-mono">{email}</span>
            <Mail size={13} className="text-[#333333]" />
          </div>
        </Row>
        <Row label="User ID" desc="Your unique identifier in the system">
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#444444] font-mono">{userId.slice(0, 8)}…{userId.slice(-4)}</span>
            <CopyButton text={userId} />
          </div>
        </Row>
        <Row label="Session">
          <button onClick={handleSignOut}
            className="text-xs text-[#888888] hover:text-white border border-[#222222] hover:border-[#333333] px-3 py-1.5 rounded-lg transition-all">
            Sign out
          </button>
        </Row>
      </Section>

      {/* Password */}
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
              <label className="block text-xs text-[#555555] mb-1.5">Confirm new password</label>
              <input type="password" value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Repeat password" className={inputCls} />
            </div>
          </div>
          {pwError && (
            <p className="text-xs text-[#ff6666] flex items-center gap-1.5"><span>⚠</span>{pwError}</p>
          )}
          {pwStatus === "success" && (
            <p className="text-xs text-[#00ff88] flex items-center gap-1.5"><Check size={12} />Password updated successfully</p>
          )}
          <button type="submit" disabled={pwStatus === "saving"}
            className="bg-[#00ff88] hover:bg-[#00dd77] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
            {pwStatus === "saving" ? "Updating…" : "Update Password"}
          </button>
        </form>
      </Section>

      {/* Notifications */}
      <Section title="Notification Preferences" desc="Choose which events trigger email notifications">
        <Row label="Spend threshold alerts" desc="Email when a spend alert fires">
          <Toggle checked={notifPrefs.spend_alerts}
            onChange={v => saveNotifPrefs({ ...notifPrefs, spend_alerts: v })} />
        </Row>
        <Row label="Rate limit alerts" desc="Email when rate limits are exceeded">
          <Toggle checked={notifPrefs.rate_alerts}
            onChange={v => saveNotifPrefs({ ...notifPrefs, rate_alerts: v })} />
        </Row>
        <Row label="Injection detection alerts" desc="Email when prompt injection is detected">
          <Toggle checked={notifPrefs.injection_alerts}
            onChange={v => saveNotifPrefs({ ...notifPrefs, injection_alerts: v })} />
        </Row>
        <Row label="Weekly usage digest" desc="A weekly summary of your AI spend and usage">
          <Toggle checked={notifPrefs.weekly_digest}
            onChange={v => saveNotifPrefs({ ...notifPrefs, weekly_digest: v })} />
        </Row>
      </Section>

      {/* Security */}
      <Section title="Security" desc="Protect your account and API keys">
        <Row label="Two-factor authentication" desc="Add an extra layer of security to your login">
          <a href="https://supabase.com" target="_blank" rel="noopener"
            className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-white border border-[#222222] hover:border-[#333333] px-3 py-1.5 rounded-lg transition-all">
            Configure <ExternalLink size={11} />
          </a>
        </Row>
        <Row label="Active sessions" desc="View and revoke active login sessions">
          <button onClick={handleSignOut}
            className="text-xs text-[#888888] hover:text-white border border-[#222222] hover:border-[#333333] px-3 py-1.5 rounded-lg transition-all">
            Revoke all sessions
          </button>
        </Row>
        <Row label="API Keys" desc="Manage your Leashly proxy keys">
          <a href="/dashboard/keys"
            className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-white border border-[#222222] hover:border-[#333333] px-3 py-1.5 rounded-lg transition-all">
            Manage keys <Key size={11} />
          </a>
        </Row>
      </Section>

      {/* Danger Zone */}
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
                <label className="block text-xs text-[#555555] mb-1.5">Type <span className="font-mono text-[#888888]">DELETE</span> to confirm</label>
                <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full max-w-xs bg-[#0a0a0a] border border-[#2a1515] rounded-lg px-3 py-2 text-sm text-white placeholder-[#383838] focus:outline-none focus:border-[#ff4444]/50 transition-all font-mono" />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== "DELETE" || deleting}
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
