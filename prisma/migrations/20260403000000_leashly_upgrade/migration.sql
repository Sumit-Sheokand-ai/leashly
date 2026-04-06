-- Leashly Upgrade Migration
-- Paste this into Supabase SQL Editor and run it

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "RequestLog"
  ADD COLUMN IF NOT EXISTS "wasRouted"             BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "originalModel"         TEXT,
  ADD COLUMN IF NOT EXISTS "actualModel"           TEXT,
  ADD COLUMN IF NOT EXISTS "routingSavings"        FLOAT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "wasCacheHit"           BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "cacheSavings"          FLOAT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "wasCompressed"         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "originalPromptTokens"  INT,
  ADD COLUMN IF NOT EXISTS "compressedTokens"      INT,
  ADD COLUMN IF NOT EXISTS "compressionSavings"    FLOAT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalSavings"          FLOAT NOT NULL DEFAULT 0;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "billingModel"         TEXT NOT NULL DEFAULT 'flat',
  ADD COLUMN IF NOT EXISTS "cacheEnabled"         BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "routingEnabled"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "cacheTtlHours"        INT NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS "similarityThreshold"  FLOAT NOT NULL DEFAULT 0.97;

CREATE TABLE IF NOT EXISTS "RoutingRule" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"      TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "name"        TEXT NOT NULL,
  "condition"   JSONB NOT NULL DEFAULT '{}',
  "targetModel" TEXT NOT NULL,
  "provider"    TEXT NOT NULL,
  "priority"    INT NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "RoutingRule_userId_idx" ON "RoutingRule"("userId");

CREATE TABLE IF NOT EXISTS "CacheEntry" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"      TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "model"       TEXT NOT NULL,
  "promptHash"  TEXT NOT NULL,
  "embedding"   vector(1536),
  "response"    JSONB NOT NULL,
  "tokens"      INT NOT NULL DEFAULT 0,
  "cost"        FLOAT NOT NULL DEFAULT 0,
  "hitCount"    INT NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expiresAt"   TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX IF NOT EXISTS "CacheEntry_userId_idx"     ON "CacheEntry"("userId");
CREATE INDEX IF NOT EXISTS "CacheEntry_promptHash_idx" ON "CacheEntry"("promptHash");
CREATE INDEX IF NOT EXISTS "CacheEntry_embedding_hnsw"
  ON "CacheEntry" USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE TABLE IF NOT EXISTS "BenchmarkJob" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"      TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "status"      TEXT NOT NULL DEFAULT 'pending',
  "providers"   TEXT[] NOT NULL DEFAULT '{}',
  "testType"    TEXT NOT NULL DEFAULT 'short_factual',
  "results"     JSONB,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "completedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS "BenchmarkJob_userId_idx" ON "BenchmarkJob"("userId");

CREATE TABLE IF NOT EXISTS "Workspace" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name"          TEXT NOT NULL,
  "slug"          TEXT NOT NULL UNIQUE,
  "plan"          TEXT NOT NULL DEFAULT 'free',
  "monthlyBudget" FLOAT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "WorkspaceMember" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "workspaceId" TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  "userId"      TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "role"        TEXT NOT NULL DEFAULT 'developer',
  "joinedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("workspaceId", "userId")
);
CREATE INDEX IF NOT EXISTS "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");
CREATE INDEX IF NOT EXISTS "WorkspaceMember_userId_idx"      ON "WorkspaceMember"("userId");

CREATE OR REPLACE VIEW monthly_savings AS
SELECT
  "userId",
  date_trunc('month', "timestamp") AS month,
  SUM("totalCost")          AS total_spent,
  SUM("routingSavings")     AS routing_saved,
  SUM("cacheSavings")       AS cache_saved,
  SUM("compressionSavings") AS compression_saved,
  SUM("totalSavings")       AS total_saved
FROM "RequestLog"
GROUP BY "userId", date_trunc('month', "timestamp");

CREATE OR REPLACE FUNCTION update_cache_embedding(p_id TEXT, p_embedding vector(1536))
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE "CacheEntry" SET embedding = p_embedding WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION increment_cache_hits(p_id TEXT)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE "CacheEntry" SET "hitCount" = "hitCount" + 1 WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION match_cache_entries(
  query_embedding vector(1536), match_threshold FLOAT, match_count INT,
  p_user_id TEXT, p_model TEXT
)
RETURNS TABLE (id TEXT, response JSONB, cost FLOAT, similarity FLOAT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id, response, cost, 1 - (embedding <=> query_embedding) AS similarity
  FROM "CacheEntry"
  WHERE "userId" = p_user_id AND model = p_model AND "expiresAt" > now()
    AND embedding IS NOT NULL
    AND 1 - (embedding <=> query_embedding) >= match_threshold
  ORDER BY embedding <=> query_embedding LIMIT match_count;
$$;

ALTER TABLE "RoutingRule"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CacheEntry"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BenchmarkJob"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workspace"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkspaceMember" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rr_own"     ON "RoutingRule"     FOR ALL USING (auth.uid()::text = "userId");
CREATE POLICY "ce_own"     ON "CacheEntry"      FOR ALL USING (auth.uid()::text = "userId");
CREATE POLICY "bj_own"     ON "BenchmarkJob"    FOR ALL USING (auth.uid()::text = "userId");
CREATE POLICY "wm_own"     ON "WorkspaceMember" FOR ALL USING (auth.uid()::text = "userId");
CREATE POLICY "ws_members" ON "Workspace"       FOR ALL USING (
  EXISTS (SELECT 1 FROM "WorkspaceMember"
    WHERE "workspaceId" = "Workspace"."id" AND "userId" = auth.uid()::text)
);
