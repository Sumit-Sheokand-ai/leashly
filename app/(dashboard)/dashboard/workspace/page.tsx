"use client";

import { useCallback, useState } from "react";
import { Users, Plus, Mail, Crown, Code2, Eye, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { useDashboardData } from "@/lib/use-dashboard-data";
import { ProGate } from "@/components/layout/plan-gate";
import { PLAN_LIMITS, isPro } from "@/lib/plan-limits";

interface Member { id: string; role: string; joinedAt: string; user: { id: string; email: string; name?: string } }
interface Workspace { id: string; name: string; plan: string; members: Member[] }
interface WorkspaceData { memberships: Array<{ workspace: Workspace }>; plan: string; }

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; desc: string }> = {
  owner:     { icon: <Crown size={13} className="text-[#ffaa44]" />,   label: "Owner",     desc: "Full access, can manage billing" },
  admin:     { icon: <Crown size={13} className="text-[#888888]" />,   label: "Admin",     desc: "Can invite members and manage keys" },
  developer: { icon: <Code2 size={13} className="text-[#4488ff]" />,  label: "Developer", desc: "Can view logs and use proxy keys" },
  viewer:    { icon: <Eye  size={13} className="text-[#444444]" />,   label: "Viewer",    desc: "Read-only dashboard access" },
};

const inputCls = "w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#383838] focus:outline-none focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/10 transition-all";

export default function WorkspacePage() {
  const fetcher = useCallback(async (): Promise<WorkspaceData> => {
    const [wsRes, uRes] = await Promise.all([
      fetch("/api/workspace"),
      fetch("/api/user/settings"),
    ]);
    const memberships = wsRes.ok ? await wsRes.json() : [];
    const user = uRes.ok ? await uRes.json() : { plan: "free" };
    // If 403 PRO_REQUIRED, return empty with plan info
    if (!wsRes.ok) return { memberships: [], plan: user.plan ?? "free" };
    return { memberships: Array.isArray(memberships) ? memberships : [], plan: user.plan ?? "free" };
  }, []);

  const { data, loading, invalidate } = useDashboardData<WorkspaceData>("dashboard:workspace", fetcher);

  const plan      = data?.plan ?? "free";
  const workspace = data?.memberships?.[0]?.workspace ?? null;
  const members   = workspace?.members ?? [];
  const maxMembers = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.teamMembers ?? 0;
  const atMemberLimit = members.length >= maxMembers;

  const [creating, setCreating]         = useState(false);
  const [wsName, setWsName]             = useState("");
  const [wsCreating, setWsCreating]     = useState(false);
  const [inviteEmail, setInviteEmail]   = useState("");
  const [inviteRole, setInviteRole]     = useState("developer");
  const [inviting, setInviting]         = useState(false);
  const [msg, setMsg]                   = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Free user gate
  if (!loading && !isPro(plan)) {
    return (
      <div className="max-w-2xl space-y-4">
        <div>
          <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2"><Users size={18} /> Workspace</h2>
          <p className="text-sm text-[#555555] mt-0.5">Invite your team and manage shared AI usage.</p>
        </div>
        <ProGate feature="Workspace">
          <div className="text-sm text-[#555555] max-w-sm mx-auto mb-2">
            Team features included: invite up to 10 members, shared spend tracking, role-based access.
          </div>
        </ProGate>
      </div>
    );
  }

  if (loading && !data) return (
    <div className="flex items-center justify-center h-48">
      <RefreshCw className="animate-spin text-[#00ff88]" size={20} />
    </div>
  );

  async function createWorkspace() {
    if (!wsName.trim()) return;
    setWsCreating(true);
    const res = await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: wsName }),
    });
    setWsCreating(false);
    if (res.ok) {
      setCreating(false);
      setWsName("");
      invalidate();
    }
  }

  async function sendInvite() {
    if (!inviteEmail || !workspace) return;
    if (atMemberLimit) {
      setMsg({ text: `Workspace is full (${maxMembers} members max on your plan).`, type: "error" });
      return;
    }
    setInviting(true);
    const res = await fetch("/api/workspace/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: workspace.id, email: inviteEmail, role: inviteRole }),
    });
    const d = await res.json();
    setMsg({ text: d.message ?? d.error ?? "Done", type: res.ok ? "success" : "error" });
    setInviteEmail("");
    setInviting(false);
    setTimeout(() => setMsg(null), 5000);
    if (res.ok) invalidate();
  }

  if (!workspace && !creating) {
    return (
      <div className="max-w-2xl">
        <div className="mb-6">
          <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2"><Users size={18} /> Workspace</h2>
          <p className="text-sm text-[#555555] mt-0.5">Invite your team and manage shared AI usage.</p>
        </div>
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#0e0e0e] p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#111111] border border-[#1a1a1a] flex items-center justify-center mx-auto">
            <Users size={24} className="text-[#333333]" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-white">No workspace yet</h3>
            <p className="text-sm text-[#555555] mt-1">Create a workspace to invite your team and share a unified AI budget.</p>
          </div>
          <button onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 bg-white hover:bg-zinc-200 px-5 py-2.5 text-sm font-semibold text-black rounded-xl transition-all">
            <Plus size={14} /> Create workspace
          </button>
        </div>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="max-w-md space-y-4">
        <h2 className="font-mono text-xl font-bold text-white">Create workspace</h2>
        <p className="text-sm text-[#555555]">Give your team a shared home on Leashly.</p>
        <input className={inputCls} placeholder="Acme AI Team" value={wsName}
          onChange={e => setWsName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && createWorkspace()} autoFocus />
        <div className="flex gap-3">
          <button onClick={createWorkspace} disabled={!wsName.trim() || wsCreating}
            className="flex-1 bg-white hover:bg-zinc-200 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-black rounded-xl transition-all">
            {wsCreating ? "Creating..." : "Create workspace"}
          </button>
          <button onClick={() => setCreating(false)}
            className="border border-[#222222] px-4 py-2.5 text-sm text-[#555555] hover:text-white rounded-xl transition-all">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2">
            <Users size={18} className="text-[#888888]" /> {workspace!.name}
          </h2>
          <p className="text-sm text-[#555555] mt-0.5">
            {members.length} / {maxMembers} members · <span className="capitalize">{workspace!.plan} plan</span>
          </p>
        </div>
        {/* Member count bar */}
        <div className="flex items-center gap-2 text-xs text-[#555555]">
          <div className="w-20 bg-[#1a1a1a] rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-[#00ff88] transition-all"
              style={{ width: `${Math.min((members.length / maxMembers) * 100, 100)}%` }} />
          </div>
          <span className="font-mono">{members.length}/{maxMembers}</span>
        </div>
      </div>

      {/* Invite section */}
      <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus size={15} className="text-[#00ff88]" />
          <p className="text-sm font-semibold text-white">Invite a team member</p>
          {atMemberLimit && (
            <span className="text-xs text-[#ffaa44] bg-[#ffaa44]/10 border border-[#ffaa44]/20 px-2 py-0.5 rounded-full">
              Team full ({maxMembers} max)
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <input className={inputCls} type="email" placeholder="teammate@company.com"
            value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            disabled={atMemberLimit}
            onKeyDown={e => e.key === "Enter" && sendInvite()} />
          <select
            value={inviteRole} onChange={e => setInviteRole(e.target.value)}
            className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#00ff88]/50 shrink-0">
            <option value="developer">Developer</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          <button onClick={sendInvite} disabled={inviting || !inviteEmail || atMemberLimit}
            className="flex items-center gap-1.5 bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-black rounded-xl transition-all shrink-0">
            <Mail size={14} /> {inviting ? "Sending..." : "Invite"}
          </button>
        </div>

        {/* Role descriptions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(ROLE_META).map(([role, meta]) => (
            <div key={role} onClick={() => setInviteRole(role)}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                inviteRole === role ? "border-[#00ff88]/30 bg-[#00ff88]/5" : "border-[#1a1a1a] hover:border-[#2a2a2a]"
              }`}>
              <div className="flex items-center gap-1.5 mb-0.5">{meta.icon}<span className="text-xs font-medium text-white">{meta.label}</span></div>
              <p className="text-[10px] text-[#444444] leading-tight">{meta.desc}</p>
            </div>
          ))}
        </div>

        {msg && (
          <p className={`text-xs flex items-center gap-1.5 ${msg.type === "success" ? "text-[#00ff88]" : "text-[#ff4444]"}`}>
            {msg.type === "success" ? "✓" : "⚠"} {msg.text}
          </p>
        )}
      </div>

      {/* Members list */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#888888]">Members</p>
        {members.map(m => (
          <div key={m.id} className="flex items-center justify-between bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                {(m.user.name ?? m.user.email)[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{m.user.name ?? m.user.email}</p>
                <p className="text-xs text-[#444444]">{m.user.email} · joined {new Date(m.joinedAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-[#1a1a1a] px-3 py-1">
                {ROLE_META[m.role]?.icon}
                <span className="text-xs text-[#888888] capitalize">{m.role}</span>
              </div>
              {m.role !== "owner" && (
                <button className="p-1.5 text-[#333333] hover:text-[#ff4444] hover:bg-[#ff4444]/8 rounded-lg transition-all">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
