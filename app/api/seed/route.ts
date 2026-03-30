import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateProxyKey, encrypt } from "@/lib/encryption";

const MODELS = ["gpt-4o", "gpt-3.5-turbo", "claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"];
const PROVIDERS = ["openai", "openai", "anthropic", "anthropic"];
const FLAG_REASONS: (string | null)[] = [
  "Ignore instructions attack",
  "System prompt extraction attempt",
  "DAN jailbreak attempt",
  null, null, null, null, null, null, null,
];
const COST_MAP: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 5, output: 15 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;

  const existingKey = await prisma.apiKey.findFirst({ where: { userId } });
  let apiKeyId: string;

  if (existingKey) {
    apiKeyId = existingKey.id;
  } else {
    const key = await prisma.apiKey.create({
      data: {
        userId,
        name: "Demo OpenAI Key",
        provider: "openai",
        encryptedKey: encrypt("sk-demo-key-placeholder"),
        keyHash: "xxxx",
        proxyKey: generateProxyKey(),
      },
    });
    apiKeyId = key.id;
  }

  const ruleCount = await prisma.rule.count({ where: { userId } });
  if (ruleCount === 0) {
    await prisma.rule.createMany({
      data: [
        { userId, name: "Monthly Spend Cap", type: "spend_cap", config: JSON.stringify({ monthlyLimit: 100, dailyLimit: 10, action: "block" }) },
        { userId, name: "API Rate Limit", type: "rate_limit", config: JSON.stringify({ requestsPerMinute: 10, requestsPerHour: 100, per: "account" }) },
        { userId, name: "Injection Filter", type: "injection_filter", config: JSON.stringify({ enabled: true, sensitivity: "medium" }) },
      ],
    });
  }

  const now = Date.now();
  const logs = [];
  for (let i = 0; i < 100; i++) {
    const modelIdx = rand(0, 3);
    const model = MODELS[modelIdx];
    const provider = PROVIDERS[modelIdx];
    const promptTokens = rand(100, 2000);
    const completionTokens = rand(50, 800);
    const flagReason = FLAG_REASONS[rand(0, FLAG_REASONS.length - 1)];
    const flagged = flagReason !== null;
    const c = COST_MAP[model];
    const totalCost = (promptTokens * c.input + completionTokens * c.output) / 1_000_000;

    logs.push({
      userId, apiKeyId,
      timestamp: new Date(now - rand(0, 7 * 24 * 60 * 60 * 1000)),
      provider, model, promptTokens, completionTokens, totalCost,
      flagged, flagReason, durationMs: rand(300, 3000),
      statusCode: flagged ? 403 : 200,
    });
  }

  await prisma.requestLog.createMany({ data: logs });
  return NextResponse.json({ success: true, seeded: logs.length });
}
