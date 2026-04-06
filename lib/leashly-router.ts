// lib/leashly-router.ts
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export interface RouteInput {
  userId: string;
  requestedModel: string;
  messages: Array<{ role: string; content: string }>;
}

export interface RouteResult {
  model: string;
  provider: string;
  wasRouted: boolean;
  originalModel: string;
  routingSavings: number;
}

const MODEL_COSTS: Record<string, number> = {
  "gpt-4o":                       0.010,
  "gpt-4o-mini":                  0.000375,
  "gpt-4-turbo":                  0.015,
  "gpt-3.5-turbo":                0.001,
  "claude-3-5-sonnet-20241022":   0.009,
  "claude-3-5-sonnet-20240620":   0.009,
  "claude-3-haiku-20240307":      0.000625,
  "claude-3-opus-20240229":       0.045,
  "gemini-1.5-pro":               0.00875,
  "gemini-1.5-flash":             0.000375,
};

const DEFAULT_ROUTING_MAP: Record<string, { model: string; provider: string }> = {
  "gpt-4o":                     { model: "gpt-4o-mini",            provider: "openai" },
  "gpt-4-turbo":                { model: "gpt-4o-mini",            provider: "openai" },
  "claude-3-5-sonnet-20241022": { model: "claude-3-haiku-20240307", provider: "anthropic" },
  "claude-3-opus-20240229":     { model: "claude-3-haiku-20240307", provider: "anthropic" },
  "gemini-1.5-pro":             { model: "gemini-1.5-flash",        provider: "gemini" },
};

type Complexity = "simple" | "medium" | "complex";

function classifyComplexity(messages: Array<{ role: string; content: string }>): Complexity {
  const fullText = messages.map((m) => m.content).join(" ");
  const tokens = Math.ceil(fullText.length / 4);
  const complexKws = ["reason step by step", "analyze", "expert", "comprehensive", "multi-step", "legal", "financial advice"];
  const codeKws = ["```", "function", "class ", "def ", "SELECT ", "import "];
  const simpleKws = ["what is", "define", "list ", "translate", "yes or no"];
  if (complexKws.some((k) => fullText.toLowerCase().includes(k)) || tokens > 2000) return "complex";
  if (codeKws.some((k) => fullText.includes(k)) || tokens > 500) return "medium";
  if (simpleKws.some((k) => fullText.toLowerCase().includes(k)) || tokens < 200) return "simple";
  return "medium";
}

function detectProvider(model: string): string {
  const m = model.toLowerCase();
  if (m.startsWith("gpt") || m.startsWith("o1") || m.startsWith("o3")) return "openai";
  if (m.startsWith("claude")) return "anthropic";
  if (m.startsWith("gemini")) return "gemini";
  return "openai";
}

function estimateSavings(original: string, actual: string, tokens: number): number {
  const origCost = MODEL_COSTS[original] ?? 0.01;
  const actCost  = MODEL_COSTS[actual]   ?? 0.01;
  return Math.max(0, (origCost - actCost) * (tokens / 1000));
}

export async function resolveModel(input: RouteInput): Promise<RouteResult> {
  const { userId, requestedModel, messages } = input;
  const db = createSupabaseAdmin();

  const { data: user } = await db.from("User").select("routingEnabled").eq("id", userId).single();
  if (!user?.routingEnabled) {
    return { model: requestedModel, provider: detectProvider(requestedModel), wasRouted: false, originalModel: requestedModel, routingSavings: 0 };
  }

  const fullText = messages.map((m) => m.content).join(" ");
  const tokens = Math.ceil(fullText.length / 4);
  const complexity = classifyComplexity(messages);

  const { data: rules } = await db
    .from("RoutingRule")
    .select("*")
    .eq("userId", userId)
    .eq("isActive", true)
    .order("priority", { ascending: true });

  for (const rule of rules ?? []) {
    const cond = rule.condition as Record<string, unknown>;
    if (cond.complexity && cond.complexity !== complexity) continue;
    if (cond.maxTokens && tokens > Number(cond.maxTokens)) continue;
    if (cond.promptContains && Array.isArray(cond.promptContains)) {
      const hasAll = (cond.promptContains as string[]).every((kw: string) =>
        fullText.toLowerCase().includes(kw.toLowerCase())
      );
      if (!hasAll) continue;
    }
    return {
      model: rule.targetModel,
      provider: rule.provider,
      wasRouted: rule.targetModel !== requestedModel,
      originalModel: requestedModel,
      routingSavings: estimateSavings(requestedModel, rule.targetModel, tokens),
    };
  }

  if (complexity === "simple" && DEFAULT_ROUTING_MAP[requestedModel]) {
    const target = DEFAULT_ROUTING_MAP[requestedModel];
    return { model: target.model, provider: target.provider, wasRouted: true, originalModel: requestedModel, routingSavings: estimateSavings(requestedModel, target.model, tokens) };
  }

  return { model: requestedModel, provider: detectProvider(requestedModel), wasRouted: false, originalModel: requestedModel, routingSavings: 0 };
}
