import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { PLAN_LIMITS } from "@/lib/plan-limits";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { data } = await db.from("Alert").select("*").eq("userId", user.id).order("createdAt", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();

  // Get user plan
  const { data: userData } = await db.from("User").select("plan").eq("id", user.id).single();
  const plan = (userData?.plan ?? "free") as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[plan]?.alertRules ?? PLAN_LIMITS.free.alertRules;

  // Count existing alerts
  const { count } = await db.from("Alert")
    .select("id", { count: "exact", head: true })
    .eq("userId", user.id);

  if ((count ?? 0) >= limit) {
    return NextResponse.json({
      error: `Free plan allows ${PLAN_LIMITS.free.alertRules} alert rules. Upgrade to Pro for up to ${PLAN_LIMITS.pro.alertRules}.`,
      code: "LIMIT_REACHED",
      limit,
      plan,
    }, { status: 403 });
  }

  const { type, threshold, notifyEmail } = await req.json();
  if (!type || threshold === undefined || !notifyEmail)
    return NextResponse.json({ error: "type, threshold, and notifyEmail are required" }, { status: 400 });

  const { data, error } = await db.from("Alert")
    .insert({ userId: user.id, type, threshold: parseFloat(threshold), notifyEmail })
    .select("*").single();

  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
