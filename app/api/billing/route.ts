import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";
import Stripe from "stripe";
import { sendCancellationEmail } from "@/lib/resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-03-25.dahlia" });

function getPeriodEnd(sub: Stripe.Subscription): number | null {
  return sub.items?.data?.[0]?.current_period_end ?? null;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();

  const { data: userData } = await db
    .from("User")
    .select("plan, stripeSubscriptionId, stripeCustomerId, email")
    .eq("id", user.id)
    .single();

  let subscriptionEndsAt: string | null = null;
  let cancelAtPeriodEnd = false;
  if (userData?.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
      cancelAtPeriodEnd = sub.cancel_at_period_end;
      const periodEnd = getPeriodEnd(sub);
      if (periodEnd) subscriptionEndsAt = new Date(periodEnd * 1000).toISOString();
    } catch {}
  }

  return NextResponse.json({
    currentPlan:      userData?.plan ?? "free",
    subscriptionEndsAt,
    cancelAtPeriodEnd,
    hasSubscription:  !!userData?.stripeSubscriptionId,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const body = await req.json();

  if (body.action === "cancel") {
    const { data: userData } = await db
      .from("User").select("stripeSubscriptionId, email").eq("id", user.id).single();

    if (!userData?.stripeSubscriptionId) {
      await db.from("User").update({ plan: "free" }).eq("id", user.id);
      await sendCancellationEmail(userData?.email ?? user.email, { immediateDowngrade: true });
      return NextResponse.json({ ok: true, message: "Subscription cancelled. You are now on the free plan." });
    }

    await stripe.subscriptions.update(userData.stripeSubscriptionId, { cancel_at_period_end: true });
    const sub = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
    const periodEnd = getPeriodEnd(sub);
    const endsAt = periodEnd
      ? new Date(periodEnd * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "end of billing period";

    await sendCancellationEmail(userData.email ?? user.email, { endsAt, immediateDowngrade: false });
    return NextResponse.json({ ok: true, message: `Subscription cancelled. Access continues until ${endsAt}.` });
  }

  if (body.action === "reactivate") {
    const { data: userData } = await db
      .from("User").select("stripeSubscriptionId").eq("id", user.id).single();

    if (userData?.stripeSubscriptionId) {
      await stripe.subscriptions.update(userData.stripeSubscriptionId, { cancel_at_period_end: false });
    }
    return NextResponse.json({ ok: true, message: "Subscription reactivated." });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
