export const INJECTION_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /ignore (all |previous |above |prior )?instructions/i, reason: "Ignore instructions attack" },
  { pattern: /forget (all |your |previous |above )?instructions/i, reason: "Forget instructions attack" },
  { pattern: /disregard (all |previous |above )?instructions/i, reason: "Disregard instructions attack" },
  { pattern: /you are now (in |a |an )?(developer|jailbreak|DAN|unrestricted)/i, reason: "Role override attempt" },
  { pattern: /\bDAN\b.*jailbreak/i, reason: "DAN jailbreak attempt" },
  { pattern: /do anything now/i, reason: "DAN jailbreak pattern" },
  { pattern: /bypass (your |all |safety |content )?filter/i, reason: "Filter bypass attempt" },
  { pattern: /act as (if you have no|without any) (restrictions|guidelines|filters)/i, reason: "Restriction bypass" },
  { pattern: /pretend (you|that you) (are|have no) (restrictions|guidelines)/i, reason: "Pretend bypass" },
  { pattern: /system prompt/i, reason: "System prompt extraction attempt" },
  { pattern: /reveal (your |the |original |full |complete )?(system |initial |first )?prompt/i, reason: "Prompt extraction" },
  { pattern: /what (is|are|were) your (original |initial |full |first )?instructions/i, reason: "Instruction extraction" },
  { pattern: /print (your |the )?system message/i, reason: "System message extraction" },
  { pattern: /show (me )?(your |the )?system prompt/i, reason: "System prompt disclosure" },
  { pattern: /\bsocial security number\b/i, reason: "SSN PII pattern" },
  { pattern: /\bpassword\b.*\b(is|:)\s*\S+/i, reason: "Password disclosure pattern" },
  { pattern: /\bcredit card\b.*\d{4}/i, reason: "Credit card PII pattern" },
  { pattern: /execute (malicious|arbitrary|shell|system) (code|commands?)/i, reason: "Code execution attempt" },
  { pattern: /rm -rf|sudo (rm|chmod|chown)|\/etc\/passwd/i, reason: "Shell command injection" },
  { pattern: /<script[^>]*>[\s\S]*?<\/script>/i, reason: "Script injection" },
  { pattern: /\beval\s*\(|document\.cookie|localStorage\./i, reason: "JS injection pattern" },
  { pattern: /override (the |your )?(safety|content) (settings|policy|guidelines)/i, reason: "Safety override" },
  { pattern: /unlimited (access|mode|capabilities)/i, reason: "Unlimited access request" },
  { pattern: /developer mode (on|enabled|activated)/i, reason: "Developer mode activation" },
];

export type InjectionSensitivity = "low" | "medium" | "high";

const SENSITIVITY_THRESHOLDS: Record<InjectionSensitivity, number> = {
  low: 3,
  medium: 1,
  high: 1,
};

const HIGH_SENSITIVITY_ONLY = new Set([
  "SSN PII pattern",
  "Credit card PII pattern",
  "Password disclosure pattern",
]);

export function checkInjection(
  text: string,
  sensitivity: InjectionSensitivity = "medium"
): { flagged: boolean; reason?: string } {
  const threshold = SENSITIVITY_THRESHOLDS[sensitivity];
  const matches: string[] = [];

  for (const { pattern, reason } of INJECTION_PATTERNS) {
    if (sensitivity === "low" && HIGH_SENSITIVITY_ONLY.has(reason)) continue;
    if (pattern.test(text)) {
      matches.push(reason);
    }
  }

  if (matches.length >= threshold) {
    return { flagged: true, reason: matches.slice(0, 3).join("; ") };
  }

  return { flagged: false };
}

export function extractPromptText(body: unknown): string {
  if (typeof body !== "object" || body === null) return "";
  const b = body as Record<string, unknown>;

  // OpenAI format
  if (Array.isArray(b.messages)) {
    return (b.messages as Array<{ role: string; content: unknown }>)
      .map((m) => (typeof m.content === "string" ? m.content : ""))
      .join(" ");
  }

  // Anthropic format
  if (typeof b.prompt === "string") return b.prompt;
  if (Array.isArray(b.messages)) {
    return (b.messages as Array<{ role: string; content: unknown }>)
      .map((m) => (typeof m.content === "string" ? m.content : ""))
      .join(" ");
  }

  return "";
}
