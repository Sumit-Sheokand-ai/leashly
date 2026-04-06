"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Copy, Check, Key, ToggleLeft, ToggleRight, Terminal, Eye, EyeOff, Zap, Lock } from "lucide-react";
import Link from "next/link";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { PlanBanner } from "@/components/layout/plan-gate";

interface ApiKey {
  id: string; name: string; keyHash: string; proxyKey: string;
  provider: string; createdAt: string; isActive: boolean;
}

const PROVIDER_META: Record<string, { color: string; label: string; placeholder: string }> = {
  openai:    { color: "#7c3aed", label: "OpenAI",        placeholder: "sk-..." },
  anthropic: { color: "#ea580c", label: "Anthropic",     placeholder: "sk-ant-..." },
  gemini:    { color: "#2563eb", label: "Google Gemini", placeholder: "AIza..." },
  custom:    { color: "#666666", label: "Custom",        placeholder: "your-api-key" },
};

// Quick-start templates
const TEMPLATES = [
  {
    id: "openai-gpt4",
    label: "OpenAI GPT-4o",
    provider: "openai",
    name: "OpenAI GPT-4o",
    description: "Best for complex reasoning and code",
    color: "#7c3aed",
  },
  {
    id: "openai-mini",
    label: "OpenAI GPT-4o Mini",
    provider: "openai",
    name: "OpenAI GPT-4o Mini",
    description: "Fast and cheap — great for most tasks",
    color: "#7c3aed",
  },
  {
    id: "anthropic-sonnet",
    label: "Claude 3.5 Sonnet",
    provider: "anthropic",
    name: "Claude 3.5 Sonnet",
    description: "Anthropic's best balance of speed and quality",
    color: "#ea580c",
  },
  {
    id: "anthropic-haiku",
    label: "Claude 3 Haiku",
    provider: "anthropic",
    name: "Claude Haiku",
    description: "Fastest Anthropic model — low cost",
    color: "#ea580c",
  },
];

const CODE_SNIPPETS = {
  node:   (k: string) => `import OpenAI from 'openai';\n\nconst client = new OpenAI({\n  apiKey: "${k}",\n  baseURL: "https://leashly.dev/api/proxy",\n});\n\nconst res = await client.chat.completions.create({\n  model: "gpt-4o",\n  messages: [{ role: "user", content: "Hello!" }],\n});`,
  python: (k: string) => `from openai import OpenAI\n\nclient = OpenAI(\n    api_key="${k}",\n    base_url="https://leashly.dev/api/proxy",\n)\n\nresponse = client.chat.completions.create(\n    model="gpt-4o",\n    messages=[{"role": "user", "content": "Hello!"}],\n)`,
  curl:   (k: string) => `curl https://leashly.dev/api/proxy/chat/completions \\\n  -H "Authorization: Bearer ${k}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello!"}]}'`,
};

function CopyButton({ text, size = 13 }: { text: string; size?: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-[#444444] hover:text-[#00ff88] transition-colors p-1 rounded shrink-0">
      {copied ? <Check size={size} className="text-[#00ff88]" /> : <Copy size={size} />}
    </button>
  );
}

const inputCls = "w-full bg-[#060606] border border-[#1a1a1a] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#383838] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/20 transition-all";

export default function KeysPage() {
  const [keys, setKeys]                       = useState<ApiKey[]>([]);
  const [plan, setPlan]                       = useState<string>("free");
  const [loading, setLoading]                 = useState(true);
  const [showModal, setShowModal]             = useState(false);
  const [showTemplates, setShowTemplates]     = useState(false);
  const [form, setForm]                       = useState({ name: "", provider: "openai", apiKey: "" });
  const [showKey, setShowKey]                 = useState(false);
  const [formError, setFormError]             = useState("");
  const [saving, setSaving]                   = useState(false);
  const [deletingId, setDeletingId]           = useState<string | null>(null);
  const [codeLang, setCodeLang]               = useState<"node" | "python" | "curl">("node");
  const [activeSnippetKey, setActiveSnippetKey] = useState<string | null>(null);

  const limit    = PLAN_LIMITS[(plan as keyof typeof PLAN_LIMITS)]?.apiKeys ?? PLAN_LIMITS.free.apiKeys;
  const atLimit  = keys.length >= limit;

  async function loadKeys() {
    try {
      const [keysRes, userRes] = await Promise.all([
        fetch("/api/keys"),
        fetch("/api/user/settings"),
      ]);
      if (keysRes.ok) {
        const data = await keysRes.json();
        setKeys(data);
        if (data.length > 0 && !activeSnippetKey) setActiveSnippetKey(data[0].proxyKey);
      }
      if (userRes.ok) {
        const u = await userRes.json();
        setPlan(u.plan ?? "free");
      }
    } catch {}
    setLoading(false);
  }

  function applyTemplate(template: typeof TEMPLATES[0]) {
    setForm({ name: template.name, provider: template.provider, apiKey: "" });
    setShowTemplates(false);
    setShowModal(true);
  }

  async function createKey() {
    setFormError("");
    if (!form.name.trim())   { setFormError("Give this key a name"); return; }
    if (!form.apiKey.trim()) { setFormError("Enter your provider API key"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), provider: form.provider, apiKey: form.apiKey.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setShowModal(false);
        setForm({ name: "", provider: "openai", apiKey: "" });
        setShowKey(false);
        await loadKeys();
        setActiveSnippetKey(created.proxyKey);
      } else {
        const d = await res.json();
        if (d.code === "LIMIT_REACHED") {
          setFormError(`You've reached the ${limit}-key limit on the free plan.`);
        } else {
          setFormError(d.error ?? "Failed to create key");
        }
      }
    } catch { setFormError("Network error. Please try again."); }
    setSaving(false);
  }

  async function toggleKey(id: string, isActive: boolean) {
    await fetch(`/api/keys/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) });
    setKeys(k => k.map(key => key.id === id ? { ...key, isActive } : key));
  }

  async function deleteKey(id: string) {
    setDeletingId(id);
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    const remaining = keys.filter(k => k.id !== id);
    setKeys(remaining);
    if (activeSnippetKey === keys.find(k => k.id === id)?.proxyKey) setActiveSnippetKey(remaining[0]?.proxyKey ?? null);
    setDeletingId(null);
  }

  useEffect(() => { loadKeys(); }, []);

  const snippet = CODE_SNIPPETS[codeLang](activeSnippetKey ?? "lsh_your_proxy_key_here");

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">API Keys</h2>
          <p className="text-sm text-[#555555] mt-0.5">Add your LLM provider keys — Leashly wraps them with a secure proxy key</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTemplates(v => !v)}
            className="flex items-center gap-1.5 border border-[#1a1a1a] hover:border-[#333333] text-[#888888] hover:text-white text-sm px-3 py-2 rounded-xl transition-all">
            Templates
          </button>
          <button
            onClick={() => { if (!atLimit) { setShowModal(true); setFormError(""); } }}
            disabled={atLimit}
            className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00dd77] disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-semibold px-4 py-2 rounded-xl transition-all shrink-0">
            {atLimit ? <Lock size={13} /> : <Plus size={13} />}
            {atLimit ? "Limit reached" : "Add Key"}
          </button>
        </div>
      </div>

      {/* Plan usage banner */}
      <PlanBanner
        feature="API Keys"
        description={plan === "free" ? `Free plan: ${limit} keys max. Upgrade for up to 10.` : `Pro plan: up to ${limit} keys.`}
        current={keys.length}
        limit={limit}
      />

      {/* Upgrade nudge when at limit */}
      {atLimit && plan === "free" && (
        <div className="rounded-2xl border border-[#ffaa44]/20 bg-[#ffaa44]/5 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-[#ffaa44]">
            You&apos;ve used all {limit} API key slots on the free plan.
          </p>
          <Link href="/dashboard/billing"
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#ffaa44]/15 text-[#ffaa44] border border-[#ffaa44]/30 px-3 py-1.5 rounded-xl hover:bg-[#ffaa44]/25 transition-all shrink-0">
            <Zap size={11} /> Upgrade to Pro
          </Link>
        </div>
      )}

      {/* Templates dropdown */}
      {showTemplates && (
        <div className="bg-[#0e0e0e] border border-[#222222] rounded-2xl p-4 space-y-2">
          <p className="text-xs text-[#555555] font-mono uppercase tracking-widest mb-3">Quick-start templates</p>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => applyTemplate(t)} disabled={atLimit}
                className="flex items-start gap-3 text-left p-3 rounded-xl border border-[#1a1a1a] hover:border-[#333333] hover:bg-[#111111] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: t.color }} />
                <div>
                  <p className="text-sm font-medium text-white">{t.label}</p>
                  <p className="text-xs text-[#555555] mt-0.5">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Code snippet */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#141414]">
          <div className="flex items-center gap-2">
            <Terminal size={13} className="text-[#00ff88]" />
            <span className="text-xs text-[#888888] font-medium">Integration snippet</span>
            {activeSnippetKey && keys.length > 1 && (
              <select value={activeSnippetKey} onChange={e => setActiveSnippetKey(e.target.value)}
                className="ml-2 bg-[#111111] border border-[#222222] rounded-lg px-2 py-0.5 text-xs text-[#888888] focus:outline-none">
                {keys.map(k => <option key={k.id} value={k.proxyKey}>{k.name}</option>)}
              </select>
            )}
          </div>
          <div className="flex items-center gap-1">
            {(["node", "python", "curl"] as const).map(lang => (
              <button key={lang} onClick={() => setCodeLang(lang)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-all ${codeLang === lang ? "bg-[#1a1a1a] text-white" : "text-[#555555] hover:text-[#888888]"}`}>
                {lang === "node" ? "Node.js" : lang === "python" ? "Python" : "cURL"}
              </button>
            ))}
            <CopyButton text={snippet} size={12} />
          </div>
        </div>
        <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed">
          {snippet.split("\n").map((line, i) => (
            <div key={i} className={line.includes("lsh_") && activeSnippetKey ? "bg-[#00ff88]/5 -mx-4 px-4" : ""}>
              <span className={line.includes("lsh_") && activeSnippetKey ? "text-[#00ff88]" : "text-[#8888aa]"}>{line}</span>
              {"\n"}
            </div>
          ))}
        </pre>
      </div>

      {/* Keys list */}
      {loading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl animate-pulse" />)}</div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#0e0e0e] border border-[#1a1a1a] flex items-center justify-center">
            <Key size={22} className="text-[#2a2a2a]" />
          </div>
          <div>
            <p className="text-[#888888] font-medium">No keys yet</p>
            <p className="text-[#444444] text-sm mt-1">Add your OpenAI or Anthropic key to get started</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTemplates(true)}
              className="border border-[#1a1a1a] text-[#888888] hover:text-white text-sm px-4 py-2 rounded-xl transition-all">
              Use a template
            </button>
            <button onClick={() => { setShowModal(true); setFormError(""); }}
              className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00dd77] text-black text-sm font-semibold px-4 py-2 rounded-xl transition-all">
              <Plus size={14} /> Add key
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="divide-y divide-[#111111]">
            {keys.map(key => {
              const meta = PROVIDER_META[key.provider] ?? PROVIDER_META.custom;
              return (
                <div key={key.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-[#0d0d0d] transition-all ${!key.isActive ? "opacity-50" : ""}`}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{key.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono" style={{ background: `${meta.color}20`, color: meta.color }}>{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[#444444] font-mono">Real key: ••••{key.keyHash}</span>
                      <span className="text-[#2a2a2a]">·</span>
                      <span className="text-xs text-[#555555] font-mono">Added {new Date(key.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl px-2.5 py-1.5 shrink-0">
                    <span className="font-mono text-xs text-[#00ff88]">{key.proxyKey}</span>
                    <CopyButton text={key.proxyKey} />
                  </div>
                  <button onClick={() => setActiveSnippetKey(key.proxyKey)}
                    className={`shrink-0 text-[10px] px-2 py-1.5 rounded-xl border transition-all ${
                      activeSnippetKey === key.proxyKey
                        ? "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20"
                        : "text-[#444444] border-[#1a1a1a] hover:text-[#888888]"
                    }`}>
                    {activeSnippetKey === key.proxyKey ? "✓ in snippet" : "Use in snippet"}
                  </button>
                  <button onClick={() => toggleKey(key.id, !key.isActive)}
                    className={`shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition-all ${
                      key.isActive ? "border-[#00ff88]/25 text-[#00ff88] bg-[#00ff88]/5" : "border-[#1a1a1a] text-[#444444]"
                    }`}>
                    {key.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                    {key.isActive ? "Active" : "Paused"}
                  </button>
                  <button onClick={() => deleteKey(key.id)} disabled={deletingId === key.id}
                    className="shrink-0 p-1.5 text-[#2a2a2a] hover:text-[#ff4444] hover:bg-[#ff4444]/8 rounded-xl transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Key Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#0e0e0e] border border-[#222222] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-mono text-base font-bold text-white mb-1">Add API Key</h3>
            <p className="text-xs text-[#555555] mb-5">Encrypted at rest with AES-256 · Never logged or exposed</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#cccccc] mb-1.5 font-medium">Provider</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(PROVIDER_META).map(([k, { label, color }]) => (
                    <button key={k} onClick={() => setForm(f => ({ ...f, provider: k }))}
                      className={`py-2 text-xs rounded-xl border transition-all ${form.provider === k ? "text-white" : "border-[#1a1a1a] text-[#555555] hover:border-[#333333] hover:text-[#888888]"}`}
                      style={form.provider === k ? { borderColor: `${color}50`, background: `${color}10`, color: "white" } : {}}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#cccccc] mb-1.5 font-medium">Key name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Production OpenAI" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-[#cccccc] mb-1.5 font-medium">API Key</label>
                <div className="relative">
                  <input type={showKey ? "text" : "password"} value={form.apiKey}
                    onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                    placeholder={PROVIDER_META[form.provider]?.placeholder ?? "your-api-key"}
                    className={`${inputCls} font-mono pr-9`} />
                  <button onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444444] hover:text-[#888888]">
                    {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              {formError && (
                <div className="flex items-center gap-2 bg-[#ff4444]/8 border border-[#ff4444]/20 rounded-xl px-3 py-2.5 text-sm text-[#ff6666]">
                  ⚠ {formError}
                  {formError.includes("limit") && (
                    <Link href="/dashboard/billing" className="ml-auto text-[#ffaa44] underline text-xs shrink-0">Upgrade →</Link>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setFormError(""); setForm({ name: "", provider: "openai", apiKey: "" }); setShowKey(false); }}
                className="flex-1 border border-[#1a1a1a] text-[#888888] hover:text-white text-sm py-2.5 rounded-xl transition-all">
                Cancel
              </button>
              <button onClick={createKey} disabled={saving}
                className="flex-1 bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold text-sm py-2.5 rounded-xl transition-all disabled:opacity-50">
                {saving ? "Saving…" : "Add Key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
