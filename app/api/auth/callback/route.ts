import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_COOKIE_MAX_AGE } from "@/lib/supabase/config";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code     = searchParams.get("code");
  const redirect = searchParams.get("redirect");
  const next     = redirect ?? searchParams.get("next") ?? "/dashboard";

  if (!code) return NextResponse.redirect(`${origin}/login?error=missing_code`);

  const cookieStore = await cookies();
  const supabase    = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()        { return cookieStore.getAll(); },
        setAll(toSet)   { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, { ...options, maxAge: SUPABASE_COOKIE_MAX_AGE })); },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error("[auth/callback] Error:", error?.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const { id: userId, email } = data.user;
  if (!email) return NextResponse.redirect(`${origin}/login?error=no_email`);

  let isNewUser = false;
  try {
    const { createSupabaseAdmin } = await import("@/lib/supabase/admin");
    const db = createSupabaseAdmin();

    // Check if user already exists
    const { data: existing } = await db.from("User").select("id").eq("id", userId).single();
    isNewUser = !existing;

    // Upsert user record
    await db.from("User").upsert(
      { id: userId, email },
      { onConflict: "id", ignoreDuplicates: true }
    );

    // Send welcome email to new users
    if (isNewUser) {
      const { sendWelcomeEmail } = await import("@/lib/resend");
      await sendWelcomeEmail(email).catch((e) => console.error("[auth/callback] Welcome email failed:", e));
    }
  } catch (err) {
    console.error("[auth/callback] DB sync error:", err);
  }

  // New users → onboarding (unless they came from a specific redirect)
  const destination = isNewUser && next === "/dashboard"
    ? `${origin}/dashboard/onboarding`
    : `${origin}${next}`;

  return NextResponse.redirect(destination);
}
