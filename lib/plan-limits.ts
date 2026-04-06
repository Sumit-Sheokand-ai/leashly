// lib/plan-limits.ts
export const PLAN_LIMITS = {
  free: {
    apiKeys:       2,
    rules:         2,
    alertRules:    2,
    teamMembers:   0,
    workspaces:    0,
    workspace:     false,
    cache:         false,
    requestsMonth: 10_000,
  },
  pro: {
    apiKeys:       30,
    rules:         30,
    alertRules:    30,
    teamMembers:   10,
    workspaces:    30,
    workspace:     true,
    cache:         true,
    requestsMonth: Infinity,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export function isPro(plan: string): boolean {
  return plan === "pro";
}
