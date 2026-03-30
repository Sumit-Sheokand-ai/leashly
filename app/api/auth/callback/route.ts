import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/resend";

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
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const { id: supabaseId, email } = data.user;

  if (!email) {
    return NextResponse.redirect(`${origin}/login?error=no_email`);
  }

  // Create Prisma user on first login
  const existing = await prisma.user.findUnique({ where: { id: supabaseId } });

  await prisma.user.upsert({
    where: { id: supabaseId },
    update: {},
    create: { id: supabaseId, email },
  });

  if (!existing) {
    await sendWelcomeEmail(email).catch(() => {});
  }

  return NextResponse.redirect(`${origin}${next}`);
}
