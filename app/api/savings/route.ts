import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const { data } = await db
    .from("RequestLog")
    .select("totalCost, routingSavings, cacheSavings, compressionSavings, totalSavings")
    .eq("userId", user.id)
    .gte("timestamp", startOfMonth);

  const rows = data ?? [];
  const totalSpentRaw = rows.reduce((s, r) => s + (r.totalCost ?? 0), 0);
  const routingSaved   = rows.reduce((s, r) => s + (r.routingSavings ?? 0), 0);
  const cacheSaved     = rows.reduce((s, r) => s + (r.cacheSavings ?? 0), 0);
  const compressionSaved = rows.reduce((s, r) => s + (r.compressionSavings ?? 0), 0);
  const totalSaved     = rows.reduce((s, r) => s + (r.totalSavings ?? 0), 0);
  const totalSpent     = totalSpentRaw + totalSaved; // what it would have cost without Leashly

  return NextResponse.json({ totalSpent, totalSaved, routingSaved, cacheSaved, compressionSaved });
}
