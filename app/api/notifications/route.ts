import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { data } = await db.from("Notification").select("*").eq("userId", user.id).order("createdAt", { ascending: false }).limit(20);
  const notifications = data ?? [];
  return NextResponse.json({ notifications, unread: notifications.filter((n: { read: boolean }) => !n.read).length });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { markAllRead } = await req.json();
  if (markAllRead) {
    const db = createSupabaseAdmin();
    await db.from("Notification").update({ read: true }).eq("userId", user.id).eq("read", false);
  }
  return NextResponse.json({ success: true });
}
