import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { data } = await db
    .from("User")
    .select("id, email, plan, billingModel, cacheEnabled, routingEnabled, cacheTtlHours, similarityThreshold, stripeSubscriptionId")
    .eq("id", user.id)
    .single();

  // If user has a stripeSubscriptionId, they are pro regardless of plan field
  const effectivePlan = data?.stripeSubscriptionId
    ? (data.billingModel === "usage_based" ? "usage_based" : "pro")
    : (data?.plan ?? "free");

  return NextResponse.json({ ...(data ?? {}), plan: effectivePlan });
}
