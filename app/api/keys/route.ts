import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, generateProxyKey } from "@/lib/encryption";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, keyHash: true, proxyKey: true,
      provider: true, createdAt: true, isActive: true,
    },
  });

  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, provider, apiKey } = await req.json();

  if (!name || !provider || !apiKey) {
    return NextResponse.json({ error: "name, provider, and apiKey are required" }, { status: 400 });
  }

  const encryptedKey = encrypt(apiKey);
  const keyHash = apiKey.slice(-4);
  const proxyKey = generateProxyKey();

  const created = await prisma.apiKey.create({
    data: {
      userId: session.user.id,
      name,
      provider,
      encryptedKey,
      keyHash,
      proxyKey,
    },
    select: {
      id: true, name: true, keyHash: true, proxyKey: true,
      provider: true, createdAt: true, isActive: true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
