"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, ChevronRight } from "lucide-react";

function IC({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-[#0a0a0a] border border-[#1f1f1f] text-[#00ff88] text-xs font-mono px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}

function CodeBlock({ code, lang = "js", filename }: { code: string; lang?: string; filename?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg overflow-hidden border border-[#1f1f1f] bg-[#0a0a0a] my-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1f1f1f]">
        <span className="text-xs text-[#444444] font-mono">{filename ?? lang}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#00ff88] transition-colors font-mono"
        >
          {copied ? <><Check size={11} /> copied</> : <><Copy size={11} /> copy</>}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-[#cccccc] overflow-x-auto leading-relaxed">{code.trim()}</pre>
    </div>
  );
}

function Callout({ type = "info", children }: { type?: "info" | "warn" | "success"; children: React.ReactNode }) {
  const s = {
    info:    { border: "#00aaff33", bg: "#00aaff08", icon: "ℹ", color: "#00aaff" },
    warn:    { border: "#ffaa0033", bg: "#ffaa0008", icon: "⚠", color: "#ffaa00" },
    success: { border: "#00ff8833", bg: "#00ff8808", icon: "✓", color: "#00ff88" },
  }[type];
  return (
    <div className="my-4 rounded-lg px-4 py-3 flex items-start gap-3 text-sm" style={{ border: `1px solid ${s.border}`, background: s.bg }}>
      <span style={{ color: s.color }} className="shrink-0 mt-0.5">{s.icon}</span>
      <span className="text-[#888888] leading-relaxed">{children}</span>
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="font-mono text-base font-bold text-white mt-8 mb-3">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[#777777] text-sm leading-relaxed mb-3">{children}</p>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-[#111111] last:border-0">
      <span className="text-xs font-mono text-[#00ff88]">{label}</span>
      <span className="text-xs text-[#666666]">{value}</span>
    </div>
  );
}

const SECTIONS = [
  "Quick start",
  "Integration",
  "API Keys",
  "Rules",
  "Proxy API",
  "Security",
  "FAQ",
];

export default function DocsPage() {
  const [active, setActive] = useState("Quick start");

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3 text-xs font-mono">
          <Link href="/" className="text-[#00ff88]">Leashly</Link>
          <ChevronRight size={12} className="text-[#333333]" />
          <span className="text-[#555555]">Docs</span>
        </div>
        <h1 className="font-mono text-2xl font-bold text-white mb-2">Documentation</h1>
        <p className="text-[#555555] text-sm">Everything you need to integrate Leashly and stop surprise AI bills.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-40 shrink-0">
          <nav className="space-y-0.5 sticky top-6">
            {SECTIONS.map(s => (
              <button key={s} onClick={() => setActive(s)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono transition-all ${active === s ? "text-[#00ff88] bg-[#00ff88]/8" : "text-[#444444] hover:text-[#888888]"}`}>
                {s}
              </button>
            ))}
            <div className="pt-4 border-t border-[#1f1f1f] mt-4 space-y-1">
              <Link href="/register" className="block px-2 py-1.5 text-xs font-mono text-[#333333] hover:text-[#00ff88] transition-colors">
                Dashboard →
              </Link>
              <Link href="/" className="block px-2 py-1.5 text-xs font-mono text-[#333333] hover:text-[#888888] transition-colors">
                ← Home
              </Link>
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 bg-[#111111] border border-[#1f1f1f] rounded-xl p-6">

          {active === "Quick start" && (
            <div>
              <div className="inline-block bg-[#00ff88]/10 text-[#00ff88] text-xs font-mono px-2 py-0.5 rounded mb-4">Introduction</div>
              <H>What is Leashly?</H>
              <P>Leashly is an AI cost control proxy that sits between your app and any LLM provider. Enforce spend caps, rate limits, and injection protection — in one env var change.</P>
              <Callout type="success">Drop-in compatible with the OpenAI SDK. Zero code refactoring required.</Callout>

              <H>Quick start</H>
              <div className="space-y-3 mb-5">
                {[["1","Sign up at leashly.dev"],["2","Add your API key in Dashboard → API Keys"],["3","Copy your proxy key (lsh_xxx)"],["4","Set two env vars in your app"],["5","Configure spend caps and rate limits"]].map(([n,t])=>(
                  <div key={n} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#00ff88] text-black text-[10px] font-bold font-mono flex items-center justify-center shrink-0">{n}</span>
                    <span className="text-sm text-[#888888]">{t}</span>
                  </div>
                ))}
              </div>
              <CodeBlock filename=".env" lang="bash" code={`LEASHLY_KEY=lsh_xxxxxxxxxxxxxxxxxxxx
LEASHLY_BASE_URL=https://leashly.dev/api/proxy`} />
            </div>
          )}

          {active === "Integration" && (
            <div>
              <div className="inline-block bg-[#00aaff]/10 text-[#00aaff] text-xs font-mono px-2 py-0.5 rounded mb-4">Integration</div>
              <H>Node.js / TypeScript</H>
              <CodeBlock filename="lib/ai.ts" lang="js" code={`import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.LEASHLY_KEY,
  baseURL: process.env.LEASHLY_BASE_URL,
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});`} />
              <Callout type="info">The <IC>apiKey</IC> field accepts your <IC>lsh_xxx</IC> key. Your real provider key is never exposed to the client.</Callout>

              <H>Python</H>
              <CodeBlock filename="ai.py" lang="bash" code={`from openai import OpenAI
import os

client = OpenAI(
    api_key=os.environ["LEASHLY_KEY"],
    base_url=os.environ["LEASHLY_BASE_URL"],
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
)`} />

              <H>cURL</H>
              <CodeBlock lang="bash" code={`curl https://leashly.dev/api/proxy/chat/completions \\
  -H "Authorization: Bearer $LEASHLY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello!"}]}'`} />

              <H>Streaming</H>
              <P>Set <IC>stream: true</IC> — the proxy passes each SSE chunk through transparently, no buffering.</P>
              <CodeBlock filename="stream.ts" lang="js" code={`const stream = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Write me a poem' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '');
}`} />
              <Callout type="info">Streaming requests are still subject to your spend caps and rate limits. Token counting is done after the stream completes.</Callout>
            </div>
          )}

          {active === "API Keys" && (
            <div>
              <div className="inline-block bg-[#ffaa00]/10 text-[#ffaa00] text-xs font-mono px-2 py-0.5 rounded mb-4">API Keys</div>
              <H>Adding a key</H>
              <P>Go to Dashboard → API Keys → Add Key. Select your provider, name the key, and paste your real provider key. Leashly encrypts it with AES-256 immediately — you won't see it again.</P>
              <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
                <Row label="OpenAI" value="sk-..." />
                <Row label="Anthropic" value="sk-ant-..." />
                <Row label="Google Gemini" value="AIza..." />
                <Row label="Custom" value="any OpenAI-compatible endpoint" />
              </div>

              <H>Proxy keys (lsh_xxx)</H>
              <P>Your proxy key routes requests to the correct provider key. It can be individually toggled, deleted, or rotated without touching your real provider key.</P>
              <Callout type="success">If a proxy key is compromised, disable or delete it instantly from the dashboard. Your real provider key remains safe.</Callout>

              <H>Key security</H>
              <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
                <Row label="Provider key" value="AES-256-GCM encrypted (env-keyed)" />
                <Row label="Last 4 chars" value="Plain text (UI display only)" />
                <Row label="Proxy key" value="bcrypt hashed" />
                <Row label="Request content" value="Never stored" />
              </div>
            </div>
          )}

          {active === "Rules" && (
            <div>
              <div className="inline-block bg-[#ff4444]/10 text-[#ff4444] text-xs font-mono px-2 py-0.5 rounded mb-4">Rules</div>
              <H>Spend caps</H>
              <P>Set a dollar threshold per day, week, or month. When reached, Leashly blocks requests (429) or fires an alert — depending on your configured action.</P>
              <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
                <Row label="daily_limit" value="Max spend per calendar day (UTC)" />
                <Row label="weekly_limit" value="Max spend per Mon–Sun week (UTC)" />
                <Row label="monthly_limit" value="Max spend per calendar month (UTC)" />
                <Row label="action" value="block | alert | both" />
              </div>

              <H>Rate limits</H>
              <P>Cap requests per minute, hour, or day. When exceeded, Leashly returns <IC>429</IC> — no tokens consumed from your quota.</P>
              <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
                <Row label="per_minute" value="Max requests per 60s window" />
                <Row label="per_hour" value="Max requests per 60min window" />
                <Row label="per_day" value="Max requests per 24h window (UTC)" />
                <Row label="scope" value="account | api-key | ip" />
              </div>

              <H>Injection filter</H>
              <P>Scans every prompt for 50+ jailbreak and extraction patterns. Detected requests return <IC>403</IC> and are flagged in your logs.</P>
              <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
                <Row label="low" value="Obvious attacks only — very low false positives" />
                <Row label="medium" value="Balanced — recommended for production" />
                <Row label="high" value="Strict — may block edge-case safe prompts" />
              </div>
              <Callout type="warn">Spend is calculated in real time from token counts and model pricing. May lag by minutes in very high-volume scenarios.</Callout>
            </div>
          )}

          {active === "Proxy API" && (
            <div>
              <div className="inline-block bg-[#aa44ff]/10 text-[#aa44ff] text-xs font-mono px-2 py-0.5 rounded mb-4">Proxy API</div>
              <H>Base URL</H>
              <CodeBlock lang="bash" code="https://leashly.dev/api/proxy" />

              <H>Authentication</H>
              <CodeBlock lang="bash" code="Authorization: Bearer lsh_xxxxxxxxxxxxxxxxxxxx" />

              <H>Supported endpoints</H>
              <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
                <Row label="/chat/completions" value="OpenAI, Anthropic, Gemini ✓" />
                <Row label="/completions" value="OpenAI ✓" />
                <Row label="/embeddings" value="OpenAI ✓" />
                <Row label="/images/generations" value="OpenAI ✓" />
                <Row label="/models" value="OpenAI ✓" />
                <Row label="/messages" value="Anthropic native ✓" />
              </div>

              <H>Error responses</H>
              <P>All errors follow the OpenAI error format — your existing error handling works without changes.</P>
              <CodeBlock lang="json" code={`{
  "error": {
    "message": "Daily spend cap exceeded ($10.00 limit reached)",
    "type": "rate_limit_error",
    "code": "spend_cap_exceeded"
  }
}`} />
              <div className="border border-[#1f1f1f] rounded-lg overflow-hidden mt-3">
                <Row label="spend_cap_exceeded" value="429 — spend limit reached" />
                <Row label="rate_limit_exceeded" value="429 — request rate limit reached" />
                <Row label="injection_detected" value="403 — injection filter triggered" />
                <Row label="key_inactive" value="401 — proxy key is disabled" />
                <Row label="provider_error" value="502 — upstream provider error" />
              </div>
            </div>
          )}

          {active === "Security" && (
            <div>
              <div className="inline-block bg-[#00ff88]/10 text-[#00ff88] text-xs font-mono px-2 py-0.5 rounded mb-4">Security</div>
              <H>Encryption at rest</H>
              <P>All provider API keys are encrypted with AES-256-GCM before being stored. The encryption key is a separate environment variable — a database breach alone cannot expose your keys.</P>
              <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
                <Row label="Provider API keys" value="AES-256-GCM (env-keyed)" />
                <Row label="Proxy keys" value="bcrypt hashed" />
                <Row label="Request metadata" value="Plaintext (no sensitive content)" />
                <Row label="Prompt / completion text" value="Never stored" />
              </div>

              <H>Data privacy</H>
              <P>Leashly is a metadata-only proxy. We log token counts, costs, models, and latency — never the actual prompt text or completion content.</P>
              <Callout type="success">Safe to use with applications that handle sensitive or confidential data. Prompt content passes through in memory only and is never persisted.</Callout>

              <H>What we store</H>
              <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
                <Row label="Account email" value="Yes — login and notifications" />
                <Row label="Provider API key" value="Yes — AES-256 encrypted" />
                <Row label="Request metadata" value="Yes — tokens, cost, model, latency" />
                <Row label="Prompt content" value="No — never stored" />
                <Row label="Completion content" value="No — never stored" />
                <Row label="IP addresses" value="No — not logged" />
              </div>
            </div>
          )}

          {active === "FAQ" && (
            <div>
              <div className="inline-block bg-[#888888]/10 text-[#888888] text-xs font-mono px-2 py-0.5 rounded mb-4">FAQ</div>
              {[
                { q: "Does Leashly add latency?", a: "No. The proxy runs in the same region as your LLM provider. Typical overhead is under 5ms on warm connections." },
                { q: "Is my API key safe?", a: "Yes. Provider keys are encrypted with AES-256-GCM. We never log or return them in any response. A database breach alone cannot expose your keys." },
                { q: "Does it work with streaming?", a: "Yes. Set stream: true in your request — the proxy passes each SSE chunk through with no buffering or additional latency." },
                { q: "What providers do you support?", a: "OpenAI, Anthropic, and Google Gemini natively. Any OpenAI-compatible endpoint can be added as a custom provider." },
                { q: "Does Leashly store my prompts?", a: "No. Prompt and completion content is never stored. We log only metadata: token counts, cost, model, latency, and whether the request was flagged." },
                { q: "Can I use multiple API keys?", a: "Yes. Each key gets its own proxy key. Toggle, rotate, or delete individual keys without affecting others." },
                { q: "What happens when I hit a spend cap?", a: "Leashly returns a 429 with a structured JSON error. Your app receives a clean, handleable error with a descriptive message." },
                { q: "Can I self-host Leashly?", a: "Yes. Leashly is open-source. Deploy on Vercel, Railway, or any Node.js host with your own environment variables." },
              ].map(({ q, a }) => (
                <div key={q} className="border-b border-[#1a1a1a] py-4 last:border-0">
                  <p className="text-sm font-semibold text-white mb-1.5">{q}</p>
                  <p className="text-sm text-[#666666] leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs font-mono">
        <span className="text-[#2a2a2a]">Last updated March 2026</span>
        <Link href="/register" className="text-[#444444] hover:text-[#00ff88] transition-colors">
          Get started free →
        </Link>
      </div>
    </div>
  );
}
