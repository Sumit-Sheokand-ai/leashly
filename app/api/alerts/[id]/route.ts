import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = createSupabaseAdmin();
  const { data: existing } = await db.from("Alert").select("id").eq("id", id).eq("userId", user.id).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const { data, error } = await db.from("Alert").update({ isActive: body.isActive }).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = createSupabaseAdmin();
  const { data: existing } = await db.from("Alert").select("id").eq("id", id).eq("userId", user.id).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { error } = await db.from("Alert").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json({ success: true });
}
