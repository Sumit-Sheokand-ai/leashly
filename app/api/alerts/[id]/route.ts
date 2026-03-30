import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const alert = await prisma.alert.findFirst({ where: { id, userId: user.id } });
  if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.alert.update({ where: { id }, data: { isActive: body.isActive } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const alert = await prisma.alert.findFirst({ where: { id, userId: user.id } });
  if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.alert.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
