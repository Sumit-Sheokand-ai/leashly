// lib/leashly-compressor.ts
import { calculateCost } from "@/lib/cost";

export type CompressionLevel = "light" | "medium" | "aggressive";

export interface CompressionResult {
  compressedSystemPrompt: string;
  originalTokens: number;
  compressedTokens: number;
  savedTokens: number;
  compressionSavings: number;
}

const PROMPTS: Record<CompressionLevel, string> = {
  light:      "Compress this system prompt to fewer tokens while preserving all instructions. Return ONLY the compressed prompt.",
  medium:     "Compress this system prompt aggressively. Remove all redundancy and filler. Keep only essential instructions. Return ONLY the compressed prompt.",
  aggressive: "Compress this system prompt to absolute minimum tokens. Remove every non-essential word. Return ONLY the final compressed prompt.",
};

function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function compressSystemPrompt(
  systemPrompt: string,
  targetModel: string,
  level: CompressionLevel = "medium"
): Promise<CompressionResult> {
  const originalTokens = countTokens(systemPrompt);

  if (originalTokens < 50) {
    return { compressedSystemPrompt: systemPrompt, originalTokens, compressedTokens: originalTokens, savedTokens: 0, compressionSavings: 0 };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini", // cheapest — only for compression
      max_tokens: originalTokens,
      messages: [
        { role: "system", content: PROMPTS[level] },
        { role: "user", content: systemPrompt },
      ],
    }),
  });

  if (!res.ok) {
    return { compressedSystemPrompt: systemPrompt, originalTokens, compressedTokens: originalTokens, savedTokens: 0, compressionSavings: 0 };
  }

  const data = await res.json();
  const compressed: string = data.choices[0].message.content.trim();
  const compressedTokens = countTokens(compressed);

  if (compressedTokens >= originalTokens) {
    return { compressedSystemPrompt: systemPrompt, originalTokens, compressedTokens: originalTokens, savedTokens: 0, compressionSavings: 0 };
  }

  const savedTokens = originalTokens - compressedTokens;
  const compressionSavings = calculateCost(targetModel, savedTokens, 0);

  return { compressedSystemPrompt: compressed, originalTokens, compressedTokens, savedTokens, compressionSavings };
}
