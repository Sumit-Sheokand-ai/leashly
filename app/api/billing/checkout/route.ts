import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-03-25.dahlia" });

const PRO_PRICE = "price_1TGu6iRMLubk1q1nilHfeySY"; // $9 CAD/mo

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseAdmin();
  const { data: userData } = await db
    .from("User").select("email, stripeCustomerId").eq("id", user.id).single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://leashly.dev";

  let customerId = userData?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userData?.email ?? user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db.from("User").update({ stripeCustomerId: customerId }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRO_PRICE, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?success=1`,
    cancel_url:  `${appUrl}/dashboard/billing?cancelled=1`,
    metadata:    { userId: user.id },
    subscription_data: { metadata: { userId: user.id } },
  });

  return NextResponse.json({ url: session.url });
}
