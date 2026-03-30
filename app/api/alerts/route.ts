import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const alerts = await prisma.alert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(alerts);
  } catch (err) {
    console.error("Alerts GET error:", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { type, threshold, notifyEmail } = await req.json();
    if (!type || threshold === undefined || !notifyEmail) {
      return NextResponse.json({ error: "type, threshold, and notifyEmail are required" }, { status: 400 });
    }
    const alert = await prisma.alert.create({
      data: { userId: user.id, type, threshold: parseFloat(threshold), notifyEmail },
    });
    return NextResponse.json(alert, { status: 201 });
  } catch (err) {
    console.error("Alerts POST error:", err);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}
