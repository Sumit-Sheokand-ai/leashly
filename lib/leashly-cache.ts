// lib/leashly-cache.ts
import { createHash } from "crypto";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const EMBED_MODEL = "text-embedding-3-small";

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: EMBED_MODEL, input: text.slice(0, 8000) }),
  });
  if (!res.ok) throw new Error(`Embedding error: ${res.status}`);
  const data = await res.json();
  return data.data[0].embedding as number[];
}

function hashPrompt(messages: unknown[]): string {
  return createHash("sha256").update(JSON.stringify(messages)).digest("hex");
}

function messagesToText(messages: Array<{ role: string; content: string }>): string {
  return messages.map((m) => `${m.role}: ${m.content}`).join("\n");
}

async function safeIncrementHits(id: string): Promise<void> {
  try {
    const db = createSupabaseAdmin();
    await db.rpc("increment_cache_hits", { p_id: id });
  } catch {}
}

export interface CacheHit {
  response: unknown;
  cacheId: string;
  savedCost: number;
}

export async function checkCache(
  userId: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  estimatedCost: number
): Promise<CacheHit | null> {
  const db = createSupabaseAdmin();
  const promptHash = hashPrompt(messages);

  // 1. Exact match
  const { data: exact } = await db
    .from("CacheEntry")
    .select("id, response")
    .eq("userId", userId)
    .eq("model", model)
    .eq("promptHash", promptHash)
    .gt("expiresAt", new Date().toISOString())
    .maybeSingle();

  if (exact) {
    void safeIncrementHits(exact.id);
    return { response: exact.response, cacheId: exact.id, savedCost: estimatedCost };
  }

  // 2. Check cache enabled
  const { data: user } = await db.from("User").select("cacheEnabled, similarityThreshold").eq("id", userId).single();
  if (!user?.cacheEnabled) return null;

  const threshold = user.similarityThreshold ?? 0.97;

  // 3. Semantic match
  let embedding: number[];
  try {
    embedding = await generateEmbedding(messagesToText(messages));
  } catch {
    return null;
  }

  const { data: matches } = await db.rpc("match_cache_entries", {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: 1,
    p_user_id: userId,
    p_model: model,
  });

  if (!matches?.length) return null;

  const match = matches[0];
  void safeIncrementHits(match.id);

  return { response: match.response, cacheId: match.id, savedCost: estimatedCost };
}

export async function storeCache(
  userId: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  response: unknown,
  tokens: number,
  cost: number,
  ttlHours: number = 24
): Promise<void> {
  const db = createSupabaseAdmin();
  const promptHash = hashPrompt(messages);
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();

  const { data: entry } = await db
    .from("CacheEntry")
    .insert({ userId, model, promptHash, response, tokens, cost, expiresAt })
    .select("id")
    .single();

  if (!entry) return;

  try {
    const embedding = await generateEmbedding(messagesToText(messages));
    await db.rpc("update_cache_embedding", { p_id: entry.id, p_embedding: embedding });
  } catch {}
}

export async function flushCache(userId: string): Promise<number> {
  const db = createSupabaseAdmin();
  const { data } = await db.from("CacheEntry").delete().eq("userId", userId).select("id");
  return data?.length ?? 0;
}

export async function getCacheStats(userId: string) {
  const db = createSupabaseAdmin();
  const { data: entries } = await db.from("CacheEntry").select("hitCount, cost").eq("userId", userId);
  const totalEntries = entries?.length ?? 0;
  const totalHits = entries?.reduce((s, e) => s + (e.hitCount ?? 0), 0) ?? 0;
  const totalRequests = totalHits + totalEntries;
  const hitRate = totalRequests > 0 ? Math.round((totalHits / totalRequests) * 100) : 0;
  const { data: savings } = await db.from("RequestLog").select("cacheSavings").eq("userId", userId).eq("wasCacheHit", true);
  const moneySaved = savings?.reduce((s, r) => s + (r.cacheSavings ?? 0), 0) ?? 0;
  return { totalEntries, totalHits, hitRate, moneySaved };
}
