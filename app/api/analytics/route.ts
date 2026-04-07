import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const range = searchParams.get("range") ?? "7d";
  const days  = range === "30d" ? 30 : range === "90d" ? 90 : 7;
  const db    = createSupabaseAdmin();

  try {
    const since     = new Date(Date.now() - days * 86_400_000).toISOString();
    const prevSince = new Date(new Date(since).getTime() - days * 86_400_000).toISOString();

    const [{ data: logs }, { data: prevLogs }, { data: keys }] = await Promise.all([
      db.from("RequestLog")
        .select("timestamp,totalCost,totalSavings,routingSavings,cacheSavings,compressionSavings,model,provider,promptTokens,completionTokens,flagged,durationMs,apiKeyId,wasCacheHit,wasRouted,wasCompressed,statusCode")
        .eq("userId", user.id)
        .gte("timestamp", since)
        .order("timestamp", { ascending: true }),
      db.from("RequestLog")
        .select("totalCost,totalSavings")
        .eq("userId", user.id)
        .gte("timestamp", prevSince)
        .lt("timestamp", since),
      db.from("ApiKey")
        .select("id,name,provider")
        .eq("userId", user.id),
    ]);

    const safelogs = logs ?? [];
    const safePrev = prevLogs ?? [];
    const safeKeys = keys ?? [];

    // ── Daily breakdown ──
    const dayMap: Record<string, { spend: number; requests: number; saved: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(new Date(since).getTime() + i * 86_400_000);
      dayMap[d.toISOString().slice(0, 10)] = { spend: 0, requests: 0, saved: 0 };
    }
    for (const log of safelogs) {
      const key = new Date(log.timestamp).toISOString().slice(0, 10);
      if (dayMap[key]) {
        dayMap[key].spend    += log.totalCost    ?? 0;
        dayMap[key].requests += 1;
        dayMap[key].saved    += log.totalSavings ?? 0;
      }
    }
    const daily = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

    // ── By model ──
    const modelMap: Record<string, { cost: number; requests: number; tokens: number }> = {};
    for (const log of safelogs) {
      if (!modelMap[log.model]) modelMap[log.model] = { cost: 0, requests: 0, tokens: 0 };
      modelMap[log.model].cost     += log.totalCost ?? 0;
      modelMap[log.model].requests += 1;
      modelMap[log.model].tokens   += (log.promptTokens ?? 0) + (log.completionTokens ?? 0);
    }
    const byModel = Object.entries(modelMap)
      .map(([model, v]) => ({ model, ...v }))
      .sort((a, b) => b.cost - a.cost);

    // ── By provider ──
    const providerMap: Record<string, { cost: number; requests: number }> = {};
    for (const log of safelogs) {
      if (!providerMap[log.provider]) providerMap[log.provider] = { cost: 0, requests: 0 };
      providerMap[log.provider].cost     += log.totalCost ?? 0;
      providerMap[log.provider].requests += 1;
    }
    const byProvider = Object.entries(providerMap).map(([provider, v]) => ({ provider, ...v }));

    // ── By API key ──
    const keyMap: Record<string, { cost: number; requests: number; lastUsed: string | null; saved: number }> = {};
    for (const log of safelogs) {
      if (!keyMap[log.apiKeyId]) keyMap[log.apiKeyId] = { cost: 0, requests: 0, lastUsed: null, saved: 0 };
      keyMap[log.apiKeyId].cost     += log.totalCost    ?? 0;
      keyMap[log.apiKeyId].requests += 1;
      keyMap[log.apiKeyId].saved    += log.totalSavings ?? 0;
      if (!keyMap[log.apiKeyId].lastUsed || log.timestamp > keyMap[log.apiKeyId].lastUsed!)
        keyMap[log.apiKeyId].lastUsed = log.timestamp;
    }
    const byKey = safeKeys
      .map((k: { id: string; name: string; provider: string }) => ({
        ...k,
        cost:     keyMap[k.id]?.cost     ?? 0,
        requests: keyMap[k.id]?.requests ?? 0,
        saved:    keyMap[k.id]?.saved    ?? 0,
        lastUsed: keyMap[k.id]?.lastUsed ?? null,
      }))
      .sort((a, b) => b.cost - a.cost);

    // ── Totals ──
    const totalCost       = safelogs.reduce((s, l) => s + (l.totalCost    ?? 0), 0);
    const totalRequests   = safelogs.length;
    const totalTokens     = safelogs.reduce((s, l) => s + (l.promptTokens ?? 0) + (l.completionTokens ?? 0), 0);
    const flaggedCount    = safelogs.filter(l => l.flagged).length;
    const avgLatency      = totalRequests ? Math.round(safelogs.reduce((s, l) => s + l.durationMs, 0) / totalRequests) : 0;

    // ── Savings ──
    const totalSaved      = safelogs.reduce((s, l) => s + (l.totalSavings       ?? 0), 0);
    const routingSaved    = safelogs.reduce((s, l) => s + (l.routingSavings     ?? 0), 0);
    const cacheSaved      = safelogs.reduce((s, l) => s + (l.cacheSavings       ?? 0), 0);
    const compressionSaved = safelogs.reduce((s, l) => s + (l.compressionSavings ?? 0), 0);
    const cacheHits       = safelogs.filter(l => l.wasCacheHit).length;
    const cacheHitRate    = totalRequests ? Math.round((cacheHits / totalRequests) * 100) : 0;
    const routedCount     = safelogs.filter(l => l.wasRouted).length;
    const routingRate     = totalRequests ? Math.round((routedCount / totalRequests) * 100) : 0;

    // ── Period over period ──
    const prevCost       = safePrev.reduce((s, l) => s + (l.totalCost    ?? 0), 0);
    const prevSaved      = safePrev.reduce((s, l) => s + (l.totalSavings ?? 0), 0);
    const prevRequests   = safePrev.length;
    const costChange     = prevCost     > 0 ? Math.round(((totalCost     - prevCost)     / prevCost)     * 100) : null;
    const requestChange  = prevRequests > 0 ? Math.round(((totalRequests - prevRequests) / prevRequests) * 100) : null;
    const savingsChange  = prevSaved    > 0 ? Math.round(((totalSaved    - prevSaved)    / prevSaved)    * 100) : null;

    return NextResponse.json({
      range, days,
      totalCost, totalRequests, totalTokens, flaggedCount, avgLatency,
      totalSaved, routingSaved, cacheSaved, compressionSaved,
      cacheHitRate, routingRate,
      costChange, requestChange, savingsChange,
      prevCost, prevRequests,
      daily, byModel, byProvider, byKey,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
