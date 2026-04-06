import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [{ data: userData }, { data: savings }] = await Promise.all([
    db.from("User").select("billingModel, plan").eq("id", user.id).single(),
    db.from("RequestLog").select("totalSavings").eq("userId", user.id).gte("timestamp", startOfMonth),
  ]);

  const monthlySavings = (savings ?? []).reduce((s, r) => s + (r.totalSavings ?? 0), 0);
  const usageBasedCost = monthlySavings * 0.1;

  return NextResponse.json({
    billingModel: userData?.billingModel ?? "flat",
    currentPlan: userData?.plan ?? "free",
    monthlySavings,
    usageBasedCost,
    flatCost: 9,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { billingModel } = await req.json();

  if (!["flat", "usage_based"].includes(billingModel)) {
    return NextResponse.json({ error: "Invalid billing model" }, { status: 400 });
  }

  await db.from("User").update({ billingModel }).eq("id", user.id);
  return NextResponse.json({ ok: true, billingModel });
}
