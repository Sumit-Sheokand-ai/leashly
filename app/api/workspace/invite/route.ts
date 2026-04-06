import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";
import { sendAlertEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { workspaceId, email, role = "developer" } = await req.json();

  // Verify requester is owner/admin
  const { data: membership } = await db
    .from("WorkspaceMember")
    .select("role, workspace:Workspace(name)")
    .eq("workspaceId", workspaceId)
    .eq("userId", user.id)
    .in("role", ["owner", "admin"])
    .single();

  if (!membership) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  // If user exists, add directly
  const { data: invitedUser } = await db.from("User").select("id").eq("email", email).single();
  if (invitedUser) {
    const { data: existing } = await db.from("WorkspaceMember").select("id").eq("workspaceId", workspaceId).eq("userId", invitedUser.id).single();
    if (existing) return NextResponse.json({ error: "User already in workspace" }, { status: 409 });
    await db.from("WorkspaceMember").insert({ workspaceId, userId: invitedUser.id, role });
  }

  // Send invite email via existing resend setup
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://leashly.dev"}/invite?workspace=${workspaceId}&email=${encodeURIComponent(email)}`;
  const wsName = (membership.workspace as { name: string })?.name ?? "a workspace";

  await sendAlertEmail(email, "workspace_invite",
    `You've been invited to join "${wsName}" on Leashly. Accept here: ${inviteLink}`
  ).catch(() => {});

  return NextResponse.json({ ok: true, message: `Invite sent to ${email}` });
}
