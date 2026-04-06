import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();

  const { workspaceId, email, userId: inviteById, role = "developer" } = await req.json();
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  if (!email && !inviteById) return NextResponse.json({ error: "email or userId required" }, { status: 400 });

  // Verify requester is owner/admin
  const { data: membership } = await db
    .from("WorkspaceMember")
    .select("role, workspace:Workspace(name)")
    .eq("workspaceId", workspaceId)
    .eq("userId", user.id)
    .in("role", ["owner", "admin"])
    .single();

  if (!membership) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  // Find invited user — must already have an account
  let invitedUser: { id: string; email: string } | null = null;

  if (email) {
    const { data } = await db.from("User").select("id, email").eq("email", email).single();
    invitedUser = data;
  } else if (inviteById) {
    const { data } = await db.from("User").select("id, email").eq("id", inviteById).single();
    invitedUser = data;
  }

  // Reject if user doesn't have an account
  if (!invitedUser) {
    return NextResponse.json(
      { error: `No Leashly account found for ${email ?? inviteById}. They must sign up first.` },
      { status: 404 }
    );
  }

  // Check already a member
  const { data: existing } = await db
    .from("WorkspaceMember")
    .select("id")
    .eq("workspaceId", workspaceId)
    .eq("userId", invitedUser.id)
    .single();

  if (existing) return NextResponse.json({ error: "User is already in this workspace" }, { status: 409 });

  // Add directly — no invite link needed since they already have an account
  await db.from("WorkspaceMember").insert({ workspaceId, userId: invitedUser.id, role });

  return NextResponse.json({ ok: true, message: `${invitedUser.email} added to workspace as ${role}.` });
}

// PATCH — change member role (owner only)
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();

  const { workspaceId, memberId, role } = await req.json();
  if (!workspaceId || !memberId || !role) return NextResponse.json({ error: "workspaceId, memberId, role required" }, { status: 400 });
  if (!["admin", "developer", "viewer"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  // Must be owner
  const { data: ownerCheck } = await db
    .from("WorkspaceMember")
    .select("role")
    .eq("workspaceId", workspaceId)
    .eq("userId", user.id)
    .eq("role", "owner")
    .single();

  if (!ownerCheck) return NextResponse.json({ error: "Only the owner can change roles" }, { status: 403 });

  await db.from("WorkspaceMember").update({ role }).eq("id", memberId);
  return NextResponse.json({ ok: true, message: "Role updated." });
}

// DELETE member — owner only
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();

  const { workspaceId, memberId } = await req.json();
  if (!workspaceId || !memberId) return NextResponse.json({ error: "workspaceId and memberId required" }, { status: 400 });

  // Must be owner
  const { data: ownerCheck } = await db
    .from("WorkspaceMember")
    .select("role")
    .eq("workspaceId", workspaceId)
    .eq("userId", user.id)
    .eq("role", "owner")
    .single();

  if (!ownerCheck) return NextResponse.json({ error: "Only the owner can remove members" }, { status: 403 });

  // Cannot remove owner
  const { data: targetMember } = await db
    .from("WorkspaceMember")
    .select("role")
    .eq("id", memberId)
    .single();

  if (targetMember?.role === "owner") return NextResponse.json({ error: "Cannot remove the owner" }, { status: 400 });

  await db.from("WorkspaceMember").delete().eq("id", memberId);
  return NextResponse.json({ ok: true, message: "Member removed." });
}
