"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Shield, BarChart2, Zap, ChevronDown, Menu, X, TrendingDown, Database, Minimize2 } from "lucide-react";

const STRIPE_PRO_LINK = "https://buy.stripe.com/3cI28t53XdWv2hH5WL9Ve09";

/* ─── Typewriter ─── */
function useTypewriter(lines: string[], speed = 28) {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [cLine, setCLine]   = useState(0);
  const [cChar, setCChar]   = useState(0);
  useEffect(() => {
    if (cLine >= lines.length) return;
    if (cChar < lines[cLine].length) {
      const t = setTimeout(() => {
        setDisplayed(p => { const n=[...p]; n[cLine]=(n[cLine]??"")+lines[cLine][cChar]; return n; });
        setCChar(c=>c+1);
      }, speed);
      return ()=>clearTimeout(t);
    } else {
      const t = setTimeout(()=>{setCLine(l=>l+1);setCChar(0);}, 250);
      return ()=>clearTimeout(t);
    }
  },[cLine,cChar,lines,speed]);
  return displayed;
}

/* ─── Scroll fade ─── */
function useFadeIn(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(()=>{
    const el=ref.current; if(!el) return;
    const ob=new IntersectionObserver(([e])=>{if(e.isIntersecting){setVisible(true);ob.disconnect();}},{threshold});
    ob.observe(el); return()=>ob.disconnect();
  },[threshold]);
  return {ref,visible};
}
function FadeSection({children,className="",delay=0}:{children:React.ReactNode;className?:string;delay?:number}) {
  const {ref,visible}=useFadeIn();
  return (
    <div ref={ref} style={{transitionDelay:`${delay}ms`}}
      className={`transition-all duration-700 ease-out ${visible?"opacity-100 translate-y-0":"opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
}

/* ─── Code block ─── */
function CodeBlock({code,lang="js"}:{code:string;lang?:string}) {
  const [copied,setCopied]=useState(false);
  const lines=code.trim().split("\n");
  const KW=new Set(["import","from","const","await","new","return","os"]);
  function hi(line:string) {
    if(lang==="bash") return <span className="text-[var(--text-bright)]">{line}</span>;
    const parts=line.split(/(\/\/.*$|"[^"]*"|'[^']*'|`[^`]*`)/);
    return parts.map((p,i)=>{
      if(!p) return null;
      if(p.startsWith("//")) return <span key={i} className="text-[var(--text-ghost)] italic">{p}</span>;
      if((p.startsWith('"')||p.startsWith("'")||p.startsWith("`"))&&p.length>1) return <span key={i} className="text-[var(--warning)]">{p}</span>;
      const words=p.split(/(\b(?:import|from|const|await|new|return|os)\b)/);
      return <span key={i}>{words.map((w,j)=>w&&KW.has(w)?<span key={j} className="text-[var(--blue)]">{w}</span>:w?<span key={j}>{w}</span>:null)}</span>;
    });
  }
  return (
    <div className="bg-[var(--surface-0)] border border-[var(--border-mid)] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-dim)]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--danger)] opacity-60"/>
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning)] opacity-60"/>
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--green)] opacity-60"/>
        </div>
        <span className="text-xs text-[var(--text-ghost)] font-mono">{lang}</span>
        <button onClick={()=>{navigator.clipboard.writeText(code);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
          className="text-xs text-[var(--text-ghost)] hover:text-[var(--green)] transition-colors font-mono">
          {copied?"✓ copied":"copy"}
        </button>
      </div>
      <div className="p-5 overflow-x-auto">
        <table className="w-full font-mono text-sm">
          <tbody>
            {lines.map((line,i)=>(
              <tr key={i}>
                <td className="text-[var(--text-ghost)] text-right pr-4 select-none w-8 text-xs">{i+1}</td>
                <td className="text-[var(--text-bright)] whitespace-pre">{hi(line)}</td>
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
  {q:"Does Leashly add latency?",a:"No. The proxy runs in the same region as your LLM provider. Typical overhead is under 5ms."},
  {q:"Is my API key safe?",a:"Yes. Keys are encrypted at rest with AES-256-CBC. We never log or expose them in any response."},
  {q:"Does it work with streaming?",a:"Yes. Leashly fully supports server-sent events (SSE) streaming responses, passing them through transparently."},
  {q:"What providers do you support?",a:"OpenAI, Anthropic, Google Gemini, and any OpenAI-compatible endpoint. Add custom endpoints in the dashboard."},
  {q:"What happens when I hit a spend cap?",a:'Leashly returns a 429 with a clean JSON error. Your app gets a structured error to handle gracefully.'},
  {q:"Can I self-host it?",a:"Yes. Leashly is open-source. Deploy on Vercel, Railway, or any Node.js host in minutes."},
];
function Accordion({q,a}:{q:string;a:string}) {
  const [open,setOpen]=useState(false);
  return (
    <div className="border-b border-[var(--border-dim)]">
      <button onClick={()=>setOpen(o=>!o)}
        className="w-full flex items-center justify-between py-5 text-left text-white hover:text-[var(--green)] transition-colors">
        <span className="font-medium text-sm">{q}</span>
        <ChevronDown size={15} className={`text-[var(--text-ghost)] transition-transform shrink-0 ml-4 ${open?"rotate-180":""}`}/>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open?"max-h-40 mb-5":"max-h-0"}`}>
        <p className="text-sm text-[var(--text-dim)] leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

const CODE_EXAMPLES: Record<string,{lang:string;code:string}> = {
  "Node.js":{lang:"js",code:`import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.LEASHLY_KEY,      // your lsh_xxx key
  baseURL: 'https://leashly.dev/api/proxy',
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});`},
  Python:{lang:"bash",code:`from openai import OpenAI
import os

client = OpenAI(
    api_key=os.environ["LEASHLY_KEY"],
    base_url="https://leashly.dev/api/proxy",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
)`},
  cURL:{lang:"bash",code:`curl https://leashly.dev/api/proxy/chat/completions \\
  -H "Authorization: Bearer $LEASHLY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello!"}]}'`},
};

const TERMINAL_LINES = [
  "$ checking monthly spend...",
  "",
  "OpenAI invoice:  $41,847.32",
  "⚠  Alert: 94% from user_id: 8821",
  "⚠  Alert: Spike 2:14am — 6:08am",
  "⚠  Alert: 847,000 tokens in 4 hours",
  "   cause:      no rate limits",
  "   fix:        install Leashly",
];

const HERO_CODE = `// Before
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// After — one line change. That's it.
const openai = new OpenAI({
  apiKey: "lsh_xxxxxxxxxxxx",
  baseURL: "https://leashly.dev/api/proxy"
})`;

// Savings numbers — shown in hero
const SAVINGS = [
  { icon: TrendingDown, label: "Smart routing",   value: "$341", color: "var(--blue)",   bg: "var(--blue-glow)" },
  { icon: Database,     label: "Cache hits",       value: "$198", color: "var(--violet)", bg: "var(--violet-glow)" },
  { icon: Minimize2,    label: "Compression",      value: "$73",  color: "var(--warning)",bg: "rgba(255,170,68,0.08)" },
];

export default function LandingPage() {
  const [scrolled,setScrolled]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [activeTab,setActiveTab]=useState("Node.js");
  const terminal=useTypewriter(TERMINAL_LINES,28);

  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>24);
    window.addEventListener("scroll",fn,{passive:true});
    return()=>window.removeEventListener("scroll",fn);
  },[]);

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--text-bright)]">

      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none dot-grid opacity-40"/>

      {/* Subtle radial glow at top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{background:"radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.04) 0%, transparent 70%)"}}/>

      {/* ─── NAV ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled?"bg-[var(--surface-0)]/90 backdrop-blur-xl border-b border-[var(--border-dim)]":"bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-mono text-xl font-bold tracking-tight">
            <span className="text-[var(--green)]">Leash</span><span className="text-white">ly</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {[{label:"Docs",href:"/docs"},{label:"Pricing",href:"#pricing"},{label:"Sign in",href:"/login"}].map(item=>(
              <a key={item.label} href={item.href}
                className="text-sm text-[var(--text-dim)] hover:text-white transition-colors">
                {item.label}
              </a>
            ))}
            <Link href="/register"
              className="btn btn-primary text-sm">
              Get started free
            </Link>
          </div>
          <button className="md:hidden text-[var(--text-dim)]" onClick={()=>setMobileOpen(o=>!o)}>
            {mobileOpen?<X size={20}/>:<Menu size={20}/>}
          </button>
        </div>
        {mobileOpen&&(
          <div className="md:hidden bg-[var(--surface-2)] border-b border-[var(--border-dim)] px-6 py-5 space-y-4 animate-fade-up">
            <a href="/docs"      className="block text-sm text-[var(--text-dim)]">Docs</a>
            <a href="#pricing"  className="block text-sm text-[var(--text-dim)]">Pricing</a>
            <a href="/login"    className="block text-sm text-[var(--text-dim)]">Sign in</a>
            <Link href="/register" className="block btn btn-primary text-center">Get started free</Link>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-40 pb-28 px-6 max-w-5xl mx-auto text-center">
        <div className="animate-fade-up">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 badge badge-green mb-8 text-xs font-mono">
            <span className="status-dot status-dot-green"/>
            AI optimization proxy · Now with smart routing + cache
          </div>

          <h1 className="font-mono text-5xl md:text-[68px] font-bold text-white leading-[1.05] tracking-tight mb-6 text-balance">
            Stop flying blind<br />
            <span style={{background:"linear-gradient(90deg, var(--green) 0%, var(--teal) 50%, var(--blue) 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text"}}>
              on AI costs.
            </span>
          </h1>

          <p className="text-lg text-[var(--text-dim)] max-w-xl mx-auto mb-10 leading-relaxed">
            Leashly sits between your app and any LLM. Enforce spend caps, rate limits, injection protection — and actively cut your bill with smart routing and semantic caching.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
            <Link href="/register"
              className="btn btn-primary px-8 py-3 text-base">
              Get started free →
            </Link>
            <Link href="/docs"
              className="btn btn-ghost px-8 py-3 text-base">
              Read the docs
            </Link>
          </div>
          <p className="text-xs text-[var(--text-ghost)] font-mono">No credit card · 5 minute setup · OpenAI · Anthropic · Gemini</p>
        </div>

        {/* Savings trio */}
        <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto animate-fade-up" style={{animationDelay:"120ms"}}>
          {SAVINGS.map(s=>(
            <div key={s.label} className="card p-4 text-center" style={{borderColor:`${s.color}22`}}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{background:s.bg}}>
                <s.icon size={15} style={{color:s.color}}/>
              </div>
              <div className="font-mono text-xl font-bold" style={{color:s.color}}>{s.value}</div>
              <div className="text-xs text-[var(--text-ghost)] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-ghost)] font-mono mt-3">avg. monthly savings for Pro users</p>

        {/* Hero code */}
        <div className="max-w-2xl mx-auto mt-14 animate-fade-up" style={{animationDelay:"200ms"}}>
          <CodeBlock code={HERO_CODE} lang="js"/>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─── */}
      <FadeSection>
        <div className="border-y border-[var(--border-dim)] py-5 px-6">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
            <span className="text-sm text-[var(--text-ghost)] font-mono sm:mr-8">Trusted by 200+ dev teams</span>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {["Acme Corp","Buildfast","NovaMind","Layerstack","Shipyard"].map((name,i,arr)=>(
                <span key={name} className="font-mono text-xs text-[var(--text-ghost)]">
                  {name}{i<arr.length-1?<span className="mx-3 text-[var(--surface-4)]">·</span>:null}
                </span>
              ))}
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ─── PROBLEM ─── */}
      <FadeSection>
        <section className="py-28 px-6 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-mono text-[var(--text-ghost)] uppercase tracking-widest mb-4">The problem</p>
              <h2 className="font-mono text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
                One abusive user.<br />One overnight script.<br />
                <span className="text-[var(--danger)]">$40,000 bill.</span>
              </h2>
              <p className="text-[var(--text-dim)] leading-relaxed mb-4">
                There are no guardrails between your app and the LLM API. One misconfigured feature, one abusive user, or one runaway script — and your next invoice is unrecognizable.
              </p>
              <p className="text-[var(--text-dim)] leading-relaxed">
                No rate limits means no friction for abuse. No spend caps means no ceiling on damage. No attribution means no idea who caused it.
              </p>
            </div>
            {/* Terminal */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-mid)] rounded-2xl p-6 font-mono text-sm shadow-card">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--danger)] opacity-70"/>
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning)] opacity-70"/>
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--green)] opacity-70"/>
                <span className="text-[var(--text-ghost)] text-xs ml-2">terminal</span>
              </div>
              <div className="space-y-1.5 min-h-[180px]">
                {TERMINAL_LINES.map((line,i)=>{
                  const shown=terminal[i]??"";
                  return (
                    <div key={i} className={`text-xs ${line.startsWith("⚠")?"text-[var(--danger)]":line.startsWith("   ")?"text-[var(--text-ghost)]":line.startsWith("$")?"text-[var(--green)]":"text-[var(--text-bright)]"}`}>
                      {shown}
                      {i===Math.min(terminal.length,TERMINAL_LINES.length-1)&&shown.length<line.length&&<span className="animate-pulse">█</span>}
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
        <section className="py-28 px-6 max-w-6xl mx-auto" id="how-it-works">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-[var(--text-ghost)] uppercase tracking-widest mb-3">How it works</p>
            <h2 className="font-mono text-3xl md:text-4xl font-bold text-white mb-4">One proxy. Full control.</h2>
            <p className="text-[var(--text-dim)] max-w-md mx-auto">The same interface your SDK already uses. Zero refactoring.</p>
          </div>

          {/* 3 pillars */}
          <div className="grid md:grid-cols-3 gap-5 mb-16">
            {[
              {icon:Shield,     color:"var(--danger)",  title:"Enforce rules",    desc:"Spend caps per user, per day, per model. Rate limits that actually work. Injection filter that stops attacks before they reach the model."},
              {icon:BarChart2,  color:"var(--blue)",    title:"See everything",   desc:"Every token, dollar, and request attributed to the exact user, feature, and model. No more mystery invoices."},
              {icon:Zap,        color:"var(--green)",   title:"Save automatically", desc:"Smart routing, semantic caching, and prompt compression cut your AI bill without any code changes. Average savings: 60%."},
            ].map(({icon:Icon,color,title,desc},i)=>(
              <FadeSection key={title} delay={i*80}>
                <div className="card card-glow p-6 h-full">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{background:`${color}14`}}>
                    <Icon size={18} style={{color}}/>
                  </div>
                  <h3 className="font-mono font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-[var(--text-dim)] leading-relaxed">{desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>

          {/* Flow diagram */}
          <div className="flex items-center justify-center gap-0 flex-wrap">
            {[
              {label:"Your App",      sub:"OpenAI SDK",       hi:false},
              null,
              {label:"Leashly Proxy", sub:"routing · cache · compression · rules", hi:true},
              null,
              {label:"LLM Provider",  sub:"OpenAI / Anthropic / Gemini", hi:false},
            ].map((item,i)=>{
              if(!item) return (
                <div key={i} className="flex items-center mx-3">
                  <div className="w-8 h-px bg-[var(--border-hi)]"/>
                  <span className="text-[var(--text-ghost)] px-1">→</span>
                  <div className="w-8 h-px bg-[var(--border-hi)]"/>
                </div>
              );
              return (
                <div key={i} className={`border rounded-2xl px-5 py-3 text-center ${item.hi?"border-[var(--green)] bg-[var(--green-glow)]":"border-[var(--border-mid)] bg-[var(--surface-2)]"}`}>
                  <div className="font-mono font-bold text-white text-sm">{item.label}</div>
                  <div className="text-xs mt-1" style={{color:item.hi?"var(--green)":"var(--text-ghost)"}}>{item.sub}</div>
                </div>
              );
            })}
          </div>
        </section>
      </FadeSection>

      {/* ─── FEATURES ─── */}
      <FadeSection>
        <section className="py-28 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-[var(--text-ghost)] uppercase tracking-widest mb-3">Features</p>
            <h2 className="font-mono text-3xl md:text-4xl font-bold text-white mb-4">Everything you need to ship AI safely</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {icon:"💰",color:"var(--green)",  title:"Spend caps",        desc:"Daily, weekly, monthly limits. Block or alert when thresholds are hit."},
              {icon:"⚡",color:"var(--blue)",   title:"Rate limiting",     desc:"Per-minute, per-hour throttling. Per account, key, or IP."},
              {icon:"🛡️",color:"var(--danger)", title:"Injection shield",  desc:"Blocks 50+ jailbreak patterns. Three sensitivity levels."},
              {icon:"🔀",color:"var(--teal)",   title:"Smart routing",     desc:"Auto-routes simple requests to cheaper models. Average 40% savings."},
              {icon:"⚡",color:"var(--violet)", title:"Semantic cache",    desc:"Similar prompts return cached responses at $0 cost. pgvector powered."},
              {icon:"🗜️",color:"var(--warning)","title":"Prompt compression",desc:"Shrinks bloated system prompts before they reach the model."},
              {icon:"📊",color:"var(--blue)",   title:"Cost attribution",  desc:"See which user and feature is burning money. Full model breakdown."},
              {icon:"🔔",color:"var(--green)",  title:"Real-time alerts",  desc:"Email + in-app notifications when spend or rate limits are hit."},
              {icon:"📋",color:"var(--text-dim)","title":"Audit logs",     desc:"Every request logged with tokens, cost, duration, and flag reason."},
            ].map(({icon,color,title,desc})=>(
              <div key={title} className="card p-5">
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="font-mono font-bold text-white mb-1.5 text-sm">{title}</h3>
                <p className="text-xs text-[var(--text-dim)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeSection>

      {/* ─── CODE EXAMPLES ─── */}
      <FadeSection>
        <section className="py-28 px-6 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-mono text-[var(--text-ghost)] uppercase tracking-widest mb-3">Integration</p>
            <h2 className="font-mono text-3xl md:text-4xl font-bold text-white mb-4">Works with every SDK</h2>
            <p className="text-[var(--text-dim)]">One line change. Drop-in compatible.</p>
          </div>
          <div className="flex gap-1 mb-4">
            {Object.keys(CODE_EXAMPLES).map(tab=>(
              <button key={tab} onClick={()=>setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-mono transition-all ${activeTab===tab?"bg-[var(--green)] text-black font-semibold":"text-[var(--text-dim)] hover:text-white"}`}>
                {tab}
              </button>
            ))}
          </div>
          <CodeBlock code={CODE_EXAMPLES[activeTab].code} lang={CODE_EXAMPLES[activeTab].lang}/>
        </section>
      </FadeSection>

      {/* ─── PRICING ─── */}
      <FadeSection>
        <section className="py-28 px-6 max-w-4xl mx-auto" id="pricing">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-[var(--text-ghost)] uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="font-mono text-3xl md:text-4xl font-bold text-white mb-4">Simple pricing.</h2>
            <p className="text-[var(--text-dim)]">Saves itself in the first week.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {/* Free */}
            <div className="card p-6">
              <h3 className="font-mono font-bold text-white mb-1">Free</h3>
              <div className="flex items-end gap-1 mb-1"><span className="font-mono text-3xl font-bold text-white">$0</span><span className="text-[var(--text-dim)] text-sm mb-1">/mo</span></div>
              <p className="text-xs text-[var(--text-ghost)] mb-5">Forever free</p>
              <ul className="space-y-2.5 mb-6">
                {["10,000 req/mo","1 API key","Basic rate limiting","7-day logs"].map(f=>(
                  <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-dim)]">
                    <span className="text-[var(--green)] mt-0.5 shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="btn btn-ghost w-full justify-center">Get started free</Link>
            </div>

            {/* Pro */}
            <div className="card p-6 relative" style={{borderColor:"var(--green)",boxShadow:"0 0 40px var(--green-glow)"}}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-green text-[10px] font-bold">Most popular</div>
              <h3 className="font-mono font-bold text-white mb-1">Pro</h3>
              <div className="flex items-end gap-1 mb-1"><span className="font-mono text-3xl font-bold text-white">$9</span><span className="text-[var(--text-dim)] text-sm mb-1"> CAD/mo</span></div>
              <p className="text-xs text-[var(--text-ghost)] mb-5">Cancel anytime</p>
              <ul className="space-y-2.5 mb-6">
                {["Unlimited requests","Smart routing + cache","Prompt compression","90-day logs","Email alerts","Priority support"].map(f=>(
                  <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-dim)]">
                    <span className="text-[var(--green)] mt-0.5 shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href={STRIPE_PRO_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full justify-center">Upgrade to Pro →</a>
            </div>

            {/* Usage-based */}
            <div className="card p-6" style={{borderColor:"rgba(68,136,255,0.25)"}}>
              <h3 className="font-mono font-bold text-white mb-1">Pay As You Save</h3>
              <div className="flex items-end gap-1 mb-1"><span className="font-mono text-3xl font-bold text-white">10%</span><span className="text-[var(--text-dim)] text-sm mb-1"> of savings</span></div>
              <p className="text-xs text-[var(--text-ghost)] mb-5">Zero risk — you always win</p>
              <ul className="space-y-2.5 mb-6">
                {["No monthly fee","Everything in Pro","Pay only on savings","Perfect for high volume"].map(f=>(
                  <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-dim)]">
                    <span className="text-[var(--blue)] mt-0.5 shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="btn btn-ghost w-full justify-center" style={{borderColor:"rgba(68,136,255,0.3)",color:"var(--blue)"}}>Get started →</Link>
            </div>
          </div>
          <p className="text-center text-xs text-[var(--text-ghost)] font-mono mt-8">
            Need more? <a href="mailto:hello@leashly.dev" className="text-[var(--text-dim)] hover:text-[var(--green)] underline transition-colors">Contact us</a>
          </p>
        </section>
      </FadeSection>

      {/* ─── FAQ ─── */}
      <FadeSection>
        <section className="py-28 px-6 max-w-3xl mx-auto">
          <h2 className="font-mono text-3xl font-bold text-white text-center mb-14">FAQ</h2>
          {FAQS.map(faq=><Accordion key={faq.q} q={faq.q} a={faq.a}/>)}
        </section>
      </FadeSection>

      {/* ─── CTA ─── */}
      <FadeSection>
        <section className="py-28 px-6">
          <div className="max-w-3xl mx-auto card p-16 text-center glow-green" style={{borderColor:"rgba(0,255,136,0.15)"}}>
            <h2 className="font-mono text-3xl md:text-4xl font-bold text-white mb-4">Start protecting your AI spend today.</h2>
            <p className="text-[var(--text-dim)] mb-10">Free forever for indie devs. No credit card required.</p>
            <Link href="/register"
              className="btn btn-primary px-10 py-3.5 text-base inline-flex">
              Create your free account →
            </Link>
            <div className="mt-6 flex items-center justify-center gap-2 text-[var(--text-ghost)] text-sm">
              <span>or</span>
              <Link href="/docs" className="text-[var(--text-dim)] hover:text-[var(--green)] transition-colors underline underline-offset-4">Read the docs</Link>
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[var(--border-dim)] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14">
            {[
              {title:"Product",   links:[{l:"Features",h:"/#how-it-works"},{l:"Pricing",h:"/#pricing"},{l:"Docs",h:"/docs"},{l:"Dashboard",h:"/dashboard"}]},
              {title:"Developers",links:[{l:"API Reference",h:"/docs"},{l:"Quick start",h:"/docs"},{l:"GitHub",h:"https://github.com/Sumit-Sheokand-ai/leashly"},{l:"Status",h:"#"}]},
              {title:"Account",   links:[{l:"Sign in",h:"/login"},{l:"Sign up",h:"/register"},{l:"Settings",h:"/dashboard/settings"},{l:"Upgrade",h:STRIPE_PRO_LINK}]},
              {title:"Legal",     links:[{l:"Privacy",h:"#"},{l:"Terms",h:"#"},{l:"Security",h:"/docs"},{l:"Contact",h:"mailto:hello@leashly.dev"}]},
            ].map(({title,links})=>(
              <div key={title}>
                <h4 className="font-mono text-xs font-bold text-[var(--text-ghost)] uppercase tracking-wider mb-4">{title}</h4>
                <ul className="space-y-2.5">
                  {links.map(link=>(
                    <li key={link.l}>
                      <a href={link.h} className="text-sm text-[var(--text-ghost)] hover:text-[var(--text-bright)] transition-colors">{link.l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--border-dim)] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold"><span className="text-[var(--green)]">Leash</span><span className="text-white">ly</span></span>
              <span className="text-[var(--text-ghost)] text-xs font-mono">© 2025 · Built for developers.</span>
            </div>
            <div className="flex gap-5">
              <a href="https://github.com/Sumit-Sheokand-ai/leashly" target="_blank" rel="noopener noreferrer"
                className="text-[var(--text-ghost)] hover:text-white transition-colors font-mono text-xs">GitHub</a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                className="text-[var(--text-ghost)] hover:text-white transition-colors font-mono text-xs">X / Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
