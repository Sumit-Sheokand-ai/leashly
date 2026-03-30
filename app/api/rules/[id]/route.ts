import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const rule = await prisma.rule.findFirst({ where: { id, userId: user.id } });
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updateData: { isActive?: boolean; config?: string; name?: string } = {};
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.config !== undefined) updateData.config = JSON.stringify(body.config);
  if (body.name !== undefined) updateData.name = body.name;

  const updated = await prisma.rule.update({ where: { id }, data: updateData });
  return NextResponse.json({ ...updated, config: JSON.parse(updated.config) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const rule = await prisma.rule.findFirst({ where: { id, userId: user.id } });
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.rule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
