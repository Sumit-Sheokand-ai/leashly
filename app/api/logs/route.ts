import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 20;
  const provider = searchParams.get("provider");
  const flaggedOnly = searchParams.get("flagged") === "true";
  const model = searchParams.get("model");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = { userId: user.id };
  if (provider) where.provider = provider;
  if (flaggedOnly) where.flagged = true;
  if (model) where.model = model;
  if (from || to) {
    const timestamp: Record<string, Date> = {};
    if (from) timestamp.gte = new Date(from);
    if (to) timestamp.lte = new Date(to);
    where.timestamp = timestamp;
  }

  const [logs, total] = await Promise.all([
    prisma.requestLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.requestLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, pageSize });
}
