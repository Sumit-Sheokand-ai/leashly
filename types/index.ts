export interface StatsData {
  totalSpendToday: number;
  requestsToday: number;
  flaggedToday: number;
  activeRules: number;
}

export interface RequestsPerHour {
  hour: string;
  count: number;
}

export interface CostPerModel {
  model: string;
  cost: number;
}

export interface ApiKeyRow {
  id: string;
  name: string;
  keyHash: string;
  proxyKey: string;
  provider: string;
  createdAt: string;
  isActive: boolean;
}

export interface RuleRow {
  id: string;
  name: string;
  type: "spend_cap" | "rate_limit" | "injection_filter";
  config: SpendCapConfig | RateLimitConfig | InjectionFilterConfig;
  isActive: boolean;
  createdAt: string;
}

export interface SpendCapConfig {
  dailyLimit?: number;
  weeklyLimit?: number;
  monthlyLimit?: number;
  action: "block" | "alert" | "both";
}

export interface RateLimitConfig {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  per: "account" | "api-key" | "ip";
}

export interface InjectionFilterConfig {
  enabled: boolean;
  sensitivity: "low" | "medium" | "high";
}

export interface LogRow {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  flagged: boolean;
  flagReason: string | null;
  durationMs: number;
  statusCode: number;
  apiKeyId: string;
}

export interface AlertRow {
  id: string;
  type: "spend_threshold" | "rate_exceeded" | "injection_detected";
  threshold: number;
  notifyEmail: string;
  isActive: boolean;
  createdAt: string;
}
