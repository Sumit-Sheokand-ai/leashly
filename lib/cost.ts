// lib/cost.ts — 2025 pricing (per 1M tokens, USD)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  // OpenAI
  "gpt-4o":                       { input: 2.50,  output: 10.00 },
  "gpt-4o-2024-11-20":            { input: 2.50,  output: 10.00 },
  "gpt-4o-mini":                  { input: 0.15,  output: 0.60  },
  "gpt-4o-mini-2024-07-18":       { input: 0.15,  output: 0.60  },
  "gpt-4-turbo":                  { input: 10.00, output: 30.00 },
  "gpt-4-turbo-2024-04-09":       { input: 10.00, output: 30.00 },
  "gpt-4":                        { input: 30.00, output: 60.00 },
  "gpt-3.5-turbo":                { input: 0.50,  output: 1.50  },
  "gpt-3.5-turbo-0125":           { input: 0.50,  output: 1.50  },
  "o1":                           { input: 15.00, output: 60.00 },
  "o1-mini":                      { input: 3.00,  output: 12.00 },
  "o3-mini":                      { input: 1.10,  output: 4.40  },
  "o4-mini":                      { input: 1.10,  output: 4.40  },

  // Anthropic
  "claude-opus-4-5":              { input: 15.00, output: 75.00 },
  "claude-sonnet-4-5":            { input: 3.00,  output: 15.00 },
  "claude-haiku-4-5":             { input: 0.80,  output: 4.00  },
  "claude-3-5-sonnet-20241022":   { input: 3.00,  output: 15.00 },
  "claude-3-5-sonnet-20240620":   { input: 3.00,  output: 15.00 },
  "claude-3-5-haiku-20241022":    { input: 0.80,  output: 4.00  },
  "claude-3-haiku-20240307":      { input: 0.25,  output: 1.25  },
  "claude-3-opus-20240229":       { input: 15.00, output: 75.00 },
  "claude-3-sonnet-20240229":     { input: 3.00,  output: 15.00 },

  // Google Gemini
  "gemini-2.0-flash":             { input: 0.10,  output: 0.40  },
  "gemini-2.0-flash-lite":        { input: 0.075, output: 0.30  },
  "gemini-1.5-pro":               { input: 1.25,  output: 5.00  },
  "gemini-1.5-flash":             { input: 0.075, output: 0.30  },
  "gemini-1.5-flash-8b":          { input: 0.0375,output: 0.15  },
};

export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const costs = MODEL_COSTS[model.toLowerCase()] ?? MODEL_COSTS["gpt-4o"];
  return (promptTokens * costs.input + completionTokens * costs.output) / 1_000_000;
}

export function getCostPer1K(model: string): { input: number; output: number } {
  const costs = MODEL_COSTS[model.toLowerCase()] ?? MODEL_COSTS["gpt-4o"];
  return { input: costs.input / 1000, output: costs.output / 1000 };
}

export function detectProvider(model: string): string {
  const m = model.toLowerCase();
  if (m.startsWith("gpt") || m.startsWith("o1") || m.startsWith("o3") || m.startsWith("o4")) return "openai";
  if (m.startsWith("claude")) return "anthropic";
  if (m.startsWith("gemini")) return "gemini";
  return "openai";
}

export function listModels(): Array<{ model: string; provider: string; inputPer1M: number; outputPer1M: number }> {
  return Object.entries(MODEL_COSTS).map(([model, costs]) => ({
    model,
    provider: detectProvider(model),
    inputPer1M: costs.input,
    outputPer1M: costs.output,
  }));
}
