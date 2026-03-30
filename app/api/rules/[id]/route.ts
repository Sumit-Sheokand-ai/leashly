import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rule = await prisma.rule.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updateData: { isActive?: boolean; config?: string; name?: string } = {};
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.config !== undefined) updateData.config = JSON.stringify(body.config);
  if (body.name !== undefined) updateData.name = body.name;

  const updated = await prisma.rule.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json({ ...updated, config: JSON.parse(updated.config) });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rule = await prisma.rule.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.rule.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
