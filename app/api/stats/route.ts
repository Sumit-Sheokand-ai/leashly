import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const now = Date.now();

  try {
    const [{ data: logs }, { data: rules }] = await Promise.all([
      db.from("RequestLog").select("timestamp,totalCost,model,flagged,durationMs").eq("userId", user.id).gte("timestamp", dayAgo),
      db.from("Rule").select("id", { count: "exact" }).eq("userId", user.id).eq("isActive", true),
    ]);

    const safelogs = logs ?? [];
    const totalSpendToday = safelogs.reduce((s, l) => s + l.totalCost, 0);
    const requestsToday = safelogs.length;
    const flaggedToday = safelogs.filter(l => l.flagged).length;
    const activeRules = (rules ?? []).length;

    const hourBuckets: Record<string, number> = {};
    for (let h = 23; h >= 0; h--) {
      const d = new Date(now - h * 60 * 60 * 1000);
      hourBuckets[`${d.getHours().toString().padStart(2, "0")}:00`] = 0;
    }
    for (const log of safelogs) {
      const key = `${new Date(log.timestamp).getHours().toString().padStart(2, "0")}:00`;
      if (key in hourBuckets) hourBuckets[key]++;
    }
    const requestsPerHour = Object.entries(hourBuckets).map(([hour, count]) => ({ hour, count }));

    const modelMap: Record<string, number> = {};
    for (const log of safelogs) modelMap[log.model] = (modelMap[log.model] ?? 0) + log.totalCost;
    const costPerModel = Object.entries(modelMap).map(([model, cost]) => ({ model, cost }));

    return NextResponse.json({ totalSpendToday, requestsToday, flaggedToday, activeRules, requestsPerHour, costPerModel });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({ totalSpendToday: 0, requestsToday: 0, flaggedToday: 0, activeRules: 0, requestsPerHour: [], costPerModel: [] });
  }
}
