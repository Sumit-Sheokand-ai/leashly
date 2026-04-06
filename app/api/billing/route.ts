import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";
import Stripe from "stripe";
import { sendCancellationEmail } from "@/lib/resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [{ data: userData }, { data: savings }] = await Promise.all([
    db.from("User").select("billingModel, plan, stripeSubscriptionId, stripeCustomerId, email").eq("id", user.id).single(),
    db.from("RequestLog").select("totalSavings").eq("userId", user.id).gte("timestamp", startOfMonth),
  ]);

  const monthlySavings = (savings ?? []).reduce((s, r) => s + (r.totalSavings ?? 0), 0);
  const usageBasedCost = monthlySavings * 0.1;

  // Get subscription end date from Stripe if exists
  let subscriptionEndsAt: string | null = null;
  let cancelAtPeriodEnd = false;
  if (userData?.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
      cancelAtPeriodEnd = sub.cancel_at_period_end;
      if (sub.current_period_end) {
        subscriptionEndsAt = new Date(sub.current_period_end * 1000).toISOString();
      }
    } catch {}
  }

  return NextResponse.json({
    billingModel:       userData?.billingModel ?? "flat",
    currentPlan:        userData?.plan ?? "free",
    monthlySavings,
    usageBasedCost,
    flatCost:           9,
    subscriptionEndsAt,
    cancelAtPeriodEnd,
    hasSubscription:    !!userData?.stripeSubscriptionId,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const body = await req.json();

  // Switch billing model
  if (body.billingModel) {
    if (!["flat", "usage_based"].includes(body.billingModel)) {
      return NextResponse.json({ error: "Invalid billing model" }, { status: 400 });
    }
    await db.from("User").update({ billingModel: body.billingModel }).eq("id", user.id);
    return NextResponse.json({ ok: true, billingModel: body.billingModel });
  }

  // Cancel subscription
  if (body.action === "cancel") {
    const { data: userData } = await db
      .from("User")
      .select("stripeSubscriptionId, email, plan")
      .eq("id", user.id)
      .single();

    if (!userData?.stripeSubscriptionId) {
      // No Stripe sub — just downgrade directly
      await db.from("User").update({ plan: "free" }).eq("id", user.id);
      await sendCancellationEmail(userData?.email ?? user.email, { immediateDowngrade: true });
      return NextResponse.json({ ok: true, message: "Subscription cancelled. You are now on the free plan." });
    }

    // Cancel at period end in Stripe
    await stripe.subscriptions.update(userData.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Send cancellation email
    const sub = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
    const endsAt = new Date(sub.current_period_end * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    await sendCancellationEmail(userData.email ?? user.email, { endsAt, immediateDowngrade: false });

    return NextResponse.json({ ok: true, message: `Subscription cancelled. Access continues until ${endsAt}.` });
  }

  // Reactivate cancelled subscription
  if (body.action === "reactivate") {
    const { data: userData } = await db
      .from("User")
      .select("stripeSubscriptionId")
      .eq("id", user.id)
      .single();

    if (userData?.stripeSubscriptionId) {
      await stripe.subscriptions.update(userData.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });
    }

    return NextResponse.json({ ok: true, message: "Subscription reactivated." });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
