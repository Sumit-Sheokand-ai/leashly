import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import Stripe from "stripe";

const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "price_1TGu6iRMLubk1q1nilHfeySY"; // $9 CAD/mo

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-03-25.dahlia" });
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "https://leashly.dev";
  const db      = createSupabaseAdmin();

  try {
    const { data: dbUser } = await db.from("User").select("stripeCustomerId, email").eq("id", user.id).single();

    let customerId: string;
    if (dbUser?.stripeCustomerId) {
      customerId = dbUser.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: dbUser?.email ?? user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await db.from("User").update({ stripeCustomerId: customerId }).eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer:                customerId,
      payment_method_types:    ["card"],
      mode:                    "subscription",
      line_items:              [{ price: PRO_PRICE_ID, quantity: 1 }],
      success_url:             `${appUrl}/dashboard/billing?success=1`,
      cancel_url:              `${appUrl}/dashboard/billing?cancelled=1`,
      allow_promotion_codes:   true,
      billing_address_collection: "auto",
      subscription_data: {
        metadata: { userId: user.id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
