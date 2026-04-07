// lib/rate-limit.ts — fully on Supabase (no Prisma)
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export interface RateLimitConfig {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  per: "account" | "api-key" | "ip";
}

export interface SpendCapConfig {
  dailyLimit?: number;
  weeklyLimit?: number;
  monthlyLimit?: number;
  action: "block" | "alert" | "both";
}

// In-memory token bucket (resets on cold start — fine for serverless MVP)
const buckets = new Map<string, { tokens: number; lastRefill: number }>();

export async function checkRateLimit(
  userId: string,
  apiKeyId: string,
  ip: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; reason?: string }> {
  const now     = Date.now();
  const ident   = config.per === "account" ? userId : config.per === "api-key" ? apiKeyId : ip;
  const db      = createSupabaseAdmin();

  // ── Per-minute: in-memory token bucket ──
  if (config.requestsPerMinute) {
    const key    = `minute:${ident}`;
    const bucket = buckets.get(key) ?? { tokens: config.requestsPerMinute, lastRefill: now };
    const mins   = (now - bucket.lastRefill) / 60_000;
    const refill = Math.floor(mins * config.requestsPerMinute);
    bucket.tokens = Math.min(config.requestsPerMinute, bucket.tokens + refill);
    if (refill > 0) bucket.lastRefill = now;
    if (bucket.tokens < 1) {
      return { allowed: false, reason: `Rate limit: ${config.requestsPerMinute} req/min` };
    }
    bucket.tokens -= 1;
    buckets.set(key, bucket);
  }

  // ── Per-hour: DB count ──
  if (config.requestsPerHour) {
    const since = new Date(now - 3_600_000).toISOString();
    const q = db.from("RequestLog").select("id", { count: "exact", head: true })
      .eq("userId", userId).gte("timestamp", since);
    if (config.per === "api-key") q.eq("apiKeyId", apiKeyId);
    const { count } = await q;
    if ((count ?? 0) >= config.requestsPerHour) {
      return { allowed: false, reason: `Rate limit: ${config.requestsPerHour} req/hr` };
    }
  }

  // ── Per-day: DB count ──
  if (config.requestsPerDay) {
    const since = new Date(now - 86_400_000).toISOString();
    const q = db.from("RequestLog").select("id", { count: "exact", head: true })
      .eq("userId", userId).gte("timestamp", since);
    if (config.per === "api-key") q.eq("apiKeyId", apiKeyId);
    const { count } = await q;
    if ((count ?? 0) >= config.requestsPerDay) {
      return { allowed: false, reason: `Rate limit: ${config.requestsPerDay} req/day` };
    }
  }

  return { allowed: true };
}

export async function checkSpendCap(
  userId: string,
  config: SpendCapConfig
): Promise<{ allowed: boolean; reason?: string }> {
  const now = Date.now();
  const db  = createSupabaseAdmin();

  async function getSpend(since: string): Promise<number> {
    const { data } = await db
      .from("RequestLog")
      .select("totalCost")
      .eq("userId", userId)
      .gte("timestamp", since);
    return (data ?? []).reduce((s: number, r: { totalCost: number }) => s + (r.totalCost ?? 0), 0);
  }

  const shouldBlock = (action: string) => action === "block" || action === "both";

  if (config.dailyLimit) {
    const spent = await getSpend(new Date(now - 86_400_000).toISOString());
    if (spent >= config.dailyLimit) {
      return {
        allowed: !shouldBlock(config.action),
        reason: `Daily spend cap $${config.dailyLimit} exceeded (spent: $${spent.toFixed(4)})`,
      };
    }
  }

  if (config.weeklyLimit) {
    const spent = await getSpend(new Date(now - 604_800_000).toISOString());
    if (spent >= config.weeklyLimit) {
      return {
        allowed: !shouldBlock(config.action),
        reason: `Weekly spend cap $${config.weeklyLimit} exceeded (spent: $${spent.toFixed(4)})`,
      };
    }
  }

  if (config.monthlyLimit) {
    const spent = await getSpend(new Date(now - 2_592_000_000).toISOString());
    if (spent >= config.monthlyLimit) {
      return {
        allowed: !shouldBlock(config.action),
        reason: `Monthly spend cap $${config.monthlyLimit} exceeded (spent: $${spent.toFixed(4)})`,
      };
    }
  }

  return { allowed: true };
}
