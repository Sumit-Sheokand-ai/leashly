import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const range = searchParams.get("range") ?? "7d";
  const days = range === "30d" ? 30 : range === "90d" ? 90 : 7;
  const db = createSupabaseAdmin();

  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const prevSince = new Date(new Date(since).getTime() - days * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: logs }, { data: prevLogs }, { data: keys }] = await Promise.all([
      db.from("RequestLog")
        .select("timestamp,totalCost,model,provider,promptTokens,completionTokens,flagged,durationMs,apiKeyId")
        .eq("userId", user.id)
        .gte("timestamp", since)
        .order("timestamp", { ascending: true }),
      db.from("RequestLog")
        .select("totalCost")
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

    const dayMap: Record<string, { spend: number; requests: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(new Date(since).getTime() + i * 86400000);
      dayMap[d.toISOString().slice(0, 10)] = { spend: 0, requests: 0 };
    }
    for (const log of safelogs) {
      const key = new Date(log.timestamp).toISOString().slice(0, 10);
      if (dayMap[key]) { dayMap[key].spend += log.totalCost; dayMap[key].requests++; }
    }
    const daily = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

    const modelMap: Record<string, { cost: number; requests: number; tokens: number }> = {};
    for (const log of safelogs) {
      if (!modelMap[log.model]) modelMap[log.model] = { cost: 0, requests: 0, tokens: 0 };
      modelMap[log.model].cost += log.totalCost;
      modelMap[log.model].requests++;
      modelMap[log.model].tokens += (log.promptTokens ?? 0) + (log.completionTokens ?? 0);
    }
    const byModel = Object.entries(modelMap).map(([model, v]) => ({ model, ...v })).sort((a, b) => b.cost - a.cost);

    const providerMap: Record<string, { cost: number; requests: number }> = {};
    for (const log of safelogs) {
      if (!providerMap[log.provider]) providerMap[log.provider] = { cost: 0, requests: 0 };
      providerMap[log.provider].cost += log.totalCost;
      providerMap[log.provider].requests++;
    }
    const byProvider = Object.entries(providerMap).map(([provider, v]) => ({ provider, ...v }));

    const keyMap: Record<string, { cost: number; requests: number; lastUsed: string | null }> = {};
    for (const log of safelogs) {
      if (!keyMap[log.apiKeyId]) keyMap[log.apiKeyId] = { cost: 0, requests: 0, lastUsed: null };
      keyMap[log.apiKeyId].cost += log.totalCost;
      keyMap[log.apiKeyId].requests++;
      if (!keyMap[log.apiKeyId].lastUsed || log.timestamp > keyMap[log.apiKeyId].lastUsed!)
        keyMap[log.apiKeyId].lastUsed = log.timestamp;
    }
    const byKey = safeKeys.map((k: { id: string; name: string; provider: string }) => ({
      ...k,
      cost: keyMap[k.id]?.cost ?? 0,
      requests: keyMap[k.id]?.requests ?? 0,
      lastUsed: keyMap[k.id]?.lastUsed ?? null,
    })).sort((a, b) => b.cost - a.cost);

    const totalCost = safelogs.reduce((s, l) => s + l.totalCost, 0);
    const totalRequests = safelogs.length;
    const totalTokens = safelogs.reduce((s, l) => s + (l.promptTokens ?? 0) + (l.completionTokens ?? 0), 0);
    const flaggedCount = safelogs.filter(l => l.flagged).length;
    const avgLatency = safelogs.length ? Math.round(safelogs.reduce((s, l) => s + l.durationMs, 0) / safelogs.length) : 0;
    const prevCost = safePrev.reduce((s, l) => s + l.totalCost, 0);
    const prevRequests = safePrev.length;
    const costChange = prevCost > 0 ? Math.round(((totalCost - prevCost) / prevCost) * 100) : null;
    const requestChange = prevRequests > 0 ? Math.round(((totalRequests - prevRequests) / prevRequests) * 100) : null;

    return NextResponse.json({
      range, days, totalCost, totalRequests, totalTokens, flaggedCount, avgLatency,
      costChange, requestChange, prevCost, prevRequests,
      daily, byModel, byProvider, byKey,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Analytics error:", message);
    return NextResponse.json({ error: "Failed", detail: message }, { status: 500 });
  }
}
