// lib/leashly-router.ts
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { detectProvider } from "@/lib/cost";

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

// Avg cost per 1K tokens (input+output blended) for routing savings calc
const MODEL_BLEND_COST: Record<string, number> = {
  "gpt-4o":                       0.00625,
  "gpt-4o-mini":                  0.000375,
  "gpt-4-turbo":                  0.02,
  "gpt-4":                        0.045,
  "gpt-3.5-turbo":                0.001,
  "o1":                           0.0375,
  "o1-mini":                      0.0075,
  "o3-mini":                      0.00275,
  "o4-mini":                      0.00275,
  "claude-opus-4-5":              0.045,
  "claude-sonnet-4-5":            0.009,
  "claude-haiku-4-5":             0.002,
  "claude-3-5-sonnet-20241022":   0.009,
  "claude-3-5-haiku-20241022":    0.002,
  "claude-3-haiku-20240307":      0.000625,
  "claude-3-opus-20240229":       0.045,
  "gemini-2.0-flash":             0.00025,
  "gemini-1.5-pro":               0.003125,
  "gemini-1.5-flash":             0.0001875,
};

// Default routing: heavy → cheaper equivalent for simple tasks
const DEFAULT_ROUTING_MAP: Record<string, { model: string; provider: string }> = {
  "gpt-4o":                     { model: "gpt-4o-mini",             provider: "openai" },
  "gpt-4-turbo":                { model: "gpt-4o-mini",             provider: "openai" },
  "gpt-4":                      { model: "gpt-4o-mini",             provider: "openai" },
  "o1":                         { model: "o3-mini",                 provider: "openai" },
  "claude-opus-4-5":            { model: "claude-haiku-4-5",        provider: "anthropic" },
  "claude-3-5-sonnet-20241022": { model: "claude-3-5-haiku-20241022", provider: "anthropic" },
  "claude-3-opus-20240229":     { model: "claude-3-haiku-20240307", provider: "anthropic" },
  "gemini-1.5-pro":             { model: "gemini-2.0-flash",        provider: "gemini" },
};

type Complexity = "simple" | "medium" | "complex";

function classifyComplexity(messages: Array<{ role: string; content: string }>): Complexity {
  const text   = messages.map((m) => m.content).join(" ");
  const tokens = Math.ceil(text.length / 4);

  const complexKws = ["reason step by step", "analyze in depth", "comprehensive analysis",
    "multi-step", "legal advice", "financial advice", "expert level", "research paper"];
  const codeKws    = ["```", "function ", "class ", "def ", "SELECT ", "import ", "async ",
    "interface ", "export ", "const ", "let ", "var "];
  const simpleKws  = ["what is", "define ", "translate", "yes or no", "list 5", "list 3",
    "how do i", "what does", "explain briefly"];

  if (complexKws.some((k) => text.toLowerCase().includes(k)) || tokens > 2000) return "complex";
  if (codeKws.some((k) => text.includes(k)) || tokens > 500) return "medium";
  if (simpleKws.some((k) => text.toLowerCase().includes(k)) || tokens < 200) return "simple";
  return "medium";
}

function estimateSavings(original: string, actual: string, tokens: number): number {
  const origCost = MODEL_BLEND_COST[original.toLowerCase()] ?? 0.01;
  const actCost  = MODEL_BLEND_COST[actual.toLowerCase()]   ?? 0.01;
  return Math.max(0, (origCost - actCost) * (tokens / 1000));
}

export async function resolveModel(input: RouteInput): Promise<RouteResult> {
  const { userId, requestedModel, messages } = input;
  const db = createSupabaseAdmin();

  // Check if routing is enabled for user
  const { data: user } = await db.from("User").select("routingEnabled").eq("id", userId).single();
  if (!user?.routingEnabled) {
    return {
      model: requestedModel, provider: detectProvider(requestedModel),
      wasRouted: false, originalModel: requestedModel, routingSavings: 0,
    };
  }

  const text       = messages.map((m) => m.content).join(" ");
  const tokens     = Math.ceil(text.length / 4);
  const complexity = classifyComplexity(messages);

  // Check user's custom routing rules first
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
    if (cond.model && cond.model !== requestedModel) continue;
    if (cond.promptContains && Array.isArray(cond.promptContains)) {
      const hasAll = (cond.promptContains as string[]).every((kw) =>
        text.toLowerCase().includes(kw.toLowerCase())
      );
      if (!hasAll) continue;
    }

    const wasRouted = rule.targetModel !== requestedModel;
    return {
      model:          rule.targetModel,
      provider:       rule.provider ?? detectProvider(rule.targetModel),
      wasRouted,
      originalModel:  requestedModel,
      routingSavings: wasRouted ? estimateSavings(requestedModel, rule.targetModel, tokens) : 0,
    };
  }

  // Default routing for simple tasks
  if (complexity === "simple" && DEFAULT_ROUTING_MAP[requestedModel]) {
    const target = DEFAULT_ROUTING_MAP[requestedModel];
    return {
      model:          target.model,
      provider:       target.provider,
      wasRouted:      true,
      originalModel:  requestedModel,
      routingSavings: estimateSavings(requestedModel, target.model, tokens),
    };
  }

  return {
    model: requestedModel, provider: detectProvider(requestedModel),
    wasRouted: false, originalModel: requestedModel, routingSavings: 0,
  };
}
