const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 5.0, output: 15.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
  "claude-3-5-sonnet-20240620": { input: 3.0, output: 15.0 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
  "claude-3-opus-20240229": { input: 15.0, output: 75.0 },
  "gemini-1.5-pro": { input: 1.25, output: 5.0 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
};

export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const lowerModel = model.toLowerCase();
  const costs = MODEL_COSTS[lowerModel];

  if (!costs) {
    // Default to gpt-4o pricing for unknown models
    return (promptTokens * 5.0 + completionTokens * 15.0) / 1_000_000;
  }

  return (
    (promptTokens * costs.input + completionTokens * costs.output) / 1_000_000
  );
}

export function detectProvider(model: string): string {
  const lower = model.toLowerCase();
  if (lower.startsWith("gpt") || lower.startsWith("o1") || lower.startsWith("o3")) {
    return "openai";
  }
  if (lower.startsWith("claude")) {
    return "anthropic";
  }
  if (lower.startsWith("gemini")) {
    return "gemini";
  }
  return "openai";
}
