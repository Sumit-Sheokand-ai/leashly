"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Shield, BarChart2, Zap, ChevronDown, Menu, X } from "lucide-react";

const STRIPE_PRO_LINK = "https://buy.stripe.com/3cI28t53XdWv2hH5WL9Ve09";

/* ─── Typewriter hook ─── */
function useTypewriter(lines: string[], speed = 35) {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  useEffect(() => {
    if (currentLine >= lines.length) return;
    if (currentChar < lines[currentLine].length) {
      const t = setTimeout(() => {
        setDisplayed(prev => {
          const next = [...prev];
          next[currentLine] = (next[currentLine] ?? "") + lines[currentLine][currentChar];
          return next;
        });
        setCurrentChar(c => c + 1);
      }, speed);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setCurrentLine(l => l + 1); setCurrentChar(0); }, 300);
      return () => clearTimeout(t);
    }
  }, [currentLine, currentChar, lines, speed]);
  return displayed;
}

/* ─── Scroll fade-in ─── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function FadeSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useFadeIn();
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}>
      {children}
    </div>
  );
}

/* ─── Code block ─── */
function CodeBlock({ code, lang = "js" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.trim().split("\n");
  const KEYWORDS = new Set(["import", "from", "const", "await", "new", "return", "os"]);

  function highlight(line: string) {
    if (lang === "bash") return <span className="text-[#f0f0f0]">{line}</span>;
    const parts = line.split(/(\/\/.*$|"[^"]*"|'[^']*'|`[^`]*`)/);
    return parts.map((part, i) => {
      if (!part) return null;
      if (part.startsWith("//")) return <span key={i} className="text-[#555555] italic">{part}</span>;
      if ((part.startsWith('"') || part.startsWith("'") || part.startsWith("`")) && part.length > 1)
        return <span key={i} className="text-[#ffaa00]">{part}</span>;
      const words = part.split(/(\b(?:import|from|const|await|new|return|os)\b)/);
      return (
        <span key={i}>
          {words.map((w, j) =>
            w && KEYWORDS.has(w) ? <span key={j} className="text-[#00aaff]">{w}</span>
            : w ? <span key={j}>{w}</span> : null
          )}
        </span>
      );
    });
  }

  return (
    <div className="relative bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1f1f1f]">
        <span className="text-xs text-[#444444] font-mono">{lang}</span>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-xs text-[#666666] hover:text-[#00ff88] transition-colors font-mono">
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="w-full font-mono text-sm">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                <td className="text-[#333333] text-right pr-4 select-none w-8 text-xs">{i + 1}</td>
                <td className="text-[#f0f0f0] whitespace-pre">{highlight(line)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── FAQ ─── */
const FAQS = [
  { q: "Does Leashly add latency?", a: "No. The proxy runs in the same region as your LLM provider. Typical overhead is under 5ms." },
  { q: "Is my API key safe?", a: "Yes. Keys are encrypted at rest with AES-256. We never log or expose them in any response." },
  { q: "Does it work with streaming?", a: "Yes. Leashly fully supports server-sent events (SSE) streaming responses, passing them through transparently." },
  { q: "What providers do you support?", a: "OpenAI, Anthropic, Google Gemini, and any OpenAI-compatible endpoint. Add custom endpoints in the dashboard." },
  { q: "What happens when I hit a spend cap?", a: 'Leashly returns a 429 with a clear JSON error: { error: { message: "Daily spend cap exceeded", type: "rate_limit_error" } }. Your app gets a clean error to handle.' },
  { q: "Can I self-host it?", a: "Yes. Leashly is open-source. Deploy it on Vercel, Railway, or any Node.js host in minutes with a single .env change." },
];

function Accordion({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#1f1f1f]">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left text-white hover:text-[#00ff88] transition-colors">
        <span className="font-medium text-sm">{q}</span>
        <ChevronDown size={16} className={`text-[#666666] transition-transform shrink-0 ml-4 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-40 mb-4" : "max-h-0"}`}>
        <p className="text-sm text-[#999999] leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

const CODE_EXAMPLES: Record<string, { lang: string; code: string }> = {
  "Node.js": { lang: "js", code: `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.LEASHLY_KEY,      // your lsh_xxx key
  baseURL: 'https://leashly.dev/api/proxy',
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});` },
  Python: { lang: "bash", code: `from openai import OpenAI
import os

client = OpenAI(
    api_key=os.environ["LEASHLY_KEY"],
    base_url="https://leashly.dev/api/proxy",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
)` },
  cURL: { lang: "bash", code: `curl https://leashly.dev/api/proxy/chat/completions \\
  -H "Authorization: Bearer $LEASHLY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'` },
};

const TERMINAL_LINES = [
  "$ checking monthly spend...",
  "",
  "OpenAI invoice: $41,847.32",
  "⚠  Alert: 94% from user_id: 8821",
  "⚠  Alert: Spike detected 2:14am - 6:08am",
  "⚠  Alert: 847,000 tokens in 4 hours",
  "   cause:      no rate limits configured",
  "   prevention: none",
];

const HERO_CODE = `// Before
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// After — that's it.
const openai = new OpenAI({
  apiKey: "lsh_xxxxxxxxxxxx",
  baseURL: "https://leashly.dev/api/proxy"
})`;

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Node.js");
  const terminal = useTypewriter(TERMINAL_LINES, 30);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #1f1f1f 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.5 }} />

      {/* ─── NAVBAR ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled ? "bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1f1f1f]" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-mono text-xl font-bold">
            <span className="text-[#00ff88]">Leash</span><span className="text-white">ly</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/docs" className="text-sm text-[#999999] hover:text-white transition-colors">Docs</Link>
            <a href="#pricing" className="text-sm text-[#999999] hover:text-white transition-colors">Pricing</a>
            <Link href="/login" className="text-sm text-[#999999] hover:text-white transition-colors">Sign in</Link>
            <Link href="/register" className="bg-[#00ff88] hover:bg-[#00cc6e] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Get started free
            </Link>
          </div>
          <button className="md:hidden text-[#999999]" onClick={() => setMobileMenuOpen(o => !o)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#111111] border-b border-[#1f1f1f] px-6 py-4 space-y-4">
            <Link href="/docs" className="block text-sm text-[#999999]">Docs</Link>
            <a href="#pricing" className="block text-sm text-[#999999]">Pricing</a>
            <Link href="/login" className="block text-sm text-[#999999]">Sign in</Link>
            <Link href="/register" className="block bg-[#00ff88] text-black text-sm font-semibold px-4 py-2 rounded-lg text-center">
              Get started free
            </Link>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-36 pb-24 px-6 max-w-5xl mx-auto text-center">
        <h1 className="font-mono text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
          Stop flying blind<br /><span className="text-[#00ff88]">on AI costs.</span>
        </h1>
        <p className="text-xl text-[#999999] max-w-2xl mx-auto mb-8 leading-relaxed">
          Leashly sits between your app and any LLM provider. Enforce spend caps, rate limits, and prompt injection protection — in one env var change.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link href="/register" className="bg-[#00ff88] hover:bg-[#00cc6e] text-black font-semibold px-6 py-3 rounded-lg text-base transition-colors">
            Get started free →
          </Link>
          <Link href="/docs" className="border border-[#1f1f1f] hover:border-[#00ff88] text-[#f0f0f0] px-6 py-3 rounded-lg text-base transition-colors">
            Read the docs
          </Link>
        </div>
        <p className="text-sm text-[#444444] mb-10 font-mono">No credit card required · 5 minute setup · Works with OpenAI, Anthropic, Gemini</p>
        <div className="max-w-2xl mx-auto">
          <CodeBlock code={HERO_CODE} lang="js" />
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─── */}
      <FadeSection>
        <div className="border-y border-[#1f1f1f] py-5 px-6">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
            <span className="text-sm text-[#444444] font-mono sm:mr-8">Protecting AI spend for 200+ teams</span>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {["Acme Corp", "Buildfast", "NovaMind", "Layerstack", "Shipyard"].map((name, i, arr) => (
                <span key={name} className="font-mono text-xs text-[#333333]">
                  {name}{i < arr.length - 1 ? <span className="mx-3 text-[#222222]">·</span> : null}
                </span>
              ))}
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ─── PROBLEM ─── */}
      <FadeSection>
        <section className="py-24 px-6 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-mono text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
                One abusive user.<br />One overnight script.<br /><span className="text-[#ff4444]">$40,000 bill.</span>
              </h2>
              <p className="text-[#999999] leading-relaxed mb-4">
                There are no guardrails between your app and the LLM API. One misconfigured feature, one abusive user, or one runaway script — and your next invoice is unrecognizable.
              </p>
              <p className="text-[#999999] leading-relaxed">
                No rate limits means no friction for abuse. No spend caps means no ceiling on damage. No attribution means no idea which user, feature, or bug caused it.
              </p>
            </div>
            <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-6 font-mono text-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-[#ff4444]" />
                <div className="w-3 h-3 rounded-full bg-[#ffaa00]" />
                <div className="w-3 h-3 rounded-full bg-[#00ff88]" />
                <span className="text-[#333333] text-xs ml-2">terminal</span>
              </div>
              <div className="space-y-1 min-h-[180px]">
                {TERMINAL_LINES.map((line, i) => {
                  const shown = terminal[i] ?? "";
                  const isWarning = line.startsWith("⚠");
                  return (
                    <div key={i} className={`${isWarning ? "text-[#ff4444]" : line.startsWith("   ") ? "text-[#666666]" : line.startsWith("$") ? "text-[#00ff88]" : "text-[#f0f0f0]"}`}>
                      {shown}
                      {i === Math.min(terminal.length, TERMINAL_LINES.length - 1) && shown.length < line.length && (
                        <span className="animate-pulse">█</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ─── HOW IT WORKS ─── */}
      <FadeSection>
        <section className="py-24 px-6 max-w-6xl mx-auto" id="how-it-works">
          <h2 className="font-mono text-3xl md:text-4xl font-bold text-white text-center mb-4">One proxy. Full control.</h2>
          <p className="text-[#666666] text-center mb-16 max-w-xl mx-auto">The same interface your SDK already uses. Zero refactoring.</p>
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: Shield, color: "#ff4444", title: "Enforce rules", desc: "Set spend caps per user, per day, per model. Rate limits that actually work. Injection filter that catches attacks before they hit the model." },
              { icon: BarChart2, color: "#00aaff", title: "See everything", desc: "Every token, every request, every dollar — attributed to the exact user, feature, and model that spent it. No more mystery invoices." },
              { icon: Zap, color: "#00ff88", title: "Zero code changes", desc: "Change one environment variable. Leashly is fully compatible with the OpenAI SDK. Your app doesn't know the difference." },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-6">
                <div className="p-3 rounded-lg w-fit mb-4" style={{ background: `${color}18` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="font-mono font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-[#999999] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-0 flex-wrap">
            {[
              { label: "Your App", sub: "OpenAI SDK" },
              null,
              { label: "Leashly Proxy", sub: "rate limits · spend caps · injection filter", highlight: true },
              null,
              { label: "LLM Provider", sub: "OpenAI / Anthropic / Gemini" },
            ].map((item, i) => {
              if (!item) return (
                <div key={i} className="flex items-center mx-2">
                  <div className="w-8 h-px bg-[#333333]" />
                  <div className="text-[#333333] text-lg">→</div>
                  <div className="w-8 h-px bg-[#333333]" />
                </div>
              );
              return (
                <div key={i} className="border rounded-xl px-5 py-3 text-center"
                  style={{ background: item.highlight ? "#00ff8820" : "#1a1a1a", borderColor: item.highlight ? "#00ff88" : "#1f1f1f" }}>
                  <div className="font-mono font-bold text-white text-sm">{item.label}</div>
                  <div className="text-xs mt-1" style={{ color: item.highlight ? "#00ff88" : "#666666" }}>{item.sub}</div>
                </div>
              );
            })}
          </div>
        </section>
      </FadeSection>

      {/* ─── FEATURES ─── */}
      <FadeSection>
        <section className="py-24 px-6 max-w-6xl mx-auto">
          <h2 className="font-mono text-3xl md:text-4xl font-bold text-white text-center mb-4">Everything you need to ship AI safely</h2>
          <p className="text-[#666666] text-center mb-12">Built for production from day one.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "💰", title: "Spend caps", desc: "Daily, weekly, monthly limits per key or per user. Block or alert when thresholds are hit." },
              { icon: "⚡", title: "Rate limiting", desc: "Per-minute, per-hour throttling with token bucket algorithm. Per account, key, or IP." },
              { icon: "🛡️", title: "Prompt injection shield", desc: "Blocks 50+ known jailbreak and extraction patterns. Three sensitivity levels." },
              { icon: "📊", title: "Cost attribution", desc: "See exactly which user and feature is burning money. Full model breakdown." },
              { icon: "🔔", title: "Real-time alerts", desc: "Email and in-app notifications when spend thresholds or rate limits are hit." },
              { icon: "📋", title: "Full audit logs", desc: "Every request logged with tokens, cost, duration, model, and flag reason." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="font-mono font-bold text-white mb-2 text-sm">{title}</h3>
                <p className="text-xs text-[#999999] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeSection>

      {/* ─── CODE EXAMPLES ─── */}
      <FadeSection>
        <section className="py-24 px-6 max-w-4xl mx-auto">
          <h2 className="font-mono text-3xl md:text-4xl font-bold text-white text-center mb-4">Works with every LLM SDK</h2>
          <p className="text-[#666666] text-center mb-10">One line change. Drop-in compatible.</p>
          <div className="flex gap-1 mb-4">
            {Object.keys(CODE_EXAMPLES).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-mono transition-colors ${activeTab === tab ? "bg-[#00ff88] text-black font-semibold" : "text-[#666666] hover:text-white"}`}>
                {tab}
              </button>
            ))}
          </div>
          <CodeBlock code={CODE_EXAMPLES[activeTab].code} lang={CODE_EXAMPLES[activeTab].lang} />
        </section>
      </FadeSection>

      {/* ─── PRICING ─── */}
      <FadeSection>
        <section className="py-24 px-6 max-w-4xl mx-auto" id="pricing">
          <h2 className="font-mono text-3xl md:text-4xl font-bold text-white text-center mb-4">Simple pricing.</h2>
          <p className="text-[#666666] text-center mb-12">Saves itself in the first week.</p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-6">
              <h3 className="font-mono font-bold text-white mb-1">Free</h3>
              <div className="flex items-end gap-1 mb-1">
                <span className="font-mono text-3xl font-bold text-white">$0</span>
                <span className="text-[#666666] text-sm mb-1">/mo</span>
              </div>
              <p className="text-xs text-[#555555] mb-5">Forever free for indie devs</p>
              <ul className="space-y-2.5 mb-6">
                {["10,000 proxied requests/mo", "1 API key", "Basic rate limiting", "7-day log retention", "Community support"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#999999]">
                    <span className="text-[#00ff88] mt-0.5 shrink-0">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold border border-[#1f1f1f] hover:border-[#00ff88] text-[#f0f0f0] transition-colors">
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-[#111111] border border-[#00ff88] rounded-xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00ff88] text-black text-xs font-bold px-3 py-1 rounded-full font-mono">
                Most popular
              </div>
              <h3 className="font-mono font-bold text-white mb-1">Pro</h3>
              <div className="flex items-end gap-1 mb-1">
                <span className="font-mono text-3xl font-bold text-white">$9</span>
                <span className="text-[#666666] text-sm mb-1">CAD/mo</span>
              </div>
              <p className="text-xs text-[#555555] mb-5">Billed monthly · Cancel anytime</p>
              <ul className="space-y-2.5 mb-6">
                {["Unlimited requests", "10 API keys", "All rule types", "90-day log retention", "Email alerts", "Priority support"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#999999]">
                    <span className="text-[#00ff88] mt-0.5 shrink-0">✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href={STRIPE_PRO_LINK} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-[#00ff88] hover:bg-[#00cc6e] text-black transition-colors">
                Upgrade to Pro →
              </a>
            </div>
          </div>

          <p className="text-center text-xs text-[#444444] font-mono mt-6">
            Need more? <a href="mailto:hello@leashly.dev" className="text-[#555555] hover:text-[#00ff88] underline transition-colors">Contact us</a> for custom plans.
          </p>
        </section>
      </FadeSection>

      {/* ─── FAQ ─── */}
      <FadeSection>
        <section className="py-24 px-6 max-w-3xl mx-auto">
          <h2 className="font-mono text-3xl font-bold text-white text-center mb-12">FAQ</h2>
          {FAQS.map(faq => <Accordion key={faq.q} q={faq.q} a={faq.a} />)}
        </section>
      </FadeSection>

      {/* ─── CTA ─── */}
      <FadeSection>
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto bg-[#111111] border border-[#00ff88]/20 rounded-2xl p-12 text-center"
            style={{ boxShadow: "0 0 60px rgba(0,255,136,0.05)" }}>
            <h2 className="font-mono text-3xl md:text-4xl font-bold text-white mb-4">Start protecting your AI spend today.</h2>
            <p className="text-[#999999] mb-8">Free forever for indie devs. No credit card required.</p>
            <Link href="/register"
              className="inline-block bg-[#00ff88] hover:bg-[#00cc6e] text-black font-bold px-8 py-3 rounded-lg text-lg transition-colors font-mono">
              Create your free account →
            </Link>
            <div className="mt-6 flex items-center justify-center gap-2 text-[#444444] text-sm">
              <span>or</span>
              <Link href="/docs" className="text-[#666666] hover:text-[#00ff88] transition-colors underline underline-offset-4">
                Read the docs
              </Link>
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#1f1f1f] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {[
              { title: "Product", links: [{ label: "Features", href: "/#how-it-works" }, { label: "Pricing", href: "/#pricing" }, { label: "Docs", href: "/docs" }, { label: "Dashboard", href: "/dashboard" }] },
              { title: "Developers", links: [{ label: "API Reference", href: "/docs" }, { label: "Quick start", href: "/docs" }, { label: "GitHub", href: "https://github.com/Sumit-Sheokand-ai/leashly" }, { label: "Status", href: "#" }] },
              { title: "Account", links: [{ label: "Sign in", href: "/login" }, { label: "Sign up", href: "/register" }, { label: "Settings", href: "/dashboard/settings" }, { label: "Upgrade to Pro", href: STRIPE_PRO_LINK }] },
              { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }, { label: "Security", href: "/docs" }, { label: "Contact", href: "mailto:hello@leashly.dev" }] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="font-mono text-xs font-bold text-[#666666] uppercase tracking-wider mb-4">{title}</h4>
                <ul className="space-y-2.5">
                  {links.map(link => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-[#444444] hover:text-[#f0f0f0] transition-colors">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-[#1f1f1f] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-mono text-xs text-[#333333]">© 2025 Leashly. Built for developers.</span>
            <div className="flex gap-4">
              <a href="https://github.com/Sumit-Sheokand-ai/leashly" target="_blank" rel="noopener noreferrer"
                className="text-[#444444] hover:text-white transition-colors font-mono text-xs">GitHub</a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                className="text-[#444444] hover:text-white transition-colors font-mono text-xs">X / Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
