import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rules = await prisma.rule.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    rules.map((r) => ({ ...r, config: JSON.parse(r.config) }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type, config } = await req.json();
  if (!name || !type || !config) {
    return NextResponse.json({ error: "name, type, and config are required" }, { status: 400 });
  }

  const rule = await prisma.rule.create({
    data: {
      userId: session.user.id,
      name,
      type,
      config: JSON.stringify(config),
    },
  });

  return NextResponse.json({ ...rule, config: JSON.parse(rule.config) }, { status: 201 });
}
