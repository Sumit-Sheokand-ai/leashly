import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { data, error } = await db.from("Alert").select("*").eq("userId", user.id).order("createdAt", { ascending: false });
  if (error) { console.error("Alerts GET:", error); return NextResponse.json([]); }
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { type, threshold, notifyEmail } = await req.json();
  if (!type || threshold === undefined || !notifyEmail)
    return NextResponse.json({ error: "type, threshold, and notifyEmail are required" }, { status: 400 });
  const db = createSupabaseAdmin();
  const { data, error } = await db.from("Alert")
    .insert({ userId: user.id, type, threshold: parseFloat(threshold), notifyEmail })
    .select("*").single();
  if (error) { console.error("Alerts POST:", error); return NextResponse.json({ error: "Failed" }, { status: 500 }); }
  return NextResponse.json(data, { status: 201 });
}
