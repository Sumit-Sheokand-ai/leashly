import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { data, error } = await db.from("Rule").select("*").eq("userId", user.id).order("createdAt", { ascending: false });
  if (error) { console.error("Rules GET:", error); return NextResponse.json([]); }
  return NextResponse.json((data ?? []).map((r: { config: string }) => ({ ...r, config: JSON.parse(r.config) })));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, type, config } = await req.json();
  if (!name || !type || !config)
    return NextResponse.json({ error: "name, type, and config are required" }, { status: 400 });
  const db = createSupabaseAdmin();
  const { data, error } = await db.from("Rule")
    .insert({ userId: user.id, name, type, config: JSON.stringify(config) })
    .select("*").single();
  if (error) { console.error("Rules POST:", error); return NextResponse.json({ error: "Failed" }, { status: 500 }); }
  return NextResponse.json({ ...data, config: JSON.parse(data.config) }, { status: 201 });
}
