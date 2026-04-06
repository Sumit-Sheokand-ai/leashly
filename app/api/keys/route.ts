import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { encrypt, generateProxyKey } from "@/lib/encryption";
import { PLAN_LIMITS, isPro } from "@/lib/plan-limits";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { data } = await db.from("ApiKey")
    .select("id,name,keyHash,proxyKey,provider,createdAt,isActive")
    .eq("userId", user.id).order("createdAt", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();

  // Get user plan
  const { data: userData } = await db.from("User").select("plan").eq("id", user.id).single();
  const plan = (userData?.plan ?? "free") as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[plan]?.apiKeys ?? PLAN_LIMITS.free.apiKeys;

  // Count existing keys
  const { count } = await db.from("ApiKey")
    .select("id", { count: "exact", head: true })
    .eq("userId", user.id).eq("isActive", true);

  if ((count ?? 0) >= limit) {
    return NextResponse.json({
      error: `Free plan allows ${PLAN_LIMITS.free.apiKeys} API keys. Upgrade to Pro for up to ${PLAN_LIMITS.pro.apiKeys}.`,
      code: "LIMIT_REACHED",
      limit,
      plan,
    }, { status: 403 });
  }

  const { name, provider, apiKey } = await req.json();
  if (!name || !provider || !apiKey)
    return NextResponse.json({ error: "name, provider, and apiKey are required" }, { status: 400 });

  const { data, error } = await db.from("ApiKey")
    .insert({ userId: user.id, name, provider, encryptedKey: encrypt(apiKey), keyHash: apiKey.slice(-4), proxyKey: generateProxyKey() })
    .select("id,name,keyHash,proxyKey,provider,createdAt,isActive").single();

  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
