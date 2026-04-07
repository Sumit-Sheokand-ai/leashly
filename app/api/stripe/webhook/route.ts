import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import Stripe from "stripe";

// Required: set STRIPE_WEBHOOK_SECRET in Vercel env vars
// Get it from: Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret

export const runtime = "nodejs"; // needed for raw body access

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("[webhook] Missing stripe-signature header");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-03-25.dahlia" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = createSupabaseAdmin();

  console.log(`[webhook] Event received: ${event.type}`);

  try {
    switch (event.type) {

      // ── Subscription created / updated ──
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub    = event.data.object as Stripe.Subscription;
        const status = sub.status;
        const custId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        if (["active", "trialing"].includes(status)) {
          // Upgrade to Pro
          const { error } = await db
            .from("User")
            .update({
              plan:                 "pro",
              stripeSubscriptionId: sub.id,
            })
            .eq("stripeCustomerId", custId);

          if (error) console.error("[webhook] DB update error (upgrade):", error);
          else console.log(`[webhook] User upgraded to Pro — customer: ${custId}`);

        } else if (["canceled", "unpaid", "past_due", "incomplete_expired"].includes(status)) {
          // Downgrade to Free
          const { error } = await db
            .from("User")
            .update({
              plan:                 "free",
              stripeSubscriptionId: null,
            })
            .eq("stripeCustomerId", custId);

          if (error) console.error("[webhook] DB update error (downgrade):", error);
          else console.log(`[webhook] User downgraded to Free — customer: ${custId}`);
        }
        break;
      }

      // ── Subscription deleted / cancelled ──
      case "customer.subscription.deleted": {
        const sub    = event.data.object as Stripe.Subscription;
        const custId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        const { error } = await db
          .from("User")
          .update({ plan: "free", stripeSubscriptionId: null })
          .eq("stripeCustomerId", custId);

        if (error) console.error("[webhook] DB update error (delete):", error);
        else console.log(`[webhook] Subscription deleted — customer: ${custId}`);
        break;
      }

      // ── Checkout completed (backup sync for payment link flow) ──
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const custId  = typeof session.customer === "string" ? session.customer : session.customer?.id;

        if (custId && session.customer_email) {
          // Ensure stripeCustomerId is linked even if user paid via payment link
          const { error } = await db
            .from("User")
            .update({ stripeCustomerId: custId, plan: "pro" })
            .eq("email", session.customer_email);

          if (error) console.error("[webhook] DB update error (checkout):", error);
          else console.log(`[webhook] Checkout completed — email: ${session.customer_email}`);
        }

        // Also sync by subscription ID if present
        if (session.subscription && custId) {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          await db
            .from("User")
            .update({ stripeSubscriptionId: subId })
            .eq("stripeCustomerId", custId);
        }
        break;
      }

      // ── Invoice paid — ensure plan stays active ──
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const custId  = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

        if (custId) {
          await db
            .from("User")
            .update({ plan: "pro" })
            .eq("stripeCustomerId", custId)
            .neq("plan", "pro"); // only update if not already pro
        }
        break;
      }

      // ── Invoice payment failed — notify but don't immediately downgrade ──
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const custId  = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        console.warn(`[webhook] Payment failed — customer: ${custId}`);
        // Stripe will retry and send subscription.updated with past_due if it keeps failing
        break;
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    // Still return 200 so Stripe doesn't retry
  }

  return NextResponse.json({ received: true });
}
