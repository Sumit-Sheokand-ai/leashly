import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: { type: string; data: { object: { customer?: string; status?: string; id?: string; customer_email?: string } } };
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Stripe webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = createSupabaseAdmin();
  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const status = sub.status;
        if (status === "active" || status === "trialing") {
          await db.from("User").update({ plan: "pro", stripeSubscriptionId: sub.id }).eq("stripeCustomerId", sub.customer as string);
        } else {
          await db.from("User").update({ plan: "free", stripeSubscriptionId: null }).eq("stripeCustomerId", sub.customer as string);
        }
        break;
      }
      case "customer.subscription.deleted":
        await db.from("User").update({ plan: "free", stripeSubscriptionId: null }).eq("stripeCustomerId", event.data.object.customer as string);
        break;
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.customer_email) {
          await db.from("User").update({ stripeCustomerId: session.customer as string, plan: "pro" }).eq("email", session.customer_email);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Stripe webhook DB error:", err);
  }
  return NextResponse.json({ received: true });
}
