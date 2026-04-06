import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { data } = await db
    .from("User")
    .select("id, email, plan, billingModel, cacheEnabled, routingEnabled, cacheTtlHours, similarityThreshold")
    .eq("id", user.id)
    .single();
  return NextResponse.json(data ?? {});
}
