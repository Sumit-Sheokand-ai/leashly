import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

const TEST_PROMPTS: Record<string, string[]> = {
  short_factual: ["What is the capital of France?", "What year was JavaScript created?", "What does HTTP stand for?", "List 3 cloud providers.", "What is a webhook?", "Explain JSON in one sentence."],
  code: ["Write a function to reverse a string in JavaScript.", "Write a Python function to check if a number is prime.", "Write a TypeScript interface for a User with name, email, and createdAt.", "Write a regex to validate email addresses.", "How do you debounce a function in JavaScript?"],
  long_form: ["Explain the difference between SQL and NoSQL databases in detail.", "What are the pros and cons of microservices architecture?", "Explain how HTTPS works step by step.", "What are the SOLID principles? Explain each one.", "Describe different caching strategies and when to use each."],
};

const MODEL_COSTS: Record<string, number> = {
  "gpt-4o":      0.010,
  "gpt-4o-mini": 0.000375,
};

// All models run on OpenAI API only
const PROVIDER_MODELS = [
  { model: "gpt-4o",      label: "GPT-4o" },
  { model: "gpt-4o-mini", label: "GPT-4o Mini" },
];

async function runTest(model: string, prompt: string, apiKey: string) {
  const start = Date.now();
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 300 }),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) return { latencyMs, tokens: 0, cost: 0, error: true };
    const data = await res.json();
    const tokens = data.usage?.total_tokens ?? 300;
    return { latencyMs, tokens, cost: (MODEL_COSTS[model] ?? 0.01) * (tokens / 1000), error: false };
  } catch {
    return { latencyMs: Date.now() - start, tokens: 0, cost: 0, error: true };
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { testType = "short_factual" } = await req.json();

  const { data: job } = await db
    .from("BenchmarkJob")
    .insert({ userId: user.id, status: "running", providers: ["openai"], testType })
    .select("id")
    .single();

  if (!job) return NextResponse.json({ error: "Failed to create job" }, { status: 500 });

  runBenchmark(job.id, user.id, testType).catch(console.error);

  return NextResponse.json({ jobId: job.id, status: "running" });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (jobId) {
    const { data } = await db.from("BenchmarkJob").select("*").eq("id", jobId).eq("userId", user.id).single();
    return NextResponse.json(data ?? { error: "Not found" });
  }

  const { data } = await db.from("BenchmarkJob").select("*").eq("userId", user.id).order("createdAt", { ascending: false }).limit(10);
  return NextResponse.json(data ?? []);
}

async function runBenchmark(jobId: string, userId: string, testType: string) {
  const db = createSupabaseAdmin();
  const prompts = (TEST_PROMPTS[testType] ?? TEST_PROMPTS.short_factual).slice(0, 5);
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  const results = [];

  for (const { model, label } of PROVIDER_MODELS) {
    const latencies: number[] = [];
    const costs: number[] = [];
    let errors = 0;

    for (const prompt of prompts) {
      const r = await runTest(model, prompt, apiKey);
      if (r.error) errors++;
      else { latencies.push(r.latencyMs); costs.push(r.cost); }
      await new Promise((res) => setTimeout(res, 300));
    }

    const sorted = [...latencies].sort((a, b) => a - b);
    results.push({
      provider: "openai",
      model,
      label,
      avgCost: costs.length ? costs.reduce((a, b) => a + b) / costs.length : 0,
      p50Ms: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
      p95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      errorRate: errors / prompts.length,
    });
  }

  await db.from("BenchmarkJob")
    .update({ status: "complete", results, completedAt: new Date().toISOString() })
    .eq("id", jobId);
}
