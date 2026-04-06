import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";
import { flushCache, getCacheStats } from "@/lib/leashly-cache";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();

  const [stats, { data: topEntries }, { data: userData }] = await Promise.all([
    getCacheStats(user.id),
    db.from("CacheEntry").select("id, model, hitCount, cost, createdAt, expiresAt")
      .eq("userId", user.id)
      .gt("expiresAt", new Date().toISOString())
      .order("hitCount", { ascending: false })
      .limit(10),
    db.from("User").select("cacheEnabled, cacheTtlHours, similarityThreshold").eq("id", user.id).single(),
  ]);

  return NextResponse.json({ stats, topEntries: topEntries ?? [], settings: userData });
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const deleted = await flushCache(user.id);
  return NextResponse.json({ deleted });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { cacheEnabled, cacheTtlHours, similarityThreshold } = await req.json();

  await db.from("User").update({
    ...(cacheEnabled !== undefined && { cacheEnabled }),
    ...(cacheTtlHours !== undefined && { cacheTtlHours: Number(cacheTtlHours) }),
    ...(similarityThreshold !== undefined && { similarityThreshold: Math.min(0.99, Math.max(0.85, Number(similarityThreshold))) }),
  }).eq("id", user.id);

  return NextResponse.json({ ok: true });
}
