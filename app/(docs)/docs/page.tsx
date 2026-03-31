"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search, ChevronRight, Copy, Check, Menu, X, ExternalLink,
  Zap, Shield, DollarSign, ScrollText, Key, Bell, Settings,
  BookOpen, Terminal, Code2, Layers, AlertTriangle, HelpCircle,
  ArrowRight, Github, Twitter
} from "lucide-react";

/* ─────────────────────────────────────────────
   NAV STRUCTURE
───────────────────────────────────────────── */
const NAV = [
  {
    group: "Getting Started",
    items: [
      { id: "introduction",     label: "Introduction",       icon: BookOpen },
      { id: "quickstart",       label: "Quickstart",         icon: Zap },
      { id: "how-it-works",     label: "How it works",       icon: Layers },
    ],
  },
  {
    group: "Integration",
    items: [
      { id: "installation",     label: "Installation",       icon: Terminal },
      { id: "nodejs",           label: "Node.js / TypeScript",icon: Code2 },
      { id: "python",           label: "Python",             icon: Code2 },
      { id: "curl",             label: "cURL / REST",        icon: Code2 },
      { id: "providers",        label: "Supported providers",icon: Layers },
    ],
  },
  {
    group: "Features",
    items: [
      { id: "api-keys",         label: "API Keys",           icon: Key },
      { id: "spend-caps",       label: "Spend caps",         icon: DollarSign },
      { id: "rate-limits",      label: "Rate limits",        icon: Zap },
      { id: "injection-filter", label: "Injection filter",   icon: Shield },
      { id: "logs",             label: "Request logs",       icon: ScrollText },
      { id: "alerts",           label: "Alerts",             icon: Bell },
    ],
  },
  {
    group: "Reference",
    items: [
      { id: "proxy-api",        label: "Proxy API",          icon: Code2 },
      { id: "error-codes",      label: "Error codes",        icon: AlertTriangle },
      { id: "security",         label: "Security",           icon: Shield },
      { id: "faq",              label: "FAQ",                icon: HelpCircle },
    ],
  },
];

/* ─────────────────────────────────────────────
   CODE BLOCK
───────────────────────────────────────────── */
function Code({ code, lang = "js", title }: { code: string; lang?: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-[#1a1a1a] overflow-hidden my-5">
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#111111] border-b border-[#1a1a1a]">
          <span className="text-xs font-mono text-[#555555]">{title}</span>
          <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-1.5 text-xs text-[#444444] hover:text-[#888888] transition-colors">
            {copied ? <Check size={11} className="text-[#00ff88]" /> : <Copy size={11} />}
            {copied ? "copied" : "copy"}
          </button>
        </div>
      )}
      {!title && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d0d] border-b border-[#141414]">
          <span className="text-[10px] font-mono text-[#333333] uppercase tracking-wider">{lang}</span>
          <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-1 text-xs text-[#333333] hover:text-[#666666] transition-colors">
            {copied ? <Check size={10} className="text-[#00ff88]" /> : <Copy size={10} />}
            {copied ? "copied" : "copy"}
          </button>
        </div>
      )}
      <pre className="p-4 overflow-x-auto bg-[#080808] text-sm font-mono leading-relaxed">
        <code className="text-[#cccccc]">{code.trim()}</code>
      </pre>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CALLOUT
───────────────────────────────────────────── */
function Callout({ type = "info", children }: { type?: "info" | "warn" | "tip" | "danger"; children: React.ReactNode }) {
  const styles = {
    info:   { bg: "#00aaff0d", border: "#00aaff25", icon: "ℹ", color: "#00aaff" },
    warn:   { bg: "#ffaa000d", border: "#ffaa0025", icon: "⚠", color: "#ffaa00" },
    tip:    { bg: "#00ff880d", border: "#00ff8825", icon: "✦", color: "#00ff88" },
    danger: { bg: "#ff44440d", border: "#ff444425", icon: "⚠", color: "#ff4444" },
  }[type];
  return (
    <div className="flex gap-3 rounded-xl px-4 py-3.5 my-5 text-sm leading-relaxed"
      style={{ background: styles.bg, border: `1px solid ${styles.border}` }}>
      <span style={{ color: styles.color }} className="shrink-0 mt-0.5">{styles.icon}</span>
      <div style={{ color: "#aaaaaa" }}>{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PROP TABLE
───────────────────────────────────────────── */
function PropTable({ rows }: { rows: Array<{ name: string; type: string; required?: boolean; desc: string }> }) {
  return (
    <div className="overflow-x-auto my-5 rounded-xl border border-[#1a1a1a]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#141414] bg-[#0d0d0d]">
            {["Name", "Type", "Description"].map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-[10px] text-[#444444] font-mono tracking-wider uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#0d0d0d]">
          {rows.map(r => (
            <tr key={r.name} className="bg-[#080808]">
              <td className="px-4 py-3 font-mono text-xs text-[#00ff88]">
                {r.name}{r.required && <span className="text-[#ff4444] ml-1">*</span>}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[#7c3aed]">{r.type}</td>
              <td className="px-4 py-3 text-xs text-[#888888]">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION CONTENT
───────────────────────────────────────────── */
const SECTIONS: Record<string, React.ReactNode> = {

  introduction: (
    <div>
      <h1>Introduction</h1>
      <p>Leashly is an AI cost control proxy that sits between your application and any LLM provider. It enforces spend caps, rate limits, and prompt injection protection without requiring any changes to your application code beyond a single environment variable.</p>

      <h2>What does Leashly do?</h2>
      <p>When your app makes a request to an LLM like GPT-4 or Claude, that request goes through Leashly first. Leashly checks your configured rules — spend caps, rate limits, injection filters — and either forwards the request to the provider or blocks it with a clean error response.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        {[
          { icon: DollarSign, color: "#00ff88", title: "Cost control", desc: "Daily, weekly, monthly spend caps per key or account" },
          { icon: Zap,        color: "#00aaff", title: "Rate limiting", desc: "Per-minute, per-hour request throttling" },
          { icon: Shield,     color: "#ff4444", title: "Injection protection", desc: "Blocks 50+ known jailbreak and extraction patterns" },
        ].map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
            <div className="p-2 rounded-lg w-fit mb-3" style={{ background: `${color}14` }}>
              <Icon size={15} style={{ color }} />
            </div>
            <p className="text-sm font-semibold text-white mb-1">{title}</p>
            <p className="text-xs text-[#555555]">{desc}</p>
          </div>
        ))}
      </div>

      <h2>Key concepts</h2>
      <p><strong className="text-[#e0e0e0]">Proxy key</strong> — A Leashly-issued key (prefixed <code>lsh_</code>) that your app uses instead of your real provider API key. Leashly maps this to your real key server-side.</p>
      <p><strong className="text-[#e0e0e0]">Rules</strong> — Configurable policies applied to every proxied request. Three types: spend caps, rate limits, and injection filters.</p>
      <p><strong className="text-[#e0e0e0]">Alerts</strong> — Email notifications triggered when a rule threshold is reached.</p>
      <p><strong className="text-[#e0e0e0]">Request log</strong> — A record of every proxied request including tokens, cost, duration, model, and provider.</p>

      <Callout type="tip">Your real API keys are never exposed to your frontend or logged anywhere. They are stored encrypted with AES-256 and only decrypted inside the proxy at request time.</Callout>
    </div>
  ),

  quickstart: (
    <div>
      <h1>Quickstart</h1>
      <p>Get up and running in under 5 minutes. No code changes required beyond a single environment variable.</p>

      <h2>Step 1 — Create an account</h2>
      <p>Go to <a href="https://leashly.dev/register" target="_blank" rel="noopener" className="text-[#00ff88] hover:underline">leashly.dev/register</a> and create a free account. No credit card required.</p>

      <h2>Step 2 — Add your API key</h2>
      <p>In the dashboard, go to <strong className="text-[#e0e0e0]">API Keys → Add Key</strong>. Paste your OpenAI, Anthropic, or Gemini key. It is encrypted at rest immediately — we never store or log it in plain text.</p>
      <p>You'll receive a proxy key that looks like <code>lsh_xxxxxxxxxxxxxxxxxxxx</code>.</p>

      <h2>Step 3 — Update your app</h2>
      <p>Replace your provider API key with your Leashly proxy key, and change the base URL:</p>
      <Code lang="bash" title=".env" code={`LEASHLY_KEY=lsh_xxxxxxxxxxxxxxxxxxxx`} />
      <Code lang="js" title="Before" code={`const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })`} />
      <Code lang="js" title="After" code={`const openai = new OpenAI({
  apiKey: process.env.LEASHLY_KEY,
  baseURL: "https://leashly.dev/api/proxy",
})`} />
      <Callout type="tip">That's the only change. Your existing OpenAI SDK calls, streaming, function calling — everything works exactly as before.</Callout>

      <h2>Step 4 — Set your first rule</h2>
      <p>In the dashboard, go to <strong className="text-[#e0e0e0]">Rules → Add Rule → Spend Cap</strong>. Set a daily limit of $10 to start. This will block requests if your spend exceeds $10 in a 24-hour window and return a clean 429 error your app can handle.</p>

      <h2>Step 5 — Make a request</h2>
      <p>Make any API call from your app as normal. Check the <strong className="text-[#e0e0e0]">Logs</strong> tab in the dashboard to see it appear in real time with token count, cost, and latency.</p>

      <Callout type="info">First request not showing? Make sure your <code>baseURL</code> points to <code>https://leashly.dev/api/proxy</code> and your proxy key starts with <code>lsh_</code>.</Callout>
    </div>
  ),

  "how-it-works": (
    <div>
      <h1>How it works</h1>
      <p>Leashly is a transparent HTTP proxy. It intercepts requests from your app, applies your configured rules, forwards compliant requests to the LLM provider, and logs the result.</p>

      <h2>Request flow</h2>
      <div className="bg-[#080808] border border-[#1a1a1a] rounded-xl p-5 my-5 font-mono text-xs space-y-2">
        {[
          ["1", "Your app sends a request to Leashly instead of OpenAI/Anthropic"],
          ["2", "Leashly validates the proxy key (lsh_xxx)"],
          ["3", "Leashly decrypts your real provider key"],
          ["4", "Leashly checks all active rules (spend cap, rate limit, injection filter)"],
          ["5", "If a rule blocks: returns 429 with JSON error body"],
          ["6", "If allowed: forwards request to LLM provider with real key"],
          ["7", "Streams or returns the response to your app"],
          ["8", "Logs the request (tokens, cost, duration, model, flagged status)"],
        ].map(([n, desc]) => (
          <div key={n} className="flex gap-3">
            <span className="text-[#00ff88] shrink-0">{n}.</span>
            <span className="text-[#666666]">{desc}</span>
          </div>
        ))}
      </div>

      <h2>Latency overhead</h2>
      <p>Leashly adds less than 5ms of overhead in most cases. The proxy runs in the same AWS region as your LLM provider (us-east-1 by default). Rule evaluation happens in-memory — no additional database round-trips on the hot path.</p>

      <h2>Streaming support</h2>
      <p>Leashly fully supports server-sent events (SSE) streaming responses. The proxy passes tokens through to your client in real time. Token and cost accounting happens after the stream completes.</p>

      <Callout type="info">Spend cap enforcement on streaming requests uses an estimated cost based on the model and prompt length. The final accurate cost is recorded after the stream ends.</Callout>

      <h2>Key security</h2>
      <p>Your real provider API keys are:</p>
      <ul>
        <li>Encrypted with AES-256 before storage</li>
        <li>Never returned in any API response</li>
        <li>Never logged in plain text</li>
        <li>Decrypted only in-memory at request time</li>
        <li>Tied to your account — unusable without your session</li>
      </ul>
    </div>
  ),

  installation: (
    <div>
      <h1>Installation</h1>
      <p>Leashly requires no package installation. It's a drop-in proxy — you just change one environment variable and one line of code.</p>

      <h2>Prerequisites</h2>
      <ul>
        <li>A Leashly account at <a href="https://leashly.dev/register" target="_blank" rel="noopener" className="text-[#00ff88] hover:underline">leashly.dev/register</a></li>
        <li>A proxy key (<code>lsh_xxx</code>) from the dashboard</li>
        <li>An existing app using OpenAI, Anthropic, or Gemini SDK</li>
      </ul>

      <h2>Environment variable</h2>
      <Code lang="bash" title=".env or .env.local" code={`# Your Leashly proxy key (from dashboard → API Keys)
LEASHLY_KEY=lsh_xxxxxxxxxxxxxxxxxxxx

# Base URL — same for all providers
LEASHLY_BASE_URL=https://leashly.dev/api/proxy`} />

      <h2>Proxy URL</h2>
      <p>All requests go to:</p>
      <Code lang="bash" code={`https://leashly.dev/api/proxy`} />
      <p>This single URL works for OpenAI, Anthropic, Gemini, and custom providers. Leashly routes based on your proxy key configuration.</p>

      <Callout type="warn">Never commit your <code>lsh_xxx</code> proxy key to a public repository. Treat it like a password.</Callout>
    </div>
  ),

  nodejs: (
    <div>
      <h1>Node.js / TypeScript</h1>
      <p>The official OpenAI Node.js SDK is fully compatible with Leashly. Change one line.</p>

      <h2>OpenAI</h2>
      <Code lang="ts" title="lib/ai.ts" code={`import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.LEASHLY_KEY!,
  baseURL: process.env.LEASHLY_BASE_URL ?? 'https://leashly.dev/api/proxy',
});

export default client;`} />

      <h2>Usage — Chat completion</h2>
      <Code lang="ts" code={`import client from '@/lib/ai';

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.choices[0].message.content);`} />

      <h2>Usage — Streaming</h2>
      <Code lang="ts" code={`const stream = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Write a poem.' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '');
}`} />

      <h2>Anthropic (via OpenAI-compatible endpoint)</h2>
      <Code lang="ts" code={`import OpenAI from 'openai';

// Use your Anthropic proxy key from Leashly dashboard
const client = new OpenAI({
  apiKey: process.env.LEASHLY_KEY!,
  baseURL: 'https://leashly.dev/api/proxy',
});

const response = await client.chat.completions.create({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{ role: 'user', content: 'Hello!' }],
});`} />

      <h2>Error handling</h2>
      <Code lang="ts" code={`import OpenAI from 'openai';

try {
  const response = await client.chat.completions.create({ ... });
} catch (err) {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 429) {
      // Could be Leashly rate limit / spend cap, or provider rate limit
      const body = err.error as { error?: { type?: string; message?: string } };
      if (body.error?.type === 'spend_cap_exceeded') {
        console.log('Daily spend cap exceeded');
      } else if (body.error?.type === 'rate_limit_error') {
        console.log('Rate limit hit');
      }
    }
  }
}`} />

      <Callout type="tip">All Leashly error responses mirror the OpenAI error format so your existing error handling works without changes.</Callout>
    </div>
  ),

  python: (
    <div>
      <h1>Python</h1>
      <p>The official OpenAI Python SDK works with Leashly out of the box.</p>

      <h2>Setup</h2>
      <Code lang="bash" code={`pip install openai`} />
      <Code lang="python" title=".env" code={`LEASHLY_KEY=lsh_xxxxxxxxxxxxxxxxxxxx
LEASHLY_BASE_URL=https://leashly.dev/api/proxy`} />

      <h2>Basic usage</h2>
      <Code lang="python" code={`import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["LEASHLY_KEY"],
    base_url=os.environ.get("LEASHLY_BASE_URL", "https://leashly.dev/api/proxy"),
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)`} />

      <h2>Streaming</h2>
      <Code lang="python" code={`with client.chat.completions.stream(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Write a poem."}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)`} />

      <h2>Async</h2>
      <Code lang="python" code={`from openai import AsyncOpenAI
import asyncio

client = AsyncOpenAI(
    api_key=os.environ["LEASHLY_KEY"],
    base_url="https://leashly.dev/api/proxy",
)

async def main():
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Hello!"}],
    )
    print(response.choices[0].message.content)

asyncio.run(main())`} />

      <h2>Error handling</h2>
      <Code lang="python" code={`from openai import OpenAI, RateLimitError, APIStatusError

try:
    response = client.chat.completions.create(...)
except RateLimitError as e:
    error_body = e.response.json()
    error_type = error_body.get("error", {}).get("type", "")
    if error_type == "spend_cap_exceeded":
        print("Spend cap exceeded — check Leashly dashboard")
    elif error_type == "rate_limit_error":
        print("Rate limit hit")
except APIStatusError as e:
    if e.status_code == 403:
        print("Request blocked — prompt injection detected")`} />
    </div>
  ),

  curl: (
    <div>
      <h1>cURL / REST</h1>
      <p>You can call Leashly directly via HTTP without any SDK.</p>

      <h2>Chat completion</h2>
      <Code lang="bash" code={`curl https://leashly.dev/api/proxy/chat/completions \\
  -H "Authorization: Bearer $LEASHLY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      { "role": "system", "content": "You are a helpful assistant." },
      { "role": "user",   "content": "Hello!" }
    ]
  }'`} />

      <h2>Streaming</h2>
      <Code lang="bash" code={`curl https://leashly.dev/api/proxy/chat/completions \\
  -H "Authorization: Bearer $LEASHLY_KEY" \\
  -H "Content-Type: application/json" \\
  --no-buffer \\
  -d '{
    "model": "gpt-4o",
    "messages": [{ "role": "user", "content": "Write a haiku." }],
    "stream": true
  }'`} />

      <h2>Response format</h2>
      <p>Leashly returns the exact same response format as the original provider. No parsing changes needed.</p>

      <h2>Error response format</h2>
      <Code lang="json" code={`{
  "error": {
    "message": "Daily spend cap exceeded ($10.00)",
    "type": "spend_cap_exceeded",
    "code": "spend_cap_exceeded"
  }
}`} />
    </div>
  ),

  providers: (
    <div>
      <h1>Supported providers</h1>
      <p>Leashly supports any provider with an OpenAI-compatible API.</p>

      <PropTable rows={[
        { name: "openai",    type: "string", desc: "OpenAI — GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo, o1, o3" },
        { name: "anthropic", type: "string", desc: "Anthropic — Claude 3.5 Sonnet, Claude 3 Haiku, Claude 3 Opus" },
        { name: "gemini",    type: "string", desc: "Google Gemini — Gemini 1.5 Pro, Gemini 1.5 Flash" },
        { name: "custom",    type: "string", desc: "Any OpenAI-compatible endpoint (Groq, Together AI, Ollama, etc.)" },
      ]} />

      <h2>Adding a custom provider</h2>
      <p>In the dashboard, when adding an API key, select <strong className="text-[#e0e0e0]">Custom</strong> as the provider. The proxy will forward requests to the standard OpenAI chat completions path.</p>

      <Callout type="info">Provider-specific endpoints (e.g. Anthropic's native API format) are not yet supported via the custom provider type. Use the OpenAI-compatible SDK interface for Anthropic.</Callout>
    </div>
  ),

  "api-keys": (
    <div>
      <h1>API Keys</h1>
      <p>Leashly uses two types of keys: your real provider keys (stored encrypted), and proxy keys (<code>lsh_xxx</code>) that your app uses.</p>

      <h2>How it works</h2>
      <p>When you add a provider key, Leashly:</p>
      <ol>
        <li>Encrypts it with AES-256 and stores the ciphertext</li>
        <li>Generates a unique proxy key prefixed with <code>lsh_</code></li>
        <li>Returns the proxy key to you — this is what your app uses</li>
      </ol>
      <p>At request time, Leashly decrypts your real key in-memory, uses it to call the provider, and never exposes it.</p>

      <h2>Proxy key format</h2>
      <Code lang="text" code={`lsh_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`} />
      <p>Proxy keys are 32-character alphanumeric strings prefixed with <code>lsh_</code>. They are tied to your account and specific provider.</p>

      <h2>Managing keys</h2>
      <p>In the dashboard under <strong className="text-[#e0e0e0]">API Keys</strong> you can:</p>
      <ul>
        <li>Add new keys (OpenAI, Anthropic, Gemini, Custom)</li>
        <li>Pause a key — requests using it return 401 until re-activated</li>
        <li>Delete a key — immediately invalidated, cannot be recovered</li>
        <li>View the last 4 characters of your real key for identification</li>
      </ul>

      <Callout type="danger">Deleting a key is permanent. Any apps using that proxy key will immediately start receiving 401 errors. You will need to add a new key and update your env vars.</Callout>

      <h2>Multiple keys</h2>
      <p>You can add multiple keys for the same provider. This is useful for separating environments (dev vs. prod) or attributing cost to different services.</p>
    </div>
  ),

  "spend-caps": (
    <div>
      <h1>Spend caps</h1>
      <p>Spend caps block or alert when your cumulative LLM spend exceeds a configured dollar threshold over a rolling time window.</p>

      <h2>Time windows</h2>
      <PropTable rows={[
        { name: "dailyLimit",   type: "number", desc: "Max spend in USD per 24-hour rolling window" },
        { name: "weeklyLimit",  type: "number", desc: "Max spend in USD per 7-day rolling window" },
        { name: "monthlyLimit", type: "number", desc: "Max spend in USD per 30-day rolling window" },
      ]} />

      <h2>Actions</h2>
      <PropTable rows={[
        { name: "block", type: "string", desc: "Return 429 to the caller — request never reaches the LLM" },
        { name: "alert", type: "string", desc: "Allow the request through but send an email notification" },
        { name: "both",  type: "string", desc: "Block the request AND send an email notification" },
      ]} />

      <h2>Error response when blocked</h2>
      <Code lang="json" code={`HTTP/1.1 429 Too Many Requests

{
  "error": {
    "message": "Daily spend cap exceeded ($10.00). Current spend: $10.43.",
    "type": "spend_cap_exceeded",
    "code": "spend_cap_exceeded"
  }
}`} />

      <h2>Cost calculation</h2>
      <p>Leashly calculates cost using standard per-token pricing for each model:</p>
      <Code lang="text" code={`cost = (promptTokens × inputPrice + completionTokens × outputPrice) / 1,000,000`} />
      <p>Costs are tracked in USD. Pricing data is updated regularly in the proxy.</p>

      <Callout type="warn">Spend caps apply to the account level, not per-user. If you need per-user limits, use a separate API key per user and apply a spend cap to each key.</Callout>
    </div>
  ),

  "rate-limits": (
    <div>
      <h1>Rate limits</h1>
      <p>Rate limits throttle the number of requests sent through the proxy within a time window, independently of cost.</p>

      <h2>Configuration</h2>
      <PropTable rows={[
        { name: "requestsPerMinute", type: "number", desc: "Max requests per 60-second rolling window" },
        { name: "requestsPerHour",   type: "number", desc: "Max requests per 60-minute rolling window" },
        { name: "requestsPerDay",    type: "number", desc: "Max requests per 24-hour rolling window" },
        { name: "per",               type: "string", desc: "Scope: 'account', 'api-key', or 'ip'" },
      ]} />

      <h2>Scope options</h2>
      <PropTable rows={[
        { name: "account", type: "string", desc: "Limit shared across all keys in your account" },
        { name: "api-key", type: "string", desc: "Limit tracked independently per proxy key" },
        { name: "ip",      type: "string", desc: "Limit tracked per client IP address (good for public-facing apps)" },
      ]} />

      <h2>Error response when throttled</h2>
      <Code lang="json" code={`HTTP/1.1 429 Too Many Requests

{
  "error": {
    "message": "Rate limit exceeded. 60 requests per minute allowed.",
    "type": "rate_limit_error",
    "code": "rate_limit_error"
  }
}`} />

      <Callout type="info">Leashly rate limits are independent of your LLM provider's own rate limits. If the provider returns a 429, that is passed through transparently.</Callout>
    </div>
  ),

  "injection-filter": (
    <div>
      <h1>Injection filter</h1>
      <p>The injection filter scans incoming prompts for known jailbreak patterns, prompt injection attacks, and system prompt extraction attempts before they reach the model.</p>

      <h2>Sensitivity levels</h2>
      <PropTable rows={[
        { name: "low",    type: "string", desc: "Blocks only clear, high-confidence attacks. Fewest false positives." },
        { name: "medium", type: "string", desc: "Balanced protection. Recommended for most production apps." },
        { name: "high",   type: "string", desc: "Strict mode. May block edge-case legitimate prompts." },
      ]} />

      <h2>What it detects</h2>
      <ul>
        <li>DAN (Do Anything Now) and similar jailbreak templates</li>
        <li>Prompt injection via user input (e.g. "Ignore previous instructions...")</li>
        <li>System prompt extraction attempts</li>
        <li>Role-play escapes ("pretend you have no restrictions")</li>
        <li>Token smuggling attacks (encoded instructions)</li>
        <li>50+ additional known attack patterns</li>
      </ul>

      <h2>Error response when blocked</h2>
      <Code lang="json" code={`HTTP/1.1 403 Forbidden

{
  "error": {
    "message": "Request blocked: prompt injection detected.",
    "type": "injection_blocked",
    "code": "injection_blocked"
  }
}`} />

      <h2>Flagged logs</h2>
      <p>All flagged requests are logged with the detection reason. In the dashboard, go to <strong className="text-[#e0e0e0]">Logs → Flagged only</strong> to view them. The Logs badge in the sidebar shows the unread flagged count.</p>

      <Callout type="warn">The injection filter scans the <code>messages</code> array only. System prompts set by the developer are not scanned — only user-provided content.</Callout>
    </div>
  ),

  logs: (
    <div>
      <h1>Request logs</h1>
      <p>Every proxied request is logged with full metadata. Logs are retained for 7 days on the Free plan and 90 days on Pro.</p>

      <h2>Log fields</h2>
      <PropTable rows={[
        { name: "id",               type: "string",  desc: "Unique request ID" },
        { name: "timestamp",        type: "datetime", desc: "When the request was received by the proxy" },
        { name: "provider",         type: "string",  desc: "LLM provider (openai, anthropic, gemini, custom)" },
        { name: "model",            type: "string",  desc: "Model name (e.g. gpt-4o, claude-3-5-sonnet-20241022)" },
        { name: "promptTokens",     type: "number",  desc: "Number of input tokens" },
        { name: "completionTokens", type: "number",  desc: "Number of output tokens" },
        { name: "totalCost",        type: "number",  desc: "Calculated cost in USD" },
        { name: "flagged",          type: "boolean", desc: "Whether the request was flagged by the injection filter" },
        { name: "flagReason",       type: "string?", desc: "Reason for flagging, if applicable" },
        { name: "durationMs",       type: "number",  desc: "Total request duration in milliseconds" },
        { name: "statusCode",       type: "number",  desc: "HTTP status code returned to your app" },
      ]} />

      <h2>Filtering logs</h2>
      <p>In the dashboard Logs page you can filter by provider, model, date range, and flagged status. Logs auto-refresh every 30 seconds.</p>

      <h2>Exporting logs</h2>
      <p>Click <strong className="text-[#e0e0e0]">CSV</strong> in the top right of the Logs page to export the current filtered view as a CSV file.</p>
    </div>
  ),

  alerts: (
    <div>
      <h1>Alerts</h1>
      <p>Alerts send email notifications when configured thresholds are crossed.</p>

      <h2>Alert types</h2>
      <PropTable rows={[
        { name: "spend_threshold",    type: "string", desc: "Fires when cumulative daily spend exceeds $threshold" },
        { name: "rate_exceeded",      type: "string", desc: "Fires when rate limit is hit N times in an hour" },
        { name: "injection_detected", type: "string", desc: "Fires when N injection attempts are detected in an hour" },
      ]} />

      <h2>Configuration</h2>
      <PropTable rows={[
        { name: "type",        type: "string",  required: true, desc: "Alert type (see above)" },
        { name: "threshold",   type: "number",  required: true, desc: "Dollar amount (spend) or count (rate/injection)" },
        { name: "notifyEmail", type: "string",  required: true, desc: "Email address to notify" },
        { name: "isActive",    type: "boolean", desc: "Whether the alert is enabled. Default: true" },
      ]} />

      <h2>Email delivery</h2>
      <p>Alert emails are sent via Resend from <code>noreply@leashly.dev</code>. Emails are sent within 60 seconds of threshold being crossed.</p>
      <p>You can mute an alert without deleting it by toggling it to <strong className="text-[#e0e0e0]">Muted</strong> in the dashboard.</p>

      <Callout type="info">In-app notifications appear in the bell icon in the dashboard header alongside email alerts.</Callout>
    </div>
  ),

  "proxy-api": (
    <div>
      <h1>Proxy API reference</h1>
      <p>The Leashly proxy exposes a single endpoint that routes to your configured LLM provider.</p>

      <h2>Base URL</h2>
      <Code lang="text" code={`https://leashly.dev/api/proxy`} />

      <h2>Authentication</h2>
      <p>Pass your proxy key as a Bearer token:</p>
      <Code lang="bash" code={`Authorization: Bearer lsh_xxxxxxxxxxxxxxxxxxxx`} />

      <h2>Supported paths</h2>
      <PropTable rows={[
        { name: "/chat/completions",        type: "POST", desc: "Chat completions (OpenAI compatible)" },
        { name: "/completions",             type: "POST", desc: "Text completions (legacy)" },
        { name: "/embeddings",              type: "POST", desc: "Embeddings" },
        { name: "/models",                  type: "GET",  desc: "List available models" },
      ]} />

      <h2>Request format</h2>
      <p>Identical to the OpenAI API. Leashly adds no custom fields to the request body.</p>

      <h2>Response format</h2>
      <p>Identical to the provider response. Leashly adds no custom headers or fields to successful responses.</p>

      <h2>Leashly-specific headers (response)</h2>
      <PropTable rows={[
        { name: "X-Leashly-Request-Id",  type: "string", desc: "Leashly log entry ID for this request" },
        { name: "X-Leashly-Cost",        type: "string", desc: "Calculated cost in USD (e.g. '0.00042')" },
        { name: "X-Leashly-Flagged",     type: "string", desc: "'true' if the injection filter was triggered" },
      ]} />
    </div>
  ),

  "error-codes": (
    <div>
      <h1>Error codes</h1>
      <p>Leashly returns structured JSON errors. All Leashly-generated errors mirror the OpenAI error format for drop-in compatibility.</p>

      <PropTable rows={[
        { name: "401 Unauthorized",      type: "invalid_api_key",      desc: "Proxy key is missing, malformed, or doesn't exist" },
        { name: "401 Unauthorized",      type: "key_inactive",         desc: "Proxy key exists but has been paused" },
        { name: "403 Forbidden",         type: "injection_blocked",    desc: "Request blocked by the injection filter" },
        { name: "429 Too Many Requests", type: "spend_cap_exceeded",   desc: "Account spend cap (daily/weekly/monthly) reached" },
        { name: "429 Too Many Requests", type: "rate_limit_error",     desc: "Request rate limit reached (Leashly-enforced)" },
        { name: "502 Bad Gateway",       type: "provider_error",       desc: "The upstream LLM provider returned an error" },
        { name: "503 Service Unavailable", type: "proxy_unavailable",  desc: "Leashly proxy is temporarily unavailable" },
      ]} />

      <h2>Error body format</h2>
      <Code lang="json" code={`{
  "error": {
    "message": "Human-readable description",
    "type": "error_type_code",
    "code": "error_type_code"
  }
}`} />

      <h2>Provider pass-through errors</h2>
      <p>If the LLM provider itself returns an error (e.g. their own 429 rate limit, 500 server error), Leashly passes the response through transparently. The <code>type</code> field will be the provider's own error type.</p>
    </div>
  ),

  security: (
    <div>
      <h1>Security</h1>
      <p>Security is a core design principle of Leashly, not an afterthought.</p>

      <h2>API key encryption</h2>
      <p>Your real LLM provider API keys are encrypted using AES-256-GCM before being stored. The encryption key is derived from a secret stored in the application environment, separate from the database.</p>
      <ul>
        <li>Keys are never stored or logged in plain text</li>
        <li>Decryption happens in-memory at request time only</li>
        <li>The last 4 characters of your key are stored as a hash for identification</li>
      </ul>

      <h2>Authentication</h2>
      <p>Leashly uses Supabase Auth for user authentication with:</p>
      <ul>
        <li>Email + password with email confirmation</li>
        <li>OAuth via Google and GitHub</li>
        <li>JWT session tokens with automatic refresh</li>
        <li>Server-side session validation on every API request</li>
      </ul>

      <h2>Proxy key security</h2>
      <p>Proxy keys (<code>lsh_xxx</code>) are:</p>
      <ul>
        <li>Cryptographically random 32-character strings</li>
        <li>Unique per key — cannot be guessed or derived</li>
        <li>Immediately invalidated when deleted</li>
        <li>Scoped to your account — cannot be used by other accounts</li>
      </ul>

      <h2>Data storage</h2>
      <p>Request logs contain no prompt or completion content — only metadata (tokens, cost, model, timing, flagged status). Your message content is never stored by Leashly.</p>

      <h2>Transport security</h2>
      <p>All traffic to and from Leashly uses TLS 1.2+. The proxy endpoint enforces HTTPS only.</p>

      <h2>Infrastructure</h2>
      <p>Leashly is hosted on Vercel (serverless) with a Supabase PostgreSQL database in <code>ca-central-1</code>. Vercel and Supabase are both SOC 2 Type II certified providers.</p>

      <Callout type="info">If you discover a security vulnerability, please email <strong className="text-[#e0e0e0]">security@leashly.dev</strong> before public disclosure.</Callout>
    </div>
  ),

  faq: (
    <div>
      <h1>FAQ</h1>

      {[
        { q: "Does Leashly add latency?",
          a: "No. The proxy adds less than 5ms overhead in typical operation. Rule evaluation happens in-memory with no additional database round trips on the hot path. The proxy runs in the same region as your LLM provider." },
        { q: "Is my API key safe?",
          a: "Yes. Keys are encrypted at rest with AES-256-GCM before storage. They are never logged, never returned in any API response, and only decrypted in-memory at request time." },
        { q: "Does it work with streaming?",
          a: "Yes. Leashly fully supports SSE streaming responses for all providers. Tokens are streamed through to your client in real time. Token and cost accounting happens after the stream completes." },
        { q: "What providers do you support?",
          a: "OpenAI, Anthropic (via OpenAI-compatible SDK), Google Gemini, and any OpenAI-compatible endpoint (Groq, Together AI, Ollama, etc.)." },
        { q: "What happens when I hit a spend cap?",
          a: "Leashly returns a 429 with a JSON error body: { error: { type: 'spend_cap_exceeded', message: '...' } }. Your app receives this exactly as if the LLM provider had returned a rate limit error — your existing error handling works without changes." },
        { q: "Can I use Leashly with function calling?",
          a: "Yes. Function calling, tool use, JSON mode, and all other model capabilities are fully supported. Leashly forwards the complete request payload to the provider unchanged." },
        { q: "Can I self-host Leashly?",
          a: "Leashly is open-source. You can deploy it on Vercel, Railway, or any Node.js host. You'll need a PostgreSQL database and a Supabase project for auth." },
        { q: "Does Leashly store my prompts?",
          a: "No. Request logs contain only metadata (tokens, cost, model, timing, flagged status). The content of your messages is never stored." },
        { q: "Can I set per-user rate limits?",
          a: "Currently, limits are applied per account or per API key. For per-user limits, create a separate API key for each user and apply rules to that key." },
        { q: "What does the injection filter actually check?",
          a: "It pattern-matches against 50+ known jailbreak templates, prompt injection phrases, DAN variants, role-play escapes, and system prompt extraction attempts. Medium sensitivity is recommended for production." },
      ].map(({ q, a }) => (
        <div key={q} className="mb-8">
          <h2 className="!text-base !mt-0">{q}</h2>
          <p>{a}</p>
        </div>
      ))}
    </div>
  ),
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function DocsPage() {
  const [active, setActive]           = useState("introduction");
  const [search, setSearch]           = useState("");
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const contentRef                    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Handle hash navigation
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && SECTIONS[hash]) setActive(hash);
  }, []);

  function navigate(id: string) {
    setActive(id);
    setMobileOpen(false);
    window.location.hash = id;
    contentRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }

  const allItems = NAV.flatMap(g => g.items);
  const filtered = search
    ? allItems.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div className="min-h-screen bg-[#080808] text-[#c8c8c8] flex flex-col">

      {/* ── TOP NAV ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-5 transition-all ${scrolled ? "bg-[#080808]/95 backdrop-blur-md border-b border-[#111111]" : "bg-transparent"}`}>
        <div className="flex items-center gap-4">
          <Link href="/" className="font-mono text-base font-bold flex items-center gap-0">
            <span className="text-[#00d972]">L</span><span className="text-white">eashly</span>
          </Link>
          <span className="text-[#1a1a1a]">/</span>
          <span className="text-sm text-[#555555]">Docs</span>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/" className="text-xs text-[#444444] hover:text-[#888888] transition-colors">Home</Link>
          <Link href="/register" className="text-xs bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold px-3 py-1.5 rounded-lg transition-colors">
            Get started free
          </Link>
        </div>
        <button className="md:hidden text-[#555555]" onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      <div className="flex flex-1 pt-14">

        {/* ── SIDEBAR ── */}
        <aside className={`
          fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-[240px] bg-[#080808] border-r border-[#111111]
          flex flex-col z-40 overflow-y-auto transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}>
          {/* Search */}
          <div className="px-3 py-3 border-b border-[#111111]">
            <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-3 py-2">
              <Search size={12} className="text-[#333333] shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search docs..."
                className="flex-1 bg-transparent text-xs text-[#888888] placeholder-[#333333] outline-none" />
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-2 py-3 overflow-y-auto">
            {filtered ? (
              <div>
                <p className="text-[10px] text-[#333333] px-2 mb-2 uppercase tracking-wider">Results</p>
                {filtered.length === 0 && (
                  <p className="text-xs text-[#333333] px-2 py-4">No results for "{search}"</p>
                )}
                {filtered.map(item => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={() => { navigate(item.id); setSearch(""); }}
                      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs text-[#888888] hover:text-white hover:bg-[#0d0d0d] transition-all text-left">
                      <Icon size={12} className="shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              NAV.map(group => (
                <div key={group.group} className="mb-5">
                  <p className="text-[10px] text-[#2a2a2a] px-2 mb-1.5 uppercase tracking-wider font-semibold">{group.group}</p>
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = active === item.id;
                    return (
                      <button key={item.id} onClick={() => navigate(item.id)}
                        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs transition-all text-left relative ${
                          isActive ? "bg-[#00ff88]/8 text-white" : "text-[#555555] hover:text-[#aaaaaa] hover:bg-[#0d0d0d]"
                        }`}>
                        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-[#00ff88] rounded-r" />}
                        <Icon size={12} className={`shrink-0 ${isActive ? "text-[#00ff88]" : ""}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </nav>

          {/* Sidebar footer */}
          <div className="px-3 py-3 border-t border-[#111111] flex items-center gap-3">
            <a href="https://github.com" target="_blank" rel="noopener"
              className="text-[#333333] hover:text-[#888888] transition-colors">
              <Github size={14} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener"
              className="text-[#333333] hover:text-[#888888] transition-colors">
              <Twitter size={14} />
            </a>
            <span className="text-[10px] text-[#222222] font-mono ml-auto">v0.1.0</span>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* ── CONTENT ── */}
        <main ref={contentRef} className="flex-1 md:ml-[240px] min-h-full">
          <div className="max-w-[720px] mx-auto px-6 md:px-10 py-10">

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-[#333333] mb-8 font-mono">
              <span>docs</span>
              <ChevronRight size={10} />
              <span className="text-[#555555]">
                {allItems.find(i => i.id === active)?.label}
              </span>
            </div>

            {/* Section content */}
            <div className="
              prose-docs
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:font-mono [&_h1]:mb-3 [&_h1]:mt-0 [&_h1]:tracking-tight
              [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[#dddddd] [&_h2]:mt-9 [&_h2]:mb-3 [&_h2]:border-t [&_h2]:border-[#111111] [&_h2]:pt-6
              [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-[#cccccc] [&_h3]:mt-6 [&_h3]:mb-2
              [&_p]:text-sm [&_p]:text-[#888888] [&_p]:leading-7 [&_p]:mb-4
              [&_ul]:text-sm [&_ul]:text-[#888888] [&_ul]:leading-7 [&_ul]:mb-4 [&_ul]:list-none [&_ul]:pl-0
              [&_ul_li]:relative [&_ul_li]:pl-4 [&_ul_li]:mb-1.5
              [&_ul_li]:before:content-['—'] [&_ul_li]:before:absolute [&_ul_li]:before:left-0 [&_ul_li]:before:text-[#333333]
              [&_ol]:text-sm [&_ol]:text-[#888888] [&_ol]:leading-7 [&_ol]:mb-4 [&_ol]:pl-5 [&_ol]:space-y-1.5
              [&_code]:font-mono [&_code]:text-xs [&_code]:bg-[#111111] [&_code]:text-[#00ff88] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
              [&_a]:text-[#00ff88] [&_a]:no-underline [&_a:hover]:underline
              [&_strong]:text-[#dddddd] [&_strong]:font-medium
            ">
              {SECTIONS[active] ?? (
                <div className="text-center py-20 text-[#333333]">
                  <p>Section not found</p>
                </div>
              )}
            </div>

            {/* Prev / Next navigation */}
            <div className="flex items-center justify-between mt-16 pt-8 border-t border-[#111111]">
              {(() => {
                const idx = allItems.findIndex(i => i.id === active);
                const prev = allItems[idx - 1];
                const next = allItems[idx + 1];
                return (
                  <>
                    {prev ? (
                      <button onClick={() => navigate(prev.id)}
                        className="flex items-center gap-2 text-xs text-[#444444] hover:text-[#888888] transition-colors">
                        ← {prev.label}
                      </button>
                    ) : <div />}
                    {next ? (
                      <button onClick={() => navigate(next.id)}
                        className="flex items-center gap-2 text-xs text-[#444444] hover:text-[#888888] transition-colors">
                        {next.label} →
                      </button>
                    ) : <div />}
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-[#0d0d0d] flex items-center justify-between">
              <span className="text-[10px] text-[#222222] font-mono">© 2025 Leashly</span>
              <div className="flex items-center gap-4">
                <Link href="/" className="text-[10px] text-[#222222] hover:text-[#555555] transition-colors">Home</Link>
                <Link href="/register" className="text-[10px] text-[#222222] hover:text-[#555555] transition-colors">Get started</Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
