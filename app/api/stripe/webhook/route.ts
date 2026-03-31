import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Stripe webhook handler
// Verifies signature and updates user plan on subscription events
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;

  try {
    // Dynamic import to avoid issues if stripe isn't installed
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const subscriptionId = subscription.id as string;

        if (status === "active" || status === "trialing") {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { plan: "pro", stripeSubscriptionId: subscriptionId },
          });
        } else {
          // past_due, canceled, unpaid → downgrade to free
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { plan: "free", stripeSubscriptionId: null },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan: "free", stripeSubscriptionId: null },
        });
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId = session.customer as string;
        const customerEmail = session.customer_email as string;

        if (customerEmail) {
          await prisma.user.updateMany({
            where: { email: customerEmail },
            data: { stripeCustomerId: customerId, plan: "pro" },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Stripe webhook DB error:", err);
    // Return 200 so Stripe doesn't retry — DB errors shouldn't cause retries
  }

  return NextResponse.json({ received: true });
}

// Required: disable body parsing so we can verify the raw body signature
export const config = {
  api: { bodyParser: false },
};
