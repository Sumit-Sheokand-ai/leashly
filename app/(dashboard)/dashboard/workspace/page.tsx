"use client";

import { useCallback, useState } from "react";
import {
  Users, Plus, Crown, Code2, Eye, RefreshCw,
  Trash2, UserPlus, AlertTriangle, CheckCircle, Shield,
} from "lucide-react";
import { useDashboardData } from "@/lib/use-dashboard-data";
import { ProGate } from "@/components/layout/plan-gate";
import { PLAN_LIMITS, isPro } from "@/lib/plan-limits";

interface Member {
  id: string; role: string; joinedAt: string;
  user: { id: string; email: string; name?: string };
}
interface Workspace { id: string; name: string; plan: string; members: Member[] }
interface WorkspaceData { memberships: Array<{ workspace: Workspace }>; plan: string; userId: string; }

const ROLES = ["admin", "developer", "viewer"] as const;
type Role = typeof ROLES[number];

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; desc: string }> = {
  owner:     { icon: <Crown  size={13} className="text-[#ffaa44]" />, label: "Owner",     desc: "Full access, can manage billing" },
  admin:     { icon: <Shield size={13} className="text-[#888888]" />, label: "Admin",     desc: "Can invite members and manage keys" },
  developer: { icon: <Code2  size={13} className="text-[#4488ff]" />, label: "Developer", desc: "Can view logs and use proxy keys" },
  viewer:    { icon: <Eye    size={13} className="text-[#444444]" />, label: "Viewer",    desc: "Read-only dashboard access" },
};

const inputCls = "w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#383838] focus:outline-none focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/10 transition-all";

export default function WorkspacePage() {
  const fetcher = useCallback(async (): Promise<WorkspaceData> => {
    const [wsRes, uRes] = await Promise.all([
      fetch("/api/workspace"),
      fetch("/api/user/settings"),
    ]);
    const user = uRes.ok ? await uRes.json() : { plan: "free", id: "" };
    if (!wsRes.ok) return { memberships: [], plan: user.plan ?? "free", userId: user.id ?? "" };
    const memberships = await wsRes.json();
    return { memberships: Array.isArray(memberships) ? memberships : [], plan: user.plan ?? "free", userId: user.id ?? "" };
  }, []);

  const { data, loading, refresh } = useDashboardData<WorkspaceData>("dashboard:workspace", fetcher);

  const plan        = data?.plan ?? "free";
  const currentUserId = data?.userId ?? "";
  const workspace   = data?.memberships?.[0]?.workspace ?? null;
  const members     = workspace?.members ?? [];
  const maxMembers  = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.teamMembers ?? 0;
  const atMemberLimit = members.length >= maxMembers;

  // My role in this workspace
  const myMembership = members.find(m => m.user.id === currentUserId);
  const isOwner = myMembership?.role === "owner";

  const [creating, setCreating]               = useState(false);
  const [wsName, setWsName]                   = useState("");
  const [wsCreating, setWsCreating]           = useState(false);
  const [inviteInput, setInviteInput]         = useState("");   // email or userId
  const [inviteRole, setInviteRole]           = useState<Role>("developer");
  const [inviting, setInviting]               = useState(false);
  const [msg, setMsg]                         = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [deletingWs, setDeletingWs]           = useState(false);
  const [showDeleteWs, setShowDeleteWs]       = useState(false);
  const [removingId, setRemovingId]           = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId]   = useState<string | null>(null);

  function showMsg(text: string, type: "success" | "error") {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 5000);
  }

  // ── Free gate ──
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

  // ── Create workspace ──
  async function createWorkspace() {
    if (!wsName.trim()) return;
    setWsCreating(true);
    const res = await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: wsName }),
    });
    setWsCreating(false);
    if (res.ok) { setCreating(false); setWsName(""); refresh(); }
  }

  // ── Delete workspace ──
  async function deleteWorkspace() {
    if (!workspace) return;
    setDeletingWs(true);
    const res = await fetch("/api/workspace", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: workspace.id }),
    });
    const d = await res.json();
    setDeletingWs(false);
    setShowDeleteWs(false);
    if (res.ok) { refresh(); }
    else showMsg(d.error ?? "Failed to delete workspace.", "error");
  }

  // ── Invite member ──
  async function sendInvite() {
    if (!inviteInput.trim() || !workspace) return;
    if (atMemberLimit) { showMsg(`Workspace is full (${maxMembers} members max).`, "error"); return; }
    setInviting(true);

    // Detect if input looks like a UUID (userId) or email
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inviteInput.trim());
    const body = isUUID
      ? { workspaceId: workspace.id, userId: inviteInput.trim(), role: inviteRole }
      : { workspaceId: workspace.id, email: inviteInput.trim(), role: inviteRole };

    const res = await fetch("/api/workspace/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    showMsg(d.message ?? d.error ?? "Done", res.ok ? "success" : "error");
    setInviteInput("");
    setInviting(false);
    if (res.ok) refresh();
  }

  // ── Remove member ──
  async function removeMember(memberId: string) {
    if (!workspace) return;
    setRemovingId(memberId);
    const res = await fetch("/api/workspace/invite", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: workspace.id, memberId }),
    });
    const d = await res.json();
    setRemovingId(null);
    showMsg(d.message ?? d.error ?? "Done", res.ok ? "success" : "error");
    if (res.ok) refresh();
  }

  // ── Change role ──
  async function changeRole(memberId: string, role: Role) {
    if (!workspace) return;
    setChangingRoleId(memberId);
    const res = await fetch("/api/workspace/invite", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: workspace.id, memberId, role }),
    });
    const d = await res.json();
    setChangingRoleId(null);
    showMsg(d.message ?? d.error ?? "Done", res.ok ? "success" : "error");
    if (res.ok) refresh();
  }

  // ── No workspace yet ──
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

  // ── Create form ──
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

  // ── Main workspace view ──
  return (
    <div className="max-w-3xl space-y-5">

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#555555]">
            <div className="w-20 bg-[#1a1a1a] rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-[#00ff88] transition-all"
                style={{ width: `${Math.min((members.length / maxMembers) * 100, 100)}%` }} />
            </div>
            <span className="font-mono">{members.length}/{maxMembers}</span>
          </div>
          {/* Delete workspace — owner only */}
          {isOwner && !showDeleteWs && (
            <button onClick={() => setShowDeleteWs(true)}
              className="text-xs text-[#555555] hover:text-[#ff6666] border border-[#1a1a1a] hover:border-[#ff4444]/30 px-3 py-1.5 rounded-xl transition-all">
              Delete workspace
            </button>
          )}
        </div>
      </div>

      {/* Status message */}
      {msg && (
        <div className={`rounded-2xl border px-4 py-3 flex items-center gap-2 text-sm ${
          msg.type === "success" ? "bg-[#00ff88]/8 border-[#00ff88]/20 text-[#00ff88]" : "bg-[#ff4444]/8 border-[#ff4444]/20 text-[#ff4444]"
        }`}>
          {msg.type === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {msg.text}
        </div>
      )}

      {/* Delete workspace confirm */}
      {showDeleteWs && (
        <div className="bg-[#0e0e0e] border border-[#ff4444]/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-[#ff6666] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-[#ff6666] font-medium">Delete &quot;{workspace!.name}&quot;?</p>
              <p className="text-xs text-[#888888] mt-1">This will remove all members and cannot be undone.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={deleteWorkspace} disabled={deletingWs}
              className="text-xs text-white bg-[#ff4444] hover:bg-[#dd3333] px-4 py-2 rounded-xl transition-all disabled:opacity-50">
              {deletingWs ? "Deleting…" : "Yes, delete"}
            </button>
            <button onClick={() => setShowDeleteWs(false)}
              className="text-xs text-[#888888] hover:text-white border border-[#222222] px-4 py-2 rounded-xl transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Invite section — owner/admin only */}
      {(isOwner || myMembership?.role === "admin") && (
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
            <input className={inputCls}
              placeholder="Email or User ID (from their Settings page)"
              value={inviteInput} onChange={e => setInviteInput(e.target.value)}
              disabled={atMemberLimit}
              onKeyDown={e => e.key === "Enter" && sendInvite()} />
            <select
              value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)}
              className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#00ff88]/50 shrink-0">
              <option value="developer">Developer</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <button onClick={sendInvite} disabled={inviting || !inviteInput.trim() || atMemberLimit}
              className="flex items-center gap-1.5 bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-black rounded-xl transition-all shrink-0">
              {inviting ? <RefreshCw size={13} className="animate-spin" /> : <UserPlus size={14} />}
              {inviting ? "Adding…" : "Add"}
            </button>
          </div>

          <p className="text-xs text-[#444444]">
            Only users with an existing Leashly account can be added. Enter their email or User ID (visible in their Settings page).
          </p>

          {/* Role cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(ROLE_META).filter(([r]) => r !== "owner").map(([role, meta]) => (
              <div key={role} onClick={() => setInviteRole(role as Role)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  inviteRole === role ? "border-[#00ff88]/30 bg-[#00ff88]/5" : "border-[#1a1a1a] hover:border-[#2a2a2a]"
                }`}>
                <div className="flex items-center gap-1.5 mb-0.5">{meta.icon}<span className="text-xs font-medium text-white">{meta.label}</span></div>
                <p className="text-[10px] text-[#444444] leading-tight">{meta.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#888888]">Members</p>
        {members.map(m => (
          <div key={m.id} className="flex items-center justify-between bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl px-4 py-3 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                {(m.user.name ?? m.user.email)[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{m.user.name ?? m.user.email}</p>
                <p className="text-xs text-[#444444] truncate">{m.user.email} · joined {new Date(m.joinedAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Role — owner can change non-owner roles */}
              {isOwner && m.role !== "owner" ? (
                <select
                  value={m.role}
                  disabled={changingRoleId === m.id}
                  onChange={e => changeRole(m.id, e.target.value as Role)}
                  className="bg-[#111111] border border-[#222222] rounded-lg px-2 py-1 text-xs text-[#888888] outline-none focus:border-[#00ff88]/40 transition-all disabled:opacity-50">
                  {ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_META[r].label}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-1.5 rounded-full bg-[#1a1a1a] px-3 py-1">
                  {ROLE_META[m.role]?.icon}
                  <span className="text-xs text-[#888888] capitalize">{m.role}</span>
                </div>
              )}

              {/* Remove member — owner only, not self */}
              {isOwner && m.role !== "owner" && (
                <button
                  onClick={() => removeMember(m.id)}
                  disabled={removingId === m.id}
                  className="p-1.5 text-[#333333] hover:text-[#ff4444] hover:bg-[#ff4444]/8 rounded-lg transition-all disabled:opacity-50">
                  {removingId === m.id
                    ? <RefreshCw size={13} className="animate-spin" />
                    : <Trash2 size={13} />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
