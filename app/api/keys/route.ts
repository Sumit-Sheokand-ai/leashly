import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { encrypt, generateProxyKey } from "@/lib/encryption";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { data, error } = await db.from("ApiKey")
    .select("id,name,keyHash,proxyKey,provider,createdAt,isActive")
    .eq("userId", user.id).order("createdAt", { ascending: false });
  if (error) { console.error("Keys GET:", error); return NextResponse.json([]); }
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, provider, apiKey } = await req.json();
  if (!name || !provider || !apiKey)
    return NextResponse.json({ error: "name, provider, and apiKey are required" }, { status: 400 });
  const db = createSupabaseAdmin();
  const { data, error } = await db.from("ApiKey")
    .insert({ userId: user.id, name, provider, encryptedKey: encrypt(apiKey), keyHash: apiKey.slice(-4), proxyKey: generateProxyKey() })
    .select("id,name,keyHash,proxyKey,provider,createdAt,isActive").single();
  if (error) { console.error("Keys POST:", error); return NextResponse.json({ error: "Failed" }, { status: 500 }); }
  return NextResponse.json(data, { status: 201 });
}
