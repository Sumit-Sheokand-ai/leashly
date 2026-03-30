import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rules = await prisma.rule.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    rules.map((r) => ({ ...r, config: JSON.parse(r.config) }))
  );
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type, config } = await req.json();
  if (!name || !type || !config) {
    return NextResponse.json({ error: "name, type, and config are required" }, { status: 400 });
  }

  const rule = await prisma.rule.create({
    data: {
      userId: user.id,
      name,
      type,
      config: JSON.stringify(config),
    },
  });

  return NextResponse.json({ ...rule, config: JSON.parse(rule.config) }, { status: 201 });
}
