import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();

  const [{ data: rules }, { data: userData }] = await Promise.all([
    db.from("RoutingRule").select("*").eq("userId", user.id).order("priority", { ascending: true }),
    db.from("User").select("routingEnabled").eq("id", user.id).single(),
  ]);

  return NextResponse.json({ rules: rules ?? [], routingEnabled: userData?.routingEnabled ?? false });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { name, condition, targetModel, provider, priority } = await req.json();

  const { data, error } = await db.from("RoutingRule").insert({
    userId: user.id, name, condition: condition ?? {}, targetModel, provider, priority: priority ?? 0,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const body = await req.json();

  if (body.routingEnabled !== undefined) {
    await db.from("User").update({ routingEnabled: body.routingEnabled }).eq("id", user.id);
    return NextResponse.json({ ok: true });
  }

  if (!body.ruleId) return NextResponse.json({ error: "ruleId required" }, { status: 400 });
  const { ruleId, ...updates } = body;
  await db.from("RoutingRule").update(updates).eq("id", ruleId).eq("userId", user.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const ruleId = searchParams.get("ruleId");
  if (!ruleId) return NextResponse.json({ error: "ruleId required" }, { status: 400 });
  await db.from("RoutingRule").delete().eq("id", ruleId).eq("userId", user.id);
  return NextResponse.json({ ok: true });
}
