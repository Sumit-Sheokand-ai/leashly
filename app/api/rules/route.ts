import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { PLAN_LIMITS } from "@/lib/plan-limits";

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
  const db = createSupabaseAdmin();

  // Check plan limit
  const { data: userData } = await db.from("User").select("plan").eq("id", user.id).single();
  const plan = (userData?.plan ?? "free") as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[plan]?.rules ?? PLAN_LIMITS.free.rules;

  const { count } = await db.from("Rule").select("id", { count: "exact", head: true }).eq("userId", user.id);

  if ((count ?? 0) >= limit) {
    return NextResponse.json({
      error: `Free plan allows ${PLAN_LIMITS.free.rules} rules. Upgrade to Pro for up to ${PLAN_LIMITS.pro.rules}.`,
      code: "LIMIT_REACHED",
      limit,
      plan,
    }, { status: 403 });
  }

  const { name, type, config } = await req.json();
  if (!name || !type || !config)
    return NextResponse.json({ error: "name, type, and config are required" }, { status: 400 });

  const { data, error } = await db.from("Rule")
    .insert({ userId: user.id, name, type, config: JSON.stringify(config) })
    .select("*").single();
  if (error) { console.error("Rules POST:", error); return NextResponse.json({ error: "Failed" }, { status: 500 }); }
  return NextResponse.json({ ...data, config: JSON.parse(data.config) }, { status: 201 });
}
