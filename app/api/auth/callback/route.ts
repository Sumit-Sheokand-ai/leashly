import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("Auth callback error:", error?.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const { id: supabaseId, email } = data.user;

  if (!email) {
    return NextResponse.redirect(`${origin}/login?error=no_email`);
  }

  // Sync user to Prisma DB — wrapped in try/catch so auth still works even if DB is misconfigured
  try {
    const { prisma } = await import("@/lib/prisma");
    const existing = await prisma.user.findUnique({ where: { id: supabaseId } });
    await prisma.user.upsert({
      where: { id: supabaseId },
      update: {},
      create: { id: supabaseId, email },
    });

    if (!existing) {
      const { sendWelcomeEmail } = await import("@/lib/resend");
      await sendWelcomeEmail(email).catch((e) =>
        console.error("Welcome email failed:", e)
      );
    }
  } catch (dbError) {
    // Log but don't block auth — user can still access app even if DB sync fails
    console.error("DB sync error in auth callback:", dbError);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
