import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const alerts = await prisma.alert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(alerts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, threshold, notifyEmail } = await req.json();
  if (!type || threshold === undefined || !notifyEmail) {
    return NextResponse.json({ error: "type, threshold, and notifyEmail are required" }, { status: 400 });
  }

  const alert = await prisma.alert.create({
    data: { userId: session.user.id, type, threshold: parseFloat(threshold), notifyEmail },
  });
  return NextResponse.json(alert, { status: 201 });
}
