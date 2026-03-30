import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { calculateCost, detectProvider } from "@/lib/cost";
import { checkRateLimit, checkSpendCap } from "@/lib/rate-limit";
import { checkInjection, extractPromptText } from "@/lib/injection-filter";
import type {
  SpendCapConfig,
  RateLimitConfig,
  InjectionFilterConfig,
} from "@/types";

const PROVIDER_ENDPOINTS: Record<string, string> = {
  openai: "https://api.openai.com",
  anthropic: "https://api.anthropic.com",
  gemini: "https://generativelanguage.googleapis.com",
  custom: "",
};

function errorResponse(code: number, message: string, details?: string) {
  return NextResponse.json(
    {
      error: {
        message,
        type: code === 429 ? "rate_limit_error" : "forbidden",
        code: code === 429 ? "rate_limit_exceeded" : "content_policy_violation",
        ...(details ? { details } : {}),
      },
    },
    { status: code }
  );
}

async function checkAlerts(userId: string, cost: number, flagged: boolean) {
  const alerts = await prisma.alert.findMany({
    where: { userId, isActive: true },
  });

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const spendResult = await prisma.requestLog.aggregate({
    where: { userId, timestamp: { gte: dayAgo } },
    _sum: { totalCost: true },
  });
  const dailySpend = (spendResult._sum.totalCost ?? 0) + cost;

  for (const alert of alerts) {
    let triggered = false;
    let message = "";

    if (alert.type === "spend_threshold" && dailySpend >= alert.threshold) {
      triggered = true;
      message = `Daily spend $${dailySpend.toFixed(4)} exceeded threshold $${alert.threshold}`;
    } else if (alert.type === "injection_detected" && flagged) {
      triggered = true;
      message = `Injection attempt detected`;
    }

    if (triggered) {
      console.log(`[ALERT] ${alert.type} for user ${userId}: ${message}`);
      await prisma.notification.create({
        data: { userId, type: alert.type, message },
      });
    }
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const startTime = Date.now();

  // 1. Extract proxy key from Authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse(401, "Missing or invalid Authorization header");
  }
  const proxyKey = authHeader.slice(7).trim();

  // 2. Look up the API key in DB
  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: { proxyKey },
    include: { user: true },
  });

  if (!apiKeyRecord || !apiKeyRecord.isActive) {
    return errorResponse(401, "Invalid or inactive proxy key");
  }

  const userId = apiKeyRecord.userId;
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";

  // 3. Parse request body
  let body: unknown;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      body = await req.json();
    } catch {
      return errorResponse(400, "Invalid JSON body");
    }
  }

  // 4. Load and run rules
  const rules = await prisma.rule.findMany({
    where: { userId, isActive: true },
  });

  // Sort: rate_limit first, spend_cap second, injection_filter third
  const orderedRules = [
    ...rules.filter((r) => r.type === "rate_limit"),
    ...rules.filter((r) => r.type === "spend_cap"),
    ...rules.filter((r) => r.type === "injection_filter"),
  ];

  for (const rule of orderedRules) {
    const config = JSON.parse(rule.config);

    if (rule.type === "rate_limit") {
      const rlConfig = config as RateLimitConfig;
      const result = await checkRateLimit(userId, apiKeyRecord.id, ip, rlConfig);
      if (!result.allowed) {
        return errorResponse(429, result.reason ?? "Rate limit exceeded");
      }
    }

    if (rule.type === "spend_cap") {
      const scConfig = config as SpendCapConfig;
      const result = await checkSpendCap(userId, scConfig);
      if (!result.allowed) {
        return errorResponse(429, result.reason ?? "Spend cap exceeded");
      }
    }

    if (rule.type === "injection_filter") {
      const ifConfig = config as InjectionFilterConfig;
      if (ifConfig.enabled) {
        const promptText = extractPromptText(body);
        const result = checkInjection(promptText, ifConfig.sensitivity);
        if (result.flagged) {
          // Log flagged request
          const model = (body as Record<string, unknown>)?.model as string ?? "unknown";
          await prisma.requestLog.create({
            data: {
              userId,
              apiKeyId: apiKeyRecord.id,
              provider: apiKeyRecord.provider,
              model,
              promptTokens: 0,
              completionTokens: 0,
              totalCost: 0,
              flagged: true,
              flagReason: result.reason,
              durationMs: Date.now() - startTime,
              statusCode: 403,
            },
          });
          await checkAlerts(userId, 0, true);
          return errorResponse(403, "Request blocked by injection filter", result.reason);
        }
      }
    }
  }

  // 5. Build upstream URL
  const { path: pathSegments } = await params;
  const provider = apiKeyRecord.provider;
  const baseUrl = PROVIDER_ENDPOINTS[provider] ?? PROVIDER_ENDPOINTS.openai;

  // For OpenAI-compatible paths, forward as-is
  const upstreamPath = "/" + pathSegments.join("/");
  const upstreamUrl = baseUrl + upstreamPath;

  // 6. Decrypt the real API key
  const realApiKey = decrypt(apiKeyRecord.encryptedKey);

  // 7. Build headers for upstream request
  const upstreamHeaders = new Headers();
  upstreamHeaders.set("Content-Type", "application/json");
  upstreamHeaders.set("Authorization", `Bearer ${realApiKey}`);

  // Anthropic requires specific headers
  if (provider === "anthropic") {
    upstreamHeaders.set("anthropic-version", "2023-06-01");
    upstreamHeaders.set("x-api-key", realApiKey);
    upstreamHeaders.delete("Authorization");
  }

  // Forward relevant headers
  const headersToForward = ["accept", "openai-organization", "openai-project"];
  for (const h of headersToForward) {
    const val = req.headers.get(h);
    if (val) upstreamHeaders.set(h, val);
  }

  const isStreaming =
    typeof body === "object" &&
    body !== null &&
    (body as Record<string, unknown>).stream === true;

  // 8. Forward request to upstream
  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(body),
    });
  } catch (err) {
    return NextResponse.json(
      { error: { message: "Failed to reach upstream provider", details: String(err) } },
      { status: 502 }
    );
  }

  const durationMs = Date.now() - startTime;
  const model = (body as Record<string, unknown>)?.model as string ?? "unknown";
  const detectedProvider = detectProvider(model) || provider;

  // 9. Handle streaming
  if (isStreaming && upstreamResponse.body) {
    let promptTokens = 0;
    let completionTokens = 0;

    const stream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(chunk);

        // Try to parse SSE chunks for token usage
        const text = new TextDecoder().decode(chunk);
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.usage) {
                promptTokens = json.usage.prompt_tokens ?? promptTokens;
                completionTokens = json.usage.completion_tokens ?? completionTokens;
              }
            } catch {
              // Non-JSON line, ignore
            }
          }
        }
      },
      async flush() {
        // Log after stream completes
        const cost = calculateCost(model, promptTokens, completionTokens);
        try {
          await prisma.requestLog.create({
            data: {
              userId,
              apiKeyId: apiKeyRecord.id,
              provider: detectedProvider,
              model,
              promptTokens,
              completionTokens,
              totalCost: cost,
              flagged: false,
              durationMs,
              statusCode: upstreamResponse.status,
            },
          });
          await checkAlerts(userId, cost, false);
        } catch {
          // Non-blocking — don't fail the stream
        }
      },
    });

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "text/event-stream");
    responseHeaders.set("Cache-Control", "no-cache");
    responseHeaders.set("Connection", "keep-alive");
    responseHeaders.set("X-Accel-Buffering", "no");

    return new Response(upstreamResponse.body.pipeThrough(stream), {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  }

  // 10. Non-streaming response
  let responseBody: unknown;
  let promptTokens = 0;
  let completionTokens = 0;

  try {
    responseBody = await upstreamResponse.json();
    const rb = responseBody as Record<string, unknown>;
    if (rb.usage && typeof rb.usage === "object") {
      const usage = rb.usage as Record<string, number>;
      promptTokens = usage.prompt_tokens ?? usage.input_tokens ?? 0;
      completionTokens = usage.completion_tokens ?? usage.output_tokens ?? 0;
    }
  } catch {
    const text = await upstreamResponse.text();
    responseBody = { raw: text };
  }

  const totalCost = calculateCost(model, promptTokens, completionTokens);

  // Log the request
  await prisma.requestLog.create({
    data: {
      userId,
      apiKeyId: apiKeyRecord.id,
      provider: detectedProvider,
      model,
      promptTokens,
      completionTokens,
      totalCost,
      flagged: false,
      durationMs: Date.now() - startTime,
      statusCode: upstreamResponse.status,
    },
  });

  await checkAlerts(userId, totalCost, false);

  return NextResponse.json(responseBody, { status: upstreamResponse.status });
}

// Also handle GET requests for health/info
export async function GET() {
  return NextResponse.json({
    service: "Leashly Proxy",
    version: "0.1.0",
    compatible: "openai-sdk",
  });
}
