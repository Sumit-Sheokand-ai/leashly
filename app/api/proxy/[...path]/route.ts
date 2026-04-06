import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/encryption";
import { calculateCost, detectProvider } from "@/lib/cost";
import { checkRateLimit, checkSpendCap } from "@/lib/rate-limit";
import { checkInjection, extractPromptText } from "@/lib/injection-filter";
import { sendAlertEmail } from "@/lib/resend";
import { resolveModel } from "@/lib/leashly-router";
import { checkCache, storeCache } from "@/lib/leashly-cache";
import { compressSystemPrompt } from "@/lib/leashly-compressor";
import type { SpendCapConfig, RateLimitConfig, InjectionFilterConfig } from "@/types";

const PROVIDER_ENDPOINTS: Record<string, string> = {
  openai:    "https://api.openai.com",
  anthropic: "https://api.anthropic.com",
  gemini:    "https://generativelanguage.googleapis.com",
  custom:    "",
};

function errorResponse(code: number, message: string, details?: string) {
  return NextResponse.json(
    { error: { message, type: code === 429 ? "rate_limit_error" : "forbidden", code: code === 429 ? "rate_limit_exceeded" : "content_policy_violation", ...(details ? { details } : {}) } },
    { status: code }
  );
}

async function checkAlerts(db: ReturnType<typeof createSupabaseAdmin>, userId: string, cost: number, flagged: boolean) {
  const { data: alerts } = await db.from("Alert").select("*").eq("userId", userId).eq("isActive", true);
  if (!alerts?.length) return;
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: spendLogs } = await db.from("RequestLog").select("totalCost").eq("userId", userId).gte("timestamp", dayAgo);
  const dailySpend = (spendLogs ?? []).reduce((s: number, l: { totalCost: number }) => s + l.totalCost, 0) + cost;
  for (const alert of alerts) {
    let triggered = false;
    let message = "";
    if (alert.type === "spend_threshold" && dailySpend >= alert.threshold) { triggered = true; message = `Daily spend $${dailySpend.toFixed(4)} exceeded threshold $${alert.threshold}`; }
    else if (alert.type === "injection_detected" && flagged) { triggered = true; message = `Injection attempt detected`; }
    if (triggered) {
      await db.from("Notification").insert({ userId, type: alert.type, message });
      await sendAlertEmail(alert.notifyEmail, alert.type, message).catch(() => {});
    }
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const startTime = Date.now();
  const db = createSupabaseAdmin();

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return errorResponse(401, "Missing or invalid Authorization header");
  const proxyKey = authHeader.slice(7).trim();

  const { data: apiKeyRecord } = await db.from("ApiKey").select("*").eq("proxyKey", proxyKey).single();
  if (!apiKeyRecord || !apiKeyRecord.isActive) return errorResponse(401, "Invalid or inactive proxy key");

  const userId = apiKeyRecord.userId;
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";

  let body: unknown;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try { body = await req.json(); } catch { return errorResponse(400, "Invalid JSON body"); }
  }

  // --- Existing rules (rate limit, spend cap, injection) ---
  const { data: rules } = await db.from("Rule").select("*").eq("userId", userId).eq("isActive", true);
  const orderedRules = [
    ...(rules ?? []).filter((r: { type: string }) => r.type === "rate_limit"),
    ...(rules ?? []).filter((r: { type: string }) => r.type === "spend_cap"),
    ...(rules ?? []).filter((r: { type: string }) => r.type === "injection_filter"),
  ];

  for (const rule of orderedRules) {
    const config = JSON.parse(rule.config);
    if (rule.type === "rate_limit") {
      const result = await checkRateLimit(userId, apiKeyRecord.id, ip, config as RateLimitConfig);
      if (!result.allowed) return errorResponse(429, result.reason ?? "Rate limit exceeded");
    }
    if (rule.type === "spend_cap") {
      const result = await checkSpendCap(userId, config as SpendCapConfig);
      if (!result.allowed) return errorResponse(429, result.reason ?? "Spend cap exceeded");
    }
    if (rule.type === "injection_filter") {
      const ifConfig = config as InjectionFilterConfig;
      if (ifConfig.enabled) {
        const result = checkInjection(extractPromptText(body), ifConfig.sensitivity);
        if (result.flagged) {
          const model = (body as Record<string, unknown>)?.model as string ?? "unknown";
          await db.from("RequestLog").insert({ userId, apiKeyId: apiKeyRecord.id, provider: apiKeyRecord.provider, model, promptTokens: 0, completionTokens: 0, totalCost: 0, flagged: true, flagReason: result.reason, durationMs: Date.now() - startTime, statusCode: 403, wasRouted: false, wasCacheHit: false, wasCompressed: false, routingSavings: 0, cacheSavings: 0, compressionSavings: 0, totalSavings: 0 });
          await checkAlerts(db, userId, 0, true);
          return errorResponse(403, "Request blocked by injection filter", result.reason);
        }
      }
    }
  }

  // --- NEW: Smart routing ---
  const requestedModel = (body as Record<string, unknown>)?.model as string ?? "unknown";
  const messages = (body as Record<string, unknown>)?.messages as Array<{ role: string; content: string }> ?? [];

  const routeResult = await resolveModel({ userId, requestedModel, messages }).catch(() => ({
    model: requestedModel, provider: apiKeyRecord.provider, wasRouted: false, originalModel: requestedModel, routingSavings: 0,
  }));

  // --- NEW: Prompt compression (system prompt only, non-streaming) ---
  const isStreaming = typeof body === "object" && body !== null && (body as Record<string, unknown>).stream === true;
  let finalBody = body as Record<string, unknown>;
  let compressionResult = { originalTokens: 0, compressedTokens: 0, savedTokens: 0, compressionSavings: 0, compressedSystemPrompt: "" };

  if (!isStreaming && messages.length > 0) {
    const sysMsgIdx = messages.findIndex((m) => m.role === "system");
    if (sysMsgIdx !== -1) {
      const cr = await compressSystemPrompt(messages[sysMsgIdx].content, routeResult.model, "medium").catch(() => null);
      if (cr && cr.savedTokens > 0) {
        compressionResult = cr;
        const newMessages = [...messages];
        newMessages[sysMsgIdx] = { ...newMessages[sysMsgIdx], content: cr.compressedSystemPrompt };
        finalBody = { ...finalBody, messages: newMessages };
      }
    }
  }

  // Override model with routed model
  if (routeResult.wasRouted) {
    finalBody = { ...finalBody, model: routeResult.model };
  }

  // --- NEW: Cache check (non-streaming only) ---
  const finalMessages = (finalBody.messages as Array<{ role: string; content: string }>) ?? messages;
  const estimatedTokens = Math.ceil(finalMessages.map((m) => m.content).join(" ").length / 4);
  const estimatedCost = calculateCost(routeResult.model, estimatedTokens, estimatedTokens / 2);

  if (!isStreaming) {
    const cacheHit = await checkCache(userId, routeResult.model, finalMessages, estimatedCost).catch(() => null);
    if (cacheHit) {
      const totalSavings = cacheHit.savedCost + routeResult.routingSavings + compressionResult.compressionSavings;
      await db.from("RequestLog").insert({
        userId, apiKeyId: apiKeyRecord.id, provider: routeResult.provider, model: routeResult.model,
        promptTokens: 0, completionTokens: 0, totalCost: 0, flagged: false,
        durationMs: Date.now() - startTime, statusCode: 200,
        wasRouted: routeResult.wasRouted, originalModel: routeResult.originalModel, actualModel: routeResult.model,
        routingSavings: routeResult.routingSavings,
        wasCacheHit: true, cacheSavings: cacheHit.savedCost,
        wasCompressed: compressionResult.savedTokens > 0,
        originalPromptTokens: compressionResult.originalTokens || null,
        compressedTokens: compressionResult.compressedTokens || null,
        compressionSavings: compressionResult.compressionSavings,
        totalSavings,
      });
      return NextResponse.json(cacheHit.response, {
        headers: { "x-leashly-cache": "hit", "x-leashly-saved": totalSavings.toFixed(6) },
      });
    }
  }

  // --- Forward to upstream ---
  const { path: pathSegments = [] } = await params;
  const provider = routeResult.provider || apiKeyRecord.provider;
  const upstreamUrl = (PROVIDER_ENDPOINTS[provider] ?? PROVIDER_ENDPOINTS.openai) + "/" + pathSegments.join("/");
  const realApiKey = decrypt(apiKeyRecord.encryptedKey);
  const detectedProvider = detectProvider(routeResult.model) || provider;

  const upstreamHeaders = new Headers();
  upstreamHeaders.set("Content-Type", "application/json");
  upstreamHeaders.set("Authorization", `Bearer ${realApiKey}`);
  if (provider === "anthropic") {
    upstreamHeaders.set("anthropic-version", "2023-06-01");
    upstreamHeaders.set("x-api-key", realApiKey);
    upstreamHeaders.delete("Authorization");
  }
  for (const h of ["accept", "openai-organization", "openai-project"]) {
    const val = req.headers.get(h);
    if (val) upstreamHeaders.set(h, val);
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, { method: "POST", headers: upstreamHeaders, body: JSON.stringify(finalBody) });
  } catch (err) {
    return NextResponse.json({ error: { message: "Failed to reach upstream provider", details: String(err) } }, { status: 502 });
  }

  const durationMs = Date.now() - startTime;

  // --- Streaming path (no cache, savings still tracked) ---
  if (isStreaming && upstreamResponse.body) {
    let promptTokens = 0;
    let completionTokens = 0;
    const stream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        const lines = new TextDecoder().decode(chunk).split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try { const json = JSON.parse(line.slice(6)); if (json.usage) { promptTokens = json.usage.prompt_tokens ?? promptTokens; completionTokens = json.usage.completion_tokens ?? completionTokens; } } catch {}
          }
        }
      },
      async flush() {
        const cost = calculateCost(routeResult.model, promptTokens, completionTokens);
        const totalSavings = routeResult.routingSavings + compressionResult.compressionSavings;
        try {
          await db.from("RequestLog").insert({
            userId, apiKeyId: apiKeyRecord.id, provider: detectedProvider, model: routeResult.model,
            promptTokens, completionTokens, totalCost: cost, flagged: false, durationMs, statusCode: upstreamResponse.status,
            wasRouted: routeResult.wasRouted, originalModel: routeResult.originalModel, actualModel: routeResult.model,
            routingSavings: routeResult.routingSavings,
            wasCacheHit: false, cacheSavings: 0,
            wasCompressed: compressionResult.savedTokens > 0,
            originalPromptTokens: compressionResult.originalTokens || null,
            compressedTokens: compressionResult.compressedTokens || null,
            compressionSavings: compressionResult.compressionSavings,
            totalSavings,
          });
          await checkAlerts(db, userId, cost, false);
        } catch {}
      },
    });
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "text/event-stream");
    responseHeaders.set("Cache-Control", "no-cache");
    responseHeaders.set("Connection", "keep-alive");
    responseHeaders.set("X-Accel-Buffering", "no");
    if (routeResult.wasRouted) responseHeaders.set("x-leashly-routed-to", routeResult.model);
    return new Response(upstreamResponse.body.pipeThrough(stream), { status: upstreamResponse.status, headers: responseHeaders });
  }

  // --- Non-streaming path ---
  let responseBody: unknown;
  let promptTokens = 0;
  let completionTokens = 0;
  try {
    responseBody = await upstreamResponse.json();
    const usage = (responseBody as Record<string, Record<string, number>>).usage;
    if (usage) { promptTokens = usage.prompt_tokens ?? usage.input_tokens ?? 0; completionTokens = usage.completion_tokens ?? usage.output_tokens ?? 0; }
  } catch {
    responseBody = { raw: await upstreamResponse.text() };
  }

  const totalCost = calculateCost(routeResult.model, promptTokens, completionTokens);
  const totalSavings = routeResult.routingSavings + compressionResult.compressionSavings;

  await db.from("RequestLog").insert({
    userId, apiKeyId: apiKeyRecord.id, provider: detectedProvider, model: routeResult.model,
    promptTokens, completionTokens, totalCost, flagged: false, durationMs: Date.now() - startTime, statusCode: upstreamResponse.status,
    wasRouted: routeResult.wasRouted, originalModel: routeResult.originalModel, actualModel: routeResult.model,
    routingSavings: routeResult.routingSavings,
    wasCacheHit: false, cacheSavings: 0,
    wasCompressed: compressionResult.savedTokens > 0,
    originalPromptTokens: compressionResult.originalTokens || null,
    compressedTokens: compressionResult.compressedTokens || null,
    compressionSavings: compressionResult.compressionSavings,
    totalSavings,
  });
  await checkAlerts(db, userId, totalCost, false);

  // Store in cache for next time
  if (upstreamResponse.status === 200) {
    storeCache(userId, routeResult.model, finalMessages, responseBody, promptTokens + completionTokens, totalCost).catch(() => {});
  }

  const resHeaders: Record<string, string> = {};
  if (routeResult.wasRouted) resHeaders["x-leashly-routed-to"] = routeResult.model;
  if (totalSavings > 0) resHeaders["x-leashly-saved"] = totalSavings.toFixed(6);

  return NextResponse.json(responseBody, { status: upstreamResponse.status, headers: resHeaders });
}

export async function GET() {
  return NextResponse.json({ service: "Leashly Proxy", version: "0.2.0", compatible: "openai-sdk" });
}
