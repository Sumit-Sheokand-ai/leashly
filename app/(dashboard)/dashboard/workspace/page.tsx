"use client";

import { useCallback, useState } from "react";
import { Users, Plus, Mail, Crown, Code2, Eye, RefreshCw } from "lucide-react";
import { useDashboardData } from "@/lib/use-dashboard-data";

interface Member { id: string; role: string; user: { id: string; email: string; name?: string } }
interface Workspace { id: string; name: string; plan: string; members: Member[] }
interface WorkspaceData { memberships: Array<{ workspace: Workspace }> }

const ROLE_ICONS: Record<string, React.ReactNode> = {
  owner:     <Crown size={13} className="text-[#ffaa44]" />,
  admin:     <Crown size={13} className="text-[#888888]" />,
  developer: <Code2 size={13} className="text-[#4488ff]" />,
  viewer:    <Eye  size={13} className="text-[#444444]" />,
};

const inputCls = "w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#383838] focus:outline-none focus:border-[#00ff88]/50 transition-all";

export default function WorkspacePage() {
  const fetcher = useCallback(async (): Promise<WorkspaceData> => {
    const res = await fetch("/api/workspace");
    return { memberships: res.ok ? await res.json() : [] };
  }, []);

  const { data, loading, invalidate } = useDashboardData<WorkspaceData>("dashboard:workspace", fetcher);

  const workspace = data?.memberships?.[0]?.workspace ?? null;
  const [creating, setCreating]     = useState(false);
  const [wsName, setWsName]         = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]  = useState("developer");
  const [inviting, setInviting]     = useState(false);
  const [msg, setMsg]               = useState("");

  async function createWorkspace() {
    if (!wsName.trim()) return;
    await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: wsName }) });
    setCreating(false);
    setWsName("");
    invalidate();
  }

  async function sendInvite() {
    if (!inviteEmail || !workspace) return;
    setInviting(true);
    const res = await fetch("/api/workspace/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: workspace.id, email: inviteEmail, role: inviteRole }) });
    const d = await res.json();
    setMsg(d.message ?? d.error ?? "Done");
    setInviteEmail("");
    setInviting(false);
    setTimeout(() => setMsg(""), 4000);
    invalidate();
  }

  if (loading && !data) return <div className="flex items-center justify-center h-48"><RefreshCw className="animate-spin text-[#00ff88]" size={20} /></div>;

  if (!workspace && !creating) {
    return (
      <div className="max-w-2xl py-20 text-center space-y-4">
        <Users size={40} className="text-[#222222] mx-auto" />
        <h2 className="font-mono text-xl font-bold text-white">No workspace yet</h2>
        <p className="text-sm text-[#555555]">Create a workspace to invite your team and share a unified AI budget.</p>
        <button onClick={() => setCreating(true)}
          className="rounded-xl bg-white hover:bg-zinc-200 px-5 py-2.5 text-sm font-semibold text-black transition-all">
          Create workspace
        </button>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="max-w-md py-20 space-y-4">
        <h2 className="font-mono text-xl font-bold text-white">Create workspace</h2>
        <input className={inputCls} placeholder="My Team" value={wsName} onChange={e => setWsName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && createWorkspace()} autoFocus />
        <div className="flex gap-3">
          <button onClick={createWorkspace} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 transition-all">Create</button>
          <button onClick={() => setCreating(false)} className="rounded-xl border border-[#222222] px-4 py-2 text-sm text-[#555555] hover:text-white transition-all">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2"><Users size={18} className="text-[#888888]" /> {workspace!.name}</h2>
        <p className="text-sm text-[#555555] mt-0.5">{workspace!.members.length} member{workspace!.members.length !== 1 ? "s" : ""} · <span className="capitalize">{workspace!.plan} plan</span></p>
      </div>

      {/* Invite */}
      <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold text-white">Invite member</p>
        <div className="flex gap-3">
          <input className={inputCls} type="email" placeholder="teammate@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
          <select className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm text-white outline-none">
            <option value="developer">Developer</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          <button onClick={sendInvite} disabled={inviting || !inviteEmail}
            className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-50 px-4 py-2 text-sm font-medium text-black transition-all shrink-0">
            <Mail size={14} />{inviting ? "..." : "Invite"}
          </button>
        </div>
        {msg && <p className="text-xs text-[#00ff88]">{msg}</p>}
      </div>

      {/* Members */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#888888]">Members</p>
        {workspace!.members.map(m => (
          <div key={m.id} className="flex items-center justify-between bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">{m.user.name ?? m.user.email}</p>
              <p className="text-xs text-[#444444]">{m.user.email}</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-[#1a1a1a] px-3 py-1">
              {ROLE_ICONS[m.role]}
              <span className="text-xs text-[#888888] capitalize">{m.role}</span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setCreating(true)} className="flex items-center gap-2 text-sm text-[#444444] hover:text-[#888888] transition-colors">
        <Plus size={14} /> Add another workspace
      </button>
    </div>
  );
}
