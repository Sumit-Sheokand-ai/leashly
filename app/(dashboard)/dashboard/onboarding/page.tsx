"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Key, Shield, Zap, Check, Copy, ArrowRight, RefreshCw, ExternalLink, Eye, EyeOff } from "lucide-react";

const STEPS = ["key", "rule", "test"] as const;
type Step = typeof STEPS[number];

const CODE = {
  node:   (k: string) => `import OpenAI from 'openai';\n\nconst client = new OpenAI({\n  apiKey: "${k}",\n  baseURL: "https://leashly.dev/api/proxy",\n});\n\nconst res = await client.chat.completions.create({\n  model: "gpt-4o",\n  messages: [{ role: "user", content: "Hello!" }],\n});\n\nconsole.log(res.choices[0].message.content);`,
  python: (k: string) => `from openai import OpenAI\n\nclient = OpenAI(\n    api_key="${k}",\n    base_url="https://leashly.dev/api/proxy",\n)\n\nresponse = client.chat.completions.create(\n    model="gpt-4o",\n    messages=[{"role": "user", "content": "Hello!"}],\n)\nprint(response.choices[0].message.content)`,
  curl:   (k: string) => `curl https://leashly.dev/api/proxy/v1/chat/completions \\\n  -H "Authorization: Bearer ${k}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello!"}]}'`,
};

const PROVIDERS = {
  openai:    { label: "OpenAI",        color: "#7c3aed", placeholder: "sk-..." },
  anthropic: { label: "Anthropic",     color: "#ea580c", placeholder: "sk-ant-..." },
  gemini:    { label: "Google Gemini", color: "#2563eb", placeholder: "AIza..." },
};

const inputCls = "w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#383838] focus:outline-none focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/10 transition-all";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#00ff88] transition-colors px-2 py-1 rounded-lg">
      {copied ? <Check size={12} className="text-[#00ff88]" /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep]               = useState<Step>("key");
  const [provider, setProvider]       = useState<keyof typeof PROVIDERS>("openai");
  const [keyName, setKeyName]         = useState("");
  const [apiKey, setApiKey]           = useState("");
  const [showKey, setShowKey]         = useState(false);
  const [savingKey, setSavingKey]     = useState(false);
  const [keyError, setKeyError]       = useState("");
  const [proxyKey, setProxyKey]       = useState("");

  const [ruleType, setRuleType]       = useState<"spend_cap" | "rate_limit">("spend_cap");
  const [dailyLimit, setDailyLimit]   = useState("10");
  const [rpmLimit, setRpmLimit]       = useState("60");
  const [savingRule, setSavingRule]   = useState(false);
  const [ruleError, setRuleError]     = useState("");
  const [ruleDone, setRuleDone]       = useState(false);

  const [codeLang, setCodeLang]       = useState<"node" | "python" | "curl">("node");
  const [testing, setTesting]         = useState(false);
  const [testResult, setTestResult]   = useState<"success" | "error" | null>(null);
  const [testMsg, setTestMsg]         = useState("");

  // Check if already onboarded
  useEffect(() => {
    const done = localStorage.getItem("leashly_onboarded");
    if (done === "1") router.replace("/dashboard");
  }, [router]);

  async function saveKey() {
    setKeyError("");
    if (!keyName.trim())   { setKeyError("Give this key a name"); return; }
    if (!apiKey.trim())    { setKeyError("Enter your provider API key"); return; }
    setSavingKey(true);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: keyName.trim(), provider, apiKey: apiKey.trim() }),
    });
    const d = await res.json();
    setSavingKey(false);
    if (res.ok) { setProxyKey(d.proxyKey); setStep("rule"); }
    else setKeyError(d.error ?? "Failed to save key");
  }

  async function saveRule() {
    setRuleError("");
    setSavingRule(true);
    const config = ruleType === "spend_cap"
      ? { dailyLimit: parseFloat(dailyLimit), action: "block" }
      : { requestsPerMinute: parseInt(rpmLimit), per: "account" };

    const res = await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: ruleType === "spend_cap" ? `Daily $${dailyLimit} cap` : `${rpmLimit} req/min limit`, type: ruleType, config }),
    });
    setSavingRule(false);
    if (res.ok) { setRuleDone(true); setStep("test"); }
    else { const d = await res.json(); setRuleError(d.error ?? "Failed"); }
  }

  async function testProxy() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/proxy/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proxyKey }),
      });
      const d = await res.json();
      if (d.valid) {
        setTestResult("success");
        setTestMsg(`✓ Key "${d.name}" is active and ready`);
      } else {
        setTestResult("error");
        setTestMsg(d.reason ?? "Key not found");
      }
    } catch {
      setTestResult("error");
      setTestMsg("Network error");
    }
    setTesting(false);
  }

  function finish() {
    localStorage.setItem("leashly_onboarded", "1");
    localStorage.setItem("leashly_onboarding_dismissed", "1");
    router.push("/dashboard");
  }

  const stepIdx = STEPS.indexOf(step);
  const snippet = CODE[codeLang](proxyKey || "lsh_your_proxy_key");

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="text-center mb-10">
          <span className="font-mono text-2xl font-bold">
            <span style={{ background: "linear-gradient(90deg, #00ff88, #00ddcc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Leash</span>
            <span className="text-white">ly</span>
          </span>
          <p className="text-[#555555] text-sm mt-2">Let&apos;s get you set up in 3 steps</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {STEPS.map((s, i) => {
            const done    = i < stepIdx;
            const active  = s === step;
            const icons   = [Key, Shield, Zap];
            const Icon    = icons[i];
            const labels  = ["Add API Key", "Set a Rule", "Test & Go"];
            return (
              <div key={s} className="flex-1">
                <div className={`flex items-center gap-2 mb-1 ${active ? "opacity-100" : done ? "opacity-60" : "opacity-30"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    done ? "bg-[#00ff88] text-black" : active ? "bg-[#00ff88]/20 border border-[#00ff88]/40 text-[#00ff88]" : "bg-[#1a1a1a] text-[#555555]"
                  }`}>
                    {done ? <Check size={12} /> : <Icon size={12} />}
                  </div>
                  <span className={`text-xs font-medium ${active ? "text-white" : "text-[#555555]"}`}>{labels[i]}</span>
                </div>
                <div className="h-0.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00ff88] rounded-full transition-all duration-500"
                    style={{ width: done ? "100%" : active ? "50%" : "0%" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Add Key ── */}
        {step === "key" && (
          <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2">
                <Key size={16} className="text-[#00ff88]" /> Add your first API key
              </h2>
              <p className="text-sm text-[#555555] mt-1">
                Add your OpenAI, Anthropic, or Gemini key. We encrypt it with AES-256 — you&apos;ll use a secure proxy key in your app instead.
              </p>
            </div>

            {/* Provider */}
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PROVIDERS).map(([k, { label, color }]) => (
                <button key={k} onClick={() => setProvider(k as keyof typeof PROVIDERS)}
                  className={`py-2.5 text-sm rounded-xl border transition-all ${provider === k ? "text-white" : "border-[#1a1a1a] text-[#555555] hover:border-[#333333]"}`}
                  style={provider === k ? { borderColor: `${color}50`, background: `${color}10` } : {}}>
                  {label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm text-[#888888] mb-1.5">Key name</label>
              <input value={keyName} onChange={e => setKeyName(e.target.value)}
                placeholder="e.g. My OpenAI Key" className={inputCls} />
            </div>

            <div>
              <label className="block text-sm text-[#888888] mb-1.5">API Key</label>
              <div className="relative">
                <input type={showKey ? "text" : "password"} value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={PROVIDERS[provider].placeholder}
                  className={`${inputCls} pr-10 font-mono`}
                  onKeyDown={e => e.key === "Enter" && saveKey()} />
                <button onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444444] hover:text-[#888888]">
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {keyError && (
              <p className="text-sm text-[#ff6666] flex items-center gap-2">⚠ {keyError}</p>
            )}

            <button onClick={saveKey} disabled={savingKey}
              className="w-full bg-[#00ff88] hover:bg-[#00dd77] disabled:opacity-50 text-black font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              {savingKey ? <RefreshCw size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              {savingKey ? "Saving…" : "Save Key & Continue"}
            </button>

            <button onClick={finish} className="w-full text-xs text-[#333333] hover:text-[#555555] transition-colors py-1">
              Skip for now →
            </button>
          </div>
        )}

        {/* ── Step 2: Set Rule ── */}
        {step === "rule" && (
          <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2">
                <Shield size={16} className="text-[#ffaa00]" /> Set your first rule
              </h2>
              <p className="text-sm text-[#555555] mt-1">
                Protect yourself from unexpected bills. You can change this anytime from the Rules page.
              </p>
            </div>

            {/* Rule type */}
            <div className="grid grid-cols-2 gap-3">
              {([
                { type: "spend_cap",  label: "Spend Cap",     desc: "Block requests over a daily $ limit",   color: "#ffaa00" },
                { type: "rate_limit", label: "Rate Limit",    desc: "Limit requests per minute",             color: "#00aaff" },
              ] as const).map(({ type, label, desc, color }) => (
                <button key={type} onClick={() => setRuleType(type)}
                  className={`text-left p-4 rounded-xl border transition-all ${ruleType === type ? "" : "border-[#1a1a1a] hover:border-[#2a2a2a]"}`}
                  style={ruleType === type ? { borderColor: `${color}40`, background: `${color}08` } : {}}>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-[#555555] mt-0.5">{desc}</p>
                </button>
              ))}
            </div>

            {ruleType === "spend_cap" ? (
              <div>
                <label className="block text-sm text-[#888888] mb-1.5">Daily spend limit (USD)</label>
                <div className="flex items-center gap-3">
                  {["1", "5", "10", "50"].map(v => (
                    <button key={v} onClick={() => setDailyLimit(v)}
                      className={`px-4 py-2 text-sm rounded-xl border transition-all ${dailyLimit === v ? "border-[#ffaa00]/40 bg-[#ffaa00]/8 text-white" : "border-[#1a1a1a] text-[#555555] hover:border-[#333333]"}`}>
                      ${v}
                    </button>
                  ))}
                  <input type="number" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}
                    className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffaa00]/40 transition-all text-center font-mono" />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm text-[#888888] mb-1.5">Requests per minute</label>
                <div className="flex items-center gap-3">
                  {["10", "30", "60", "120"].map(v => (
                    <button key={v} onClick={() => setRpmLimit(v)}
                      className={`px-4 py-2 text-sm rounded-xl border transition-all ${rpmLimit === v ? "border-[#00aaff]/40 bg-[#00aaff]/8 text-white" : "border-[#1a1a1a] text-[#555555] hover:border-[#333333]"}`}>
                      {v}
                    </button>
                  ))}
                  <input type="number" value={rpmLimit} onChange={e => setRpmLimit(e.target.value)}
                    className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00aaff]/40 transition-all text-center font-mono" />
                </div>
              </div>
            )}

            {ruleError && <p className="text-sm text-[#ff6666]">⚠ {ruleError}</p>}

            <button onClick={saveRule} disabled={savingRule}
              className="w-full bg-[#00ff88] hover:bg-[#00dd77] disabled:opacity-50 text-black font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              {savingRule ? <RefreshCw size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              {savingRule ? "Saving…" : "Save Rule & Continue"}
            </button>

            <button onClick={() => setStep("test")} className="w-full text-xs text-[#333333] hover:text-[#555555] transition-colors py-1">
              Skip for now →
            </button>
          </div>
        )}

        {/* ── Step 3: Test ── */}
        {step === "test" && (
          <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2">
                <Zap size={16} className="text-[#00aaff]" /> Make your first request
              </h2>
              <p className="text-sm text-[#555555] mt-1">
                Copy this snippet, swap in your proxy key, and run it. That&apos;s it — Leashly is now controlling your AI costs.
              </p>
            </div>

            {/* Proxy key */}
            {proxyKey && (
              <div className="bg-[#00ff88]/5 border border-[#00ff88]/15 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#555555] mb-0.5">Your proxy key</p>
                  <p className="text-sm font-mono text-[#00ff88]">{proxyKey}</p>
                </div>
                <CopyBtn text={proxyKey} />
              </div>
            )}

            {/* Code snippet */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#141414]">
                <div className="flex gap-1">
                  {(["node", "python", "curl"] as const).map(l => (
                    <button key={l} onClick={() => setCodeLang(l)}
                      className={`px-2.5 py-1 text-xs rounded-lg transition-all ${codeLang === l ? "bg-[#1a1a1a] text-white" : "text-[#555555] hover:text-[#888888]"}`}>
                      {l === "node" ? "Node.js" : l === "python" ? "Python" : "cURL"}
                    </button>
                  ))}
                </div>
                <CopyBtn text={snippet} />
              </div>
              <pre className="p-4 text-xs font-mono text-[#8888aa] overflow-x-auto leading-relaxed max-h-48">
                {snippet.split("\n").map((line, i) => (
                  <div key={i} className={line.includes(proxyKey || "lsh_") ? "text-[#00ff88]" : ""}>
                    {line}{"\n"}
                  </div>
                ))}
              </pre>
            </div>

            {/* Test validation */}
            {proxyKey && (
              <div className="space-y-2">
                <button onClick={testProxy} disabled={testing}
                  className="w-full border border-[#222222] hover:border-[#333333] text-[#888888] hover:text-white text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
                  {testing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                  {testing ? "Validating…" : "Validate proxy key"}
                </button>
                {testResult && (
                  <div className={`text-xs px-3 py-2 rounded-xl ${testResult === "success" ? "bg-[#00ff88]/8 text-[#00ff88] border border-[#00ff88]/15" : "bg-[#ff4444]/8 text-[#ff4444] border border-[#ff4444]/15"}`}>
                    {testMsg}
                  </div>
                )}
              </div>
            )}

            <button onClick={finish}
              className="w-full bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              <ExternalLink size={15} /> Go to dashboard
            </button>
          </div>
        )}

        {/* Docs link */}
        <p className="text-center text-xs text-[#333333] mt-6">
          Need help?{" "}
          <a href="/docs" className="text-[#555555] hover:text-[#00ff88] transition-colors underline underline-offset-2">
            Read the docs
          </a>
        </p>
      </div>
    </div>
  );
}
