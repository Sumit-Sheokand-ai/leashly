import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { encrypt, generateProxyKey } from "@/lib/encryption";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, keyHash: true, proxyKey: true, provider: true, createdAt: true, isActive: true },
    });
    return NextResponse.json(keys);
  } catch (err) {
    console.error("Keys GET error:", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { name, provider, apiKey } = await req.json();
    if (!name || !provider || !apiKey) {
      return NextResponse.json({ error: "name, provider, and apiKey are required" }, { status: 400 });
    }
    const encryptedKey = encrypt(apiKey);
    const keyHash = apiKey.slice(-4);
    const proxyKey = generateProxyKey();
    const created = await prisma.apiKey.create({
      data: { userId: user.id, name, provider, encryptedKey, keyHash, proxyKey },
      select: { id: true, name: true, keyHash: true, proxyKey: true, provider: true, createdAt: true, isActive: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("Keys POST error:", err);
    return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
  }
}
