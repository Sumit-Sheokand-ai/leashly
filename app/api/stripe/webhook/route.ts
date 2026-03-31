import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: {
    type: string;
    data: {
      object: {
        customer?: string;
        status?: string;
        id?: string;
        customer_email?: string;
      };
    };
  };

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-12-18.acacia",
    });
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const customerId = sub.customer as string;
        const status = sub.status;
        const subscriptionId = sub.id as string;
        if (status === "active" || status === "trialing") {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { plan: "pro", stripeSubscriptionId: subscriptionId },
          });
        } else {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { plan: "free", stripeSubscriptionId: null },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await prisma.user.updateMany({
          where: { stripeCustomerId: sub.customer as string },
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
  }

  return NextResponse.json({ received: true });
}
