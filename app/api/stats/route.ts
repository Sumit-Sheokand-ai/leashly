import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);

  try {
    const [spendResult, requestsToday, flaggedToday, activeRules, hourlyData, modelData] =
      await Promise.all([
        prisma.requestLog.aggregate({
          where: { userId, timestamp: { gte: dayAgo } },
          _sum: { totalCost: true },
        }),
        prisma.requestLog.count({ where: { userId, timestamp: { gte: dayAgo } } }),
        prisma.requestLog.count({ where: { userId, flagged: true, timestamp: { gte: dayAgo } } }),
        prisma.rule.count({ where: { userId, isActive: true } }),
        prisma.requestLog.findMany({
          where: { userId, timestamp: { gte: dayAgo } },
          select: { timestamp: true },
          orderBy: { timestamp: "asc" },
        }),
        prisma.requestLog.findMany({
          where: { userId, timestamp: { gte: dayAgo } },
          select: { model: true, totalCost: true },
        }),
      ]);

    const hourBuckets: Record<string, number> = {};
    for (let h = 23; h >= 0; h--) {
      const d = new Date(now - h * 60 * 60 * 1000);
      const key = `${d.getHours().toString().padStart(2, "0")}:00`;
      hourBuckets[key] = 0;
    }
    for (const log of hourlyData) {
      const key = `${new Date(log.timestamp).getHours().toString().padStart(2, "0")}:00`;
      if (key in hourBuckets) hourBuckets[key]++;
    }
    const requestsPerHour = Object.entries(hourBuckets).map(([hour, count]) => ({ hour, count }));

    const modelMap: Record<string, number> = {};
    for (const log of modelData) {
      modelMap[log.model] = (modelMap[log.model] ?? 0) + log.totalCost;
    }
    const costPerModel = Object.entries(modelMap).map(([model, cost]) => ({ model, cost }));

    return NextResponse.json({
      totalSpendToday: spendResult._sum.totalCost ?? 0,
      requestsToday,
      flaggedToday,
      activeRules,
      requestsPerHour,
      costPerModel,
    });
  } catch (err) {
    console.error("Stats API error:", err);
    return NextResponse.json({
      totalSpendToday: 0,
      requestsToday: 0,
      flaggedToday: 0,
      activeRules: 0,
      requestsPerHour: [],
      costPerModel: [],
    });
  }
}
