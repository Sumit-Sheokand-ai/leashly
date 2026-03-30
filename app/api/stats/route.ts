import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);

  const [spendResult, requestsToday, flaggedToday, activeRules, hourlyData, modelData] =
    await Promise.all([
      prisma.requestLog.aggregate({
        where: { userId, timestamp: { gte: dayAgo } },
        _sum: { totalCost: true },
      }),
      prisma.requestLog.count({ where: { userId, timestamp: { gte: dayAgo } } }),
      prisma.requestLog.count({ where: { userId, flagged: true, timestamp: { gte: dayAgo } } }),
      prisma.rule.count({ where: { userId, isActive: true } }),
      // hourly breakdown for last 24h
      prisma.requestLog.findMany({
        where: { userId, timestamp: { gte: dayAgo } },
        select: { timestamp: true },
        orderBy: { timestamp: "asc" },
      }),
      // cost per model
      prisma.requestLog.findMany({
        where: { userId, timestamp: { gte: dayAgo } },
        select: { model: true, totalCost: true },
      }),
    ]);

  // Build hourly buckets
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

  // Cost per model
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
}
