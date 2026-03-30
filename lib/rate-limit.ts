import { prisma } from "./prisma";

interface RateLimitConfig {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  per: "account" | "api-key" | "ip";
}

// In-memory token bucket store (resets on restart — acceptable for MVP)
const buckets = new Map<string, { tokens: number; lastRefill: number }>();

export async function checkRateLimit(
  userId: string,
  apiKeyId: string,
  ip: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; reason?: string }> {
  const now = Date.now();
  const identifier =
    config.per === "account"
      ? userId
      : config.per === "api-key"
      ? apiKeyId
      : ip;

  // Check per-minute rate limit using in-memory token bucket
  if (config.requestsPerMinute) {
    const key = `minute:${identifier}`;
    const bucket = buckets.get(key) ?? {
      tokens: config.requestsPerMinute,
      lastRefill: now,
    };
    const elapsed = (now - bucket.lastRefill) / 1000 / 60; // minutes
    const refilled = Math.floor(elapsed * config.requestsPerMinute);
    bucket.tokens = Math.min(
      config.requestsPerMinute,
      bucket.tokens + refilled
    );
    if (refilled > 0) bucket.lastRefill = now;

    if (bucket.tokens < 1) {
      return { allowed: false, reason: `Rate limit exceeded: ${config.requestsPerMinute} requests/minute` };
    }
    bucket.tokens -= 1;
    buckets.set(key, bucket);
  }

  // Check per-hour using DB (persistent)
  if (config.requestsPerHour) {
    const hourAgo = new Date(now - 60 * 60 * 1000);
    const count = await prisma.requestLog.count({
      where: {
        userId,
        apiKeyId: config.per === "api-key" ? apiKeyId : undefined,
        timestamp: { gte: hourAgo },
      },
    });
    if (count >= config.requestsPerHour) {
      return { allowed: false, reason: `Rate limit exceeded: ${config.requestsPerHour} requests/hour` };
    }
  }

  // Check per-day using DB
  if (config.requestsPerDay) {
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const count = await prisma.requestLog.count({
      where: {
        userId,
        apiKeyId: config.per === "api-key" ? apiKeyId : undefined,
        timestamp: { gte: dayAgo },
      },
    });
    if (count >= config.requestsPerDay) {
      return { allowed: false, reason: `Rate limit exceeded: ${config.requestsPerDay} requests/day` };
    }
  }

  return { allowed: true };
}

interface SpendCapConfig {
  dailyLimit?: number;
  weeklyLimit?: number;
  monthlyLimit?: number;
  action: "block" | "alert" | "both";
}

export async function checkSpendCap(
  userId: string,
  config: SpendCapConfig
): Promise<{ allowed: boolean; reason?: string }> {
  const now = Date.now();

  if (config.dailyLimit) {
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const result = await prisma.requestLog.aggregate({
      where: { userId, timestamp: { gte: dayAgo } },
      _sum: { totalCost: true },
    });
    const spent = result._sum.totalCost ?? 0;
    if (spent >= config.dailyLimit) {
      return {
        allowed: config.action === "alert",
        reason: `Daily spend cap of $${config.dailyLimit} exceeded (spent: $${spent.toFixed(4)})`,
      };
    }
  }

  if (config.weeklyLimit) {
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const result = await prisma.requestLog.aggregate({
      where: { userId, timestamp: { gte: weekAgo } },
      _sum: { totalCost: true },
    });
    const spent = result._sum.totalCost ?? 0;
    if (spent >= config.weeklyLimit) {
      return {
        allowed: config.action === "alert",
        reason: `Weekly spend cap of $${config.weeklyLimit} exceeded (spent: $${spent.toFixed(4)})`,
      };
    }
  }

  if (config.monthlyLimit) {
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const result = await prisma.requestLog.aggregate({
      where: { userId, timestamp: { gte: monthAgo } },
      _sum: { totalCost: true },
    });
    const spent = result._sum.totalCost ?? 0;
    if (spent >= config.monthlyLimit) {
      return {
        allowed: config.action === "alert",
        reason: `Monthly spend cap of $${config.monthlyLimit} exceeded (spent: $${spent.toFixed(4)})`,
      };
    }
  }

  return { allowed: true };
}
