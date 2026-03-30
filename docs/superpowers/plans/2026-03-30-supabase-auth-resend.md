# Supabase Auth + OAuth + Resend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace NextAuth.js + SQLite with Supabase Auth (email/password + Google + GitHub OAuth) and add Resend transactional emails (welcome + spend alerts).

**Architecture:** Supabase Auth handles all authentication (sessions, JWTs, OAuth). Prisma keeps all existing data queries but switches datasource from SQLite to Supabase Postgres. A single OAuth callback route (`/api/auth/callback`) exchanges the auth code and creates a Prisma `User` record on first login. Resend sends welcome emails on first signup and alert emails when spend thresholds are breached.

**Tech Stack:** `@supabase/ssr`, `@supabase/supabase-js`, `resend`, Prisma v5 (postgresql), Next.js 14 App Router

---

## File Map

**Create:**
- `lib/supabase/server.ts` — server-side Supabase client (cookies)
- `lib/supabase/client.ts` — browser-side Supabase client (singleton)
- `lib/resend.ts` — Resend client + `sendWelcomeEmail()` + `sendAlertEmail()`
- `app/api/auth/callback/route.ts` — OAuth code exchange + first-login user creation

**Modify:**
- `prisma/schema.prisma` — sqlite → postgresql, remove `password` from User
- `middleware.ts` — replace NextAuth `withAuth` with Supabase session check
- `app/(dashboard)/layout.tsx` — replace `getServerSession` with Supabase server client
- `app/(auth)/login/page.tsx` — replace `signIn("credentials")` with Supabase, add OAuth buttons
- `app/(auth)/register/page.tsx` — replace fetch to `/api/auth/register` with Supabase `signUp`
- `app/api/proxy/[...path]/route.ts` — update user lookup (proxyKey → userId still works, no change needed)
- `app/api/keys/route.ts` — replace session userId source
- `app/api/rules/route.ts` — replace session userId source
- `app/api/logs/route.ts` — replace session userId source
- `app/api/alerts/route.ts` — replace session userId source
- `app/api/stats/route.ts` — replace session userId source
- `app/api/seed/route.ts` — replace session userId source
- `.env.example` — add Supabase + Resend vars
- `package.json` — add `@supabase/ssr`, `resend`; remove `next-auth`, `bcryptjs`

**Delete:**
- `lib/auth.ts` — NextAuth options (replaced by Supabase)
- `lib/auth-rate-limit.ts` — Supabase handles brute-force protection
- `app/api/auth/[...nextauth]/route.ts` — NextAuth handler
- `app/api/auth/register/route.ts` — registration now handled by Supabase client
- `types/next-auth.d.ts` — NextAuth type augmentation no longer needed
- `components/layout/session-provider.tsx` — NextAuth SessionProvider no longer needed

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Supabase and Resend packages**

```bash
cd "C:/Users/sumit/OneDrive/Documents/GateAI/gateai-app"
npm install @supabase/ssr @supabase/supabase-js resend
```

- [ ] **Step 2: Remove NextAuth and bcryptjs**

```bash
npm uninstall next-auth bcryptjs @types/bcryptjs
```

- [ ] **Step 3: Verify package.json has correct deps**

Run: `cat package.json | grep -E "supabase|resend|next-auth|bcrypt"`
Expected: sees `@supabase/ssr`, `@supabase/supabase-js`, `resend` — no `next-auth` or `bcryptjs`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: swap next-auth/bcrypt for supabase/ssr + resend"
```

---

## Task 2: Update environment variables

**Files:**
- Modify: `.env.example`
- Create locally: `.env.local` (not committed)

- [ ] **Step 1: Update .env.example**

Replace the contents of `.env.example` with:

```bash
# ── Database (Supabase Postgres) ────────────────────────────────
# Get from: Supabase Dashboard → Settings → Database → Connection string (URI mode)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# ── Supabase ────────────────────────────────────────────────────
# Get from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# ── Resend ──────────────────────────────────────────────────────
# Get from: resend.com → API Keys
RESEND_API_KEY="re_your_api_key"
RESEND_FROM_EMAIL="noreply@leashly.dev"

# ── Encryption (keep existing value) ───────────────────────────
ENCRYPTION_KEY="your-encryption-key-here"

# ── App URL ─────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

- [ ] **Step 2: Add all vars to your local .env.local**

Fill in real values from:
- Supabase Dashboard → Settings → API (URL + anon key + service role key)
- Supabase Dashboard → Settings → Database → URI (DATABASE_URL)
- resend.com → API Keys (RESEND_API_KEY)

- [ ] **Step 3: Commit .env.example**

```bash
git add .env.example
git commit -m "env: add Supabase and Resend environment variables"
```

---

## Task 3: Update Prisma schema for Postgres

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update schema**

Replace the entire `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL")
}

model User {
  id        String   @id  // Supabase auth user UUID — set explicitly on create
  email     String   @unique
  createdAt DateTime @default(now())

  apiKeys       ApiKey[]
  rules         Rule[]
  requestLogs   RequestLog[]
  alerts        Alert[]
  notifications Notification[]
}

model ApiKey {
  id           String   @id @default(cuid())
  userId       String
  name         String
  keyHash      String
  encryptedKey String
  proxyKey     String   @unique
  provider     String
  createdAt    DateTime @default(now())
  isActive     Boolean  @default(true)

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  requestLogs RequestLog[]
}

model Rule {
  id        String   @id @default(cuid())
  userId    String
  name      String
  type      String
  config    String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model RequestLog {
  id               String   @id @default(cuid())
  userId           String
  apiKeyId         String
  timestamp        DateTime @default(now())
  provider         String
  model            String
  promptTokens     Int      @default(0)
  completionTokens Int      @default(0)
  totalCost        Float    @default(0)
  flagged          Boolean  @default(false)
  flagReason       String?
  durationMs       Int      @default(0)
  statusCode       Int      @default(200)

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  apiKey ApiKey @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)
}

model Alert {
  id          String   @id @default(cuid())
  userId      String
  type        String
  threshold   Float
  notifyEmail String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 2: Generate Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 3: Push schema to Supabase**

```bash
npx prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "prisma: switch to postgresql, remove password field from User"
```

---

## Task 4: Create Supabase client helpers

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`

- [ ] **Step 1: Create server client**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies will be set by middleware
          }
        },
      },
    }
  );
}
```

- [ ] **Step 2: Create browser client**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/server.ts lib/supabase/client.ts
git commit -m "feat: add Supabase server and browser client helpers"
```

---

## Task 5: Update middleware

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Replace middleware**

Replace entire `middleware.ts` with:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/register"];
const PUBLIC_PREFIXES = ["/api/auth", "/api/health", "/api/proxy", "/_next", "/favicon"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths and prefixes
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
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: replace NextAuth middleware with Supabase session middleware"
```

---

## Task 6: Create OAuth callback route

**Files:**
- Create: `app/api/auth/callback/route.ts`

This route handles the OAuth code exchange for Google/GitHub login AND creates the Prisma `User` record on first login.

- [ ] **Step 1: Create callback route**

Create `app/api/auth/callback/route.ts`:

```typescript
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

  const cookieStore = cookies();
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

  // Create Prisma user on first login (upsert = safe to call every time)
  const isNew = await prisma.user.findUnique({ where: { id: supabaseId } }) === null;

  await prisma.user.upsert({
    where: { id: supabaseId },
    update: {},
    create: { id: supabaseId, email },
  });

  // Send welcome email only on first signup
  if (isNew) {
    await sendWelcomeEmail(email).catch(() => {});
  }

  return NextResponse.redirect(`${origin}${next}`);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/callback/route.ts
git commit -m "feat: add OAuth callback route with first-login user creation"
```

---

## Task 7: Create Resend email helpers

**Files:**
- Create: `lib/resend.ts`

- [ ] **Step 1: Create Resend helper**

Create `lib/resend.ts`:

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@leashly.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://leashly.dev";

export async function sendWelcomeEmail(to: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Leashly",
    html: `
      <div style="font-family:monospace;background:#0a0a0a;color:#f0f0f0;padding:32px;max-width:520px;margin:0 auto;border-radius:12px;">
        <h1 style="color:#00ff88;font-size:24px;margin-bottom:8px;">Welcome to Leashly</h1>
        <p style="color:#999999;margin-bottom:24px;">Your AI cost control proxy is ready.</p>
        <p style="color:#f0f0f0;margin-bottom:8px;">Get started in 2 steps:</p>
        <ol style="color:#999999;padding-left:20px;line-height:2;">
          <li>Add your OpenAI / Anthropic / Gemini API key in the dashboard</li>
          <li>Copy your <code style="color:#00ff88;">lsh_xxx</code> proxy key and use it in your app</li>
        </ol>
        <a href="${APP_URL}/dashboard" style="display:inline-block;margin-top:24px;background:#00ff88;color:#000;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Open dashboard →
        </a>
        <p style="color:#444444;font-size:12px;margin-top:32px;">Leashly · Stop surprise AI bills</p>
      </div>
    `,
  });
}

export async function sendAlertEmail(to: string, type: string, message: string) {
  const subject =
    type === "spend_threshold"
      ? "Leashly: Spend threshold reached"
      : type === "injection_detected"
      ? "Leashly: Prompt injection detected"
      : "Leashly: Alert triggered";

  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: `
      <div style="font-family:monospace;background:#0a0a0a;color:#f0f0f0;padding:32px;max-width:520px;margin:0 auto;border-radius:12px;">
        <h1 style="color:#ff4444;font-size:20px;margin-bottom:8px;">⚠ Alert</h1>
        <p style="color:#f0f0f0;margin-bottom:24px;">${message}</p>
        <a href="${APP_URL}/dashboard/alerts" style="display:inline-block;background:#1f1f1f;color:#00ff88;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;border:1px solid #00ff88;">
          View in dashboard →
        </a>
        <p style="color:#444444;font-size:12px;margin-top:32px;">Leashly · Manage alerts in your dashboard</p>
      </div>
    `,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/resend.ts
git commit -m "feat: add Resend welcome and alert email helpers"
```

---

## Task 8: Update login page

**Files:**
- Modify: `app/(auth)/login/page.tsx`

- [ ] **Step 1: Replace login page**

Replace entire `app/(auth)/login/page.tsx` with:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Email and password are required"); return; }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    setOauthLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }

  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-8">
      <h1 className="font-mono text-xl font-bold text-white mb-2">Sign in</h1>
      <p className="text-[#666666] text-sm mb-6">Enter your credentials to access the dashboard</p>

      {/* OAuth buttons */}
      <div className="space-y-2 mb-6">
        <button
          onClick={() => handleOAuth("google")}
          disabled={!!oauthLoading}
          className="w-full flex items-center justify-center gap-3 bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#00ff88] text-white text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {oauthLoading === "google" ? "Redirecting..." : "Continue with Google"}
        </button>
        <button
          onClick={() => handleOAuth("github")}
          disabled={!!oauthLoading}
          className="w-full flex items-center justify-center gap-3 bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#00ff88] text-white text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
          {oauthLoading === "github" ? "Redirecting..." : "Continue with GitHub"}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-[#1f1f1f]" />
        <span className="text-xs text-[#444444] font-mono">or</span>
        <div className="flex-1 h-px bg-[#1f1f1f]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#f0f0f0] mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-colors" />
        </div>
        <div>
          <label className="block text-sm text-[#f0f0f0] mb-1.5">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-colors" />
        </div>

        {error && (
          <div className="bg-[#ff4444]/10 border border-[#ff4444]/30 rounded-lg px-3 py-2.5 text-sm text-[#ff4444]">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-[#00ff88] hover:bg-[#00cc6e] text-black font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-[#666666]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#00ff88] hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(auth)/login/page.tsx
git commit -m "feat: replace NextAuth login with Supabase + Google/GitHub OAuth buttons"
```

---

## Task 9: Update register page

**Files:**
- Modify: `app/(auth)/register/page.tsx`

- [ ] **Step 1: Replace register page**

Replace entire `app/(auth)/register/page.tsx` with:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password || !confirm) { setError("All fields are required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      router.push("/login?registered=1");
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    setOauthLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-8">
      <h1 className="font-mono text-xl font-bold text-white mb-2">Create account</h1>
      <p className="text-[#666666] text-sm mb-6">Start protecting your AI spend in minutes</p>

      {/* OAuth buttons */}
      <div className="space-y-2 mb-6">
        <button onClick={() => handleOAuth("google")} disabled={!!oauthLoading}
          className="w-full flex items-center justify-center gap-3 bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#00ff88] text-white text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50">
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {oauthLoading === "google" ? "Redirecting..." : "Sign up with Google"}
        </button>
        <button onClick={() => handleOAuth("github")} disabled={!!oauthLoading}
          className="w-full flex items-center justify-center gap-3 bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#00ff88] text-white text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
          {oauthLoading === "github" ? "Redirecting..." : "Sign up with GitHub"}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-[#1f1f1f]" />
        <span className="text-xs text-[#444444] font-mono">or</span>
        <div className="flex-1 h-px bg-[#1f1f1f]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#f0f0f0] mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-colors" />
        </div>
        <div>
          <label className="block text-sm text-[#f0f0f0] mb-1.5">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-colors" />
        </div>
        <div>
          <label className="block text-sm text-[#f0f0f0] mb-1.5">Confirm password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-colors" />
        </div>

        {error && (
          <div className="bg-[#ff4444]/10 border border-[#ff4444]/30 rounded-lg px-3 py-2.5 text-sm text-[#ff4444]">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-[#00ff88] hover:bg-[#00cc6e] text-black font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-[#666666]">
        Already have an account?{" "}
        <Link href="/login" className="text-[#00ff88] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(auth)/register/page.tsx
git commit -m "feat: replace register form with Supabase signUp + OAuth buttons"
```

---

## Task 10: Update dashboard layout and API route session helpers

**Files:**
- Modify: `app/(dashboard)/layout.tsx`
- Create: `lib/session.ts`

The dashboard layout and all API routes currently call `getServerSession(authOptions)`. We replace this with a single helper that reads the Supabase session.

- [ ] **Step 1: Create session helper**

Create `lib/session.ts`:

```typescript
import { createSupabaseServerClient } from "./supabase/server";
import { prisma } from "./prisma";

export async function getSessionUser(): Promise<{ id: string; email: string } | null> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return { id: user.id, email: user.email };
}
```

- [ ] **Step 2: Update dashboard layout**

Replace `app/(dashboard)/layout.tsx` with:

```typescript
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const flaggedCount = await prisma.requestLog.count({
    where: { userId: user.id, flagged: true, timestamp: { gte: twentyFourHoursAgo } },
  });

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar flaggedCount={flaggedCount} />
      <div className="flex-1 ml-[240px] flex flex-col min-h-screen">
        <Topbar title="Leashly" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/session.ts app/(dashboard)/layout.tsx
git commit -m "feat: add Supabase session helper, update dashboard layout"
```

---

## Task 11: Update all API routes to use Supabase session

Every API route that calls `getServerSession(authOptions)` must be updated to call `getSessionUser()`.

**Files to update** (same pattern in each):
- `app/api/keys/route.ts`
- `app/api/keys/[id]/route.ts`
- `app/api/rules/route.ts`
- `app/api/rules/[id]/route.ts`
- `app/api/logs/route.ts`
- `app/api/alerts/route.ts`
- `app/api/alerts/[id]/route.ts`
- `app/api/stats/route.ts`
- `app/api/seed/route.ts`

- [ ] **Step 1: Read each file and apply the same substitution**

In every file, replace the session block:
```typescript
// OLD — remove these two imports and this block:
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// ...
const session = await getServerSession(authOptions);
if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const userId = session.user.id;
```

With:
```typescript
// NEW — add this import and block:
import { getSessionUser } from "@/lib/session";
// ...
const user = await getSessionUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const userId = user.id;
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` with 0 errors

- [ ] **Step 3: Commit**

```bash
git add app/api/
git commit -m "feat: update all API routes to use Supabase session"
```

---

## Task 12: Wire alert emails into proxy route

**Files:**
- Modify: `app/api/proxy/[...path]/route.ts`

Currently alerts log to `Notification` in the DB. Add Resend email delivery.

- [ ] **Step 1: Import sendAlertEmail in proxy route**

At the top of `app/api/proxy/[...path]/route.ts`, add:
```typescript
import { sendAlertEmail } from "@/lib/resend";
```

- [ ] **Step 2: Update checkAlerts to send email**

Find the `checkAlerts` function. After `await prisma.notification.create(...)`, add:

```typescript
// Send email alert (non-blocking)
await sendAlertEmail(alert.notifyEmail, alert.type, message).catch(() => {});
```

- [ ] **Step 3: Commit**

```bash
git add app/api/proxy/
git commit -m "feat: send Resend alert email when spend/injection thresholds triggered"
```

---

## Task 13: Delete NextAuth files

**Files to delete:**
- `lib/auth.ts`
- `lib/auth-rate-limit.ts`
- `app/api/auth/[...nextauth]/route.ts`
- `app/api/auth/register/route.ts`
- `types/next-auth.d.ts`
- `components/layout/session-provider.tsx`

- [ ] **Step 1: Delete files**

```bash
cd "C:/Users/sumit/OneDrive/Documents/GateAI/gateai-app"
rm lib/auth.ts lib/auth-rate-limit.ts
rm app/api/auth/[...nextauth]/route.ts
rm app/api/auth/register/route.ts
rm types/next-auth.d.ts
rm components/layout/session-provider.tsx
```

- [ ] **Step 2: Verify build still passes**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove NextAuth files, session-provider, auth-rate-limit"
```

---

## Task 14: Supabase dashboard configuration checklist

These steps are done in the Supabase dashboard, not in code.

- [ ] **Step 1: Set Redirect URLs**

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-domain.com`
- Redirect URLs: add `https://your-domain.com/api/auth/callback`

- [ ] **Step 2: Configure Google OAuth**

In Supabase Dashboard → Authentication → Providers → Google:
- Enable Google
- Paste your Google Client ID and Secret (from Google Cloud Console)

- [ ] **Step 3: Configure GitHub OAuth**

In Supabase Dashboard → Authentication → Providers → GitHub:
- Enable GitHub
- Paste your GitHub Client ID and Secret (from GitHub → Settings → Developer apps)
- Set GitHub callback URL to: `https://<your-project>.supabase.co/auth/v1/callback`

- [ ] **Step 4: Configure custom SMTP (Resend) for auth emails**

In Supabase Dashboard → Project Settings → Auth → SMTP Settings:
- Enable custom SMTP
- Host: `smtp.resend.com`
- Port: `465`
- User: `resend`
- Password: your Resend API key
- Sender email: `noreply@leashly.dev`

- [ ] **Step 5: Final push**

```bash
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ Supabase Auth (email/password) — Tasks 8, 9, 10, 11
- ✅ Google OAuth — Tasks 8, 9, 14
- ✅ GitHub OAuth — Tasks 8, 9, 14
- ✅ Resend welcome email — Tasks 7, 6 (callback)
- ✅ Resend alert emails — Tasks 7, 12
- ✅ Prisma → Postgres — Task 3
- ✅ Middleware updated — Task 5
- ✅ Old NextAuth removed — Task 13

**Placeholder scan:** None found — all steps contain complete code.

**Type consistency:** `getSessionUser()` returns `{ id: string; email: string } | null` — used consistently across Tasks 10 and 11.
