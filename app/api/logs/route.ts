import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 20;
  const db = createSupabaseAdmin();

  try {
    let q = db.from("RequestLog").select("*", { count: "exact" })
      .eq("userId", user.id).order("timestamp", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const provider = searchParams.get("provider");
    const model = searchParams.get("model");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (provider) q = q.eq("provider", provider);
    if (searchParams.get("flagged") === "true") q = q.eq("flagged", true);
    if (model) q = q.eq("model", model);
    if (from) q = q.gte("timestamp", from);
    if (to) q = q.lte("timestamp", to);

    const { data, count, error } = await q;
    if (error) throw error;
    return NextResponse.json({ logs: data ?? [], total: count ?? 0, page, pageSize });
  } catch (err) {
    console.error("Logs error:", err);
    return NextResponse.json({ logs: [], total: 0, page, pageSize });
  }
}
