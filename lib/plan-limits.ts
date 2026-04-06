// lib/plan-limits.ts
// Single source of truth for all plan limits

export const PLAN_LIMITS = {
  free: {
    apiKeys:       2,
    alertRules:    2,
    teamMembers:   0,   // no workspace
    workspace:     false,
    cache:         false,
    requestsMonth: 10_000,
  },
  pro: {
    apiKeys:       10,
    alertRules:    20,
    teamMembers:   10,
    workspace:     true,
    cache:         true,
    requestsMonth: Infinity,
  },
  usage_based: {
    apiKeys:       10,
    alertRules:    20,
    teamMembers:   10,
    workspace:     true,
    cache:         true,
    requestsMonth: Infinity,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export function isPro(plan: string): boolean {
  return plan === "pro" || plan === "usage_based";
}
