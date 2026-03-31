import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function parseTimestamp(value: Date | string) {
  const timestamp = value instanceof Date ? value : new Date(value);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const range = searchParams.get("range") ?? "7d";
  const days = range === "30d" ? 30 : range === "90d" ? 90 : 7;

  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const prevSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000);

    const [logs, prevLogs, keys] = await Promise.all([
      prisma.requestLog.findMany({
        where: { userId: user.id, timestamp: { gte: since } },
        select: {
          timestamp: true, totalCost: true, model: true, provider: true,
          promptTokens: true, completionTokens: true, flagged: true,
          durationMs: true, apiKeyId: true,
        },
        orderBy: { timestamp: "asc" },
      }),
      prisma.requestLog.aggregate({
        where: { userId: user.id, timestamp: { gte: prevSince, lt: since } },
        _sum: { totalCost: true },
        _count: { _all: true },
      }),
      prisma.apiKey.findMany({
        where: { userId: user.id },
        select: { id: true, name: true, provider: true },
      }),
    ]);

    const validLogs = logs.flatMap((log) => {
      const timestamp = parseTimestamp(log.timestamp);
      return timestamp ? [{ ...log, timestamp }] : [];
    });

    // Daily spend & requests
    const dayMap: Record<string, { spend: number; requests: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = { spend: 0, requests: 0 };
    }
    for (const log of validLogs) {
      const key = log.timestamp.toISOString().slice(0, 10);
      if (dayMap[key]) { dayMap[key].spend += log.totalCost; dayMap[key].requests++; }
    }
    const daily = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

    // Model breakdown
    const modelMap: Record<string, { cost: number; requests: number; tokens: number }> = {};
    for (const log of validLogs) {
      if (!modelMap[log.model]) modelMap[log.model] = { cost: 0, requests: 0, tokens: 0 };
      modelMap[log.model].cost += log.totalCost;
      modelMap[log.model].requests++;
      modelMap[log.model].tokens += (log.promptTokens ?? 0) + (log.completionTokens ?? 0);
    }
    const byModel = Object.entries(modelMap)
      .map(([model, v]) => ({ model, ...v }))
      .sort((a, b) => b.cost - a.cost);

    // Provider breakdown
    const providerMap: Record<string, { cost: number; requests: number }> = {};
    for (const log of validLogs) {
      if (!providerMap[log.provider]) providerMap[log.provider] = { cost: 0, requests: 0 };
      providerMap[log.provider].cost += log.totalCost;
      providerMap[log.provider].requests++;
    }
    const byProvider = Object.entries(providerMap).map(([provider, v]) => ({ provider, ...v }));

    // Per-key stats
    const keyMap: Record<string, { cost: number; requests: number; lastUsed: string | null }> = {};
    for (const log of validLogs) {
      if (!keyMap[log.apiKeyId]) keyMap[log.apiKeyId] = { cost: 0, requests: 0, lastUsed: null };
      keyMap[log.apiKeyId].cost += log.totalCost;
      keyMap[log.apiKeyId].requests++;
      const ts = log.timestamp.toISOString();
      if (!keyMap[log.apiKeyId].lastUsed || ts > keyMap[log.apiKeyId].lastUsed!) {
        keyMap[log.apiKeyId].lastUsed = ts;
      }
    }
    const byKey = keys.map(k => ({
      ...k,
      cost: keyMap[k.id]?.cost ?? 0,
      requests: keyMap[k.id]?.requests ?? 0,
      lastUsed: keyMap[k.id]?.lastUsed ?? null,
    })).sort((a, b) => b.cost - a.cost);

    // Totals
    const totalCost = validLogs.reduce((s, l) => s + l.totalCost, 0);
    const totalRequests = validLogs.length;
    const totalTokens = validLogs.reduce((s, l) => s + (l.promptTokens ?? 0) + (l.completionTokens ?? 0), 0);
    const flaggedCount = validLogs.filter(l => l.flagged).length;
    const avgLatency = validLogs.length
      ? Math.round(validLogs.reduce((s, l) => s + l.durationMs, 0) / validLogs.length)
      : 0;
    const prevCost = prevLogs?._sum?.totalCost ?? 0;
    const prevRequests = prevLogs?._count?._all ?? 0;
    const costChange = prevCost > 0
      ? Math.round(((totalCost - prevCost) / prevCost) * 100)
      : null;
    const requestChange = prevRequests > 0
      ? Math.round(((totalRequests - prevRequests) / prevRequests) * 100)
      : null;

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
