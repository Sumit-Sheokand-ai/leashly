import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_COOKIE_MAX_AGE } from "@/lib/supabase/config";

const INDEXNOW_KEY_FILENAME = process.env.NEXT_PUBLIC_INDEXNOW_KEY_FILENAME ?? "bb149e02314a49ef97036b68d89ffd79.txt";
const INDEXNOW_KEY_PATH = `/${INDEXNOW_KEY_FILENAME.replace(/^\/+/, "")}`;

const PUBLIC_PATHS = [
  "/", "/login", "/register",
  "/sitemap.xml", "/robots.txt",
  "/manifest.webmanifest", "/manifest.json",
  "/llms.txt",
  INDEXNOW_KEY_PATH,
];

const PUBLIC_PREFIXES = [
  "/api/auth", "/api/health", "/api/proxy", "/api/llms",
  "/_next", "/favicon", "/logo", "/og-image",
  "/privacy", "/terms", "/docs",
];

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // If URL has ?code= param, it's an OAuth callback — send to auth handler
  // This happens when Supabase redirects back to the site URL instead of the callback URL
  const code = searchParams.get("code");
  if (code && (pathname === "/" || pathname === "/login" || pathname === "/register")) {
    const callbackUrl = new URL("/api/auth/callback", req.url);
    callbackUrl.searchParams.set("code", code);
    const next = searchParams.get("next");
    if (next) callbackUrl.searchParams.set("next", next);
    return NextResponse.redirect(callbackUrl);
  }

  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()      { return req.cookies.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, { ...options, maxAge: SUPABASE_COOKIE_MAX_AGE })
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt|json|xml)).*)",
  ],
};
