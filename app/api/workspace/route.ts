import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";
import { isPro } from "@/lib/plan-limits";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();

  // Check plan
  const { data: userData } = await db.from("User").select("plan").eq("id", user.id).single();
  if (!isPro(userData?.plan ?? "free")) {
    return NextResponse.json({ error: "Workspace is a Pro feature.", code: "PRO_REQUIRED" }, { status: 403 });
  }

  const { data: memberships } = await db
    .from("WorkspaceMember")
    .select("*, workspace:Workspace(*, members:WorkspaceMember(*, user:User(id, email)))")
    .eq("userId", user.id);

  return NextResponse.json(memberships ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();

  const { data: userData } = await db.from("User").select("plan").eq("id", user.id).single();
  if (!isPro(userData?.plan ?? "free")) {
    return NextResponse.json({ error: "Workspace is a Pro feature.", code: "PRO_REQUIRED" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const slug = `${name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${Date.now()}`;
  const { data: ws, error } = await db.from("Workspace").insert({ name, slug }).select("id, name, slug, plan").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("WorkspaceMember").insert({ workspaceId: ws.id, userId: user.id, role: "owner" });
  return NextResponse.json(ws, { status: 201 });
}
