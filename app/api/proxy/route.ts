import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

// GET /api/proxy — health check, returns proxy info + supported models
export async function GET() {
  return NextResponse.json({
    service:    "Leashly Proxy",
    version:    "1.0.0",
    compatible: ["openai-sdk", "anthropic-sdk", "openai-compatible"],
    baseUrl:    process.env.NEXT_PUBLIC_APP_URL ?? "https://leashly.dev",
    endpoints: {
      chat:        "/api/proxy/v1/chat/completions",
      completions: "/api/proxy/v1/completions",
      models:      "/api/proxy/v1/models",
      anthropic:   "/api/proxy/v1/messages",
    },
    models: {
      openai:    ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo", "o1", "o3-mini", "o4-mini"],
      anthropic: ["claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5",
                  "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-haiku-20240307"],
      gemini:    ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    },
  });
}

// POST /api/proxy/validate — validate a proxy key (used by dashboard to test keys)
export async function POST(req: Request) {
  const { proxyKey } = await req.json().catch(() => ({}));
  if (!proxyKey) return NextResponse.json({ error: "proxyKey required" }, { status: 400 });

  const db = createSupabaseAdmin();
  const { data } = await db
    .from("ApiKey")
    .select("id, name, provider, isActive")
    .eq("proxyKey", proxyKey)
    .single();

  if (!data || !data.isActive) {
    return NextResponse.json({ valid: false, reason: "Key not found or inactive" }, { status: 401 });
  }

  return NextResponse.json({ valid: true, name: data.name, provider: data.provider });
}
