"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Copy, Check, Key, ToggleLeft, ToggleRight, Terminal, Eye, EyeOff, Zap } from "lucide-react";

interface ApiKey {
  id: string; name: string; keyHash: string; proxyKey: string;
  provider: string; createdAt: string; isActive: boolean;
}

const PROVIDER_META: Record<string, { color: string; label: string; placeholder: string }> = {
  openai:    { color: "#7c3aed", label: "OpenAI",         placeholder: "sk-..." },
  anthropic: { color: "#ea580c", label: "Anthropic",      placeholder: "sk-ant-..." },
  gemini:    { color: "#2563eb", label: "Google Gemini",  placeholder: "AIza..." },
  custom:    { color: "#666666", label: "Custom",         placeholder: "your-api-key" },
};

const CODE_SNIPPETS = {
  node: (proxyKey: string) => `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: "${proxyKey}",
  baseURL: "https://leashly.dev/api/proxy",
});

const res = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});`,
  python: (proxyKey: string) => `from openai import OpenAI

client = OpenAI(
    api_key="${proxyKey}",
    base_url="https://leashly.dev/api/proxy",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
)`,
  curl: (proxyKey: string) => `curl https://leashly.dev/api/proxy/chat/completions \\
  -H "Authorization: Bearer ${proxyKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello!"}]}'`,
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

function ProviderBadge({ provider }: { provider: string }) {
  const meta = PROVIDER_META[provider] ?? PROVIDER_META.custom;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-mono"
      style={{ background: `${meta.color}20`, color: meta.color }}>
      {meta.label}
    </span>
  );
}

const inputCls = "w-full bg-[#060606] border border-[#1a1a1a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#383838] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/20 transition-all";

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", provider: "openai", apiKey: "" });
  const [showKey, setShowKey] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [codeLang, setCodeLang] = useState<"node" | "python" | "curl">("node");
  const [activeSnippetKey, setActiveSnippetKey] = useState<string | null>(null);

  async function loadKeys() {
    try {
      const res = await fetch("/api/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
        if (data.length > 0 && !activeSnippetKey) setActiveSnippetKey(data[0].proxyKey);
      }
    } catch {}
    setLoading(false);
  }

  async function createKey() {
    setFormError("");
    if (!form.name.trim()) { setFormError("Please give this key a name"); return; }
    if (!form.apiKey.trim()) { setFormError("Please enter your API key"); return; }
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
        setFormError(d.error ?? "Failed to create key");
      }
    } catch { setFormError("Network error. Please try again."); }
    setSaving(false);
  }

  async function toggleKey(id: string, isActive: boolean) {
    try {
      await fetch(`/api/keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      setKeys(k => k.map(key => key.id === id ? { ...key, isActive } : key));
    } catch {}
  }

  async function deleteKey(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/keys/${id}`, { method: "DELETE" });
      const remaining = keys.filter(k => k.id !== id);
      setKeys(remaining);
      if (activeSnippetKey === keys.find(k => k.id === id)?.proxyKey) {
        setActiveSnippetKey(remaining[0]?.proxyKey ?? null);
      }
    } catch {}
    setDeletingId(null);
  }

  useEffect(() => { loadKeys(); }, []);

  const snippet = activeSnippetKey
    ? CODE_SNIPPETS[codeLang](activeSnippetKey)
    : CODE_SNIPPETS[codeLang]("lsh_your_proxy_key_here");

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">API Keys</h2>
          <p className="text-sm text-[#555555] mt-0.5">Add your LLM provider keys — Leashly wraps them with a secure proxy key</p>
        </div>
        <button onClick={() => { setShowModal(true); setFormError(""); }}
          className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00dd77] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0">
          <Plus size={14} /> Add Key
        </button>
      </div>

      {/* Integration code snippet */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#141414]">
          <div className="flex items-center gap-2">
            <Terminal size={13} className="text-[#00ff88]" />
            <span className="text-xs text-[#888888] font-medium">Quick Integration</span>
            {activeSnippetKey && keys.length > 1 && (
              <select value={activeSnippetKey}
                onChange={e => setActiveSnippetKey(e.target.value)}
                className="ml-2 bg-[#111111] border border-[#222222] rounded px-2 py-0.5 text-xs text-[#888888] focus:outline-none focus:border-[#00ff88]">
                {keys.map(k => <option key={k.id} value={k.proxyKey}>{k.name}</option>)}
              </select>
            )}
          </div>
          <div className="flex items-center gap-1">
            {(["node", "python", "curl"] as const).map(lang => (
              <button key={lang} onClick={() => setCodeLang(lang)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${codeLang === lang ? "bg-[#1a1a1a] text-white" : "text-[#555555] hover:text-[#888888]"}`}>
                {lang === "node" ? "Node.js" : lang === "python" ? "Python" : "cURL"}
              </button>
            ))}
            <CopyButton text={snippet} size={12} />
          </div>
        </div>
        <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed">
          {snippet.split("\n").map((line, i) => {
            const isKeyLine = line.includes("lsh_");
            return (
              <div key={i} className={isKeyLine && activeSnippetKey ? "bg-[#00ff88]/5 -mx-4 px-4 rounded" : ""}>
                <span className={isKeyLine && activeSnippetKey ? "text-[#00ff88]" : "text-[#8888aa]"}>
                  {line}
                </span>
                {"\n"}
              </div>
            );
          })}
        </pre>
      </div>

      {/* Keys list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-16 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl animate-pulse" />)}
        </div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#0e0e0e] border border-[#1a1a1a] flex items-center justify-center">
            <Key size={22} className="text-[#2a2a2a]" />
          </div>
          <div>
            <p className="text-[#888888] font-medium">No keys yet</p>
            <p className="text-[#444444] text-sm mt-1">Add your OpenAI, Anthropic, or Gemini key to get started</p>
          </div>
          <button onClick={() => { setShowModal(true); setFormError(""); }}
            className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00dd77] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Plus size={14} /> Add your first key
          </button>
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#141414]">
            <span className="text-xs text-[#555555] font-mono">{keys.length} key{keys.length !== 1 ? "s" : ""} configured</span>
          </div>
          <div className="divide-y divide-[#111111]">
            {keys.map(key => {
              const meta = PROVIDER_META[key.provider] ?? PROVIDER_META.custom;
              const isSnippetKey = activeSnippetKey === key.proxyKey;
              return (
                <div key={key.id}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-[#0d0d0d] transition-colors ${!key.isActive ? "opacity-50" : ""}`}>
                  {/* Provider dot */}
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />

                  {/* Name + provider */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[#e0e0e0]">{key.name}</span>
                      <ProviderBadge provider={key.provider} />
                      {isSnippetKey && (
                        <span className="text-[10px] bg-[#00ff88]/10 text-[#00ff88] px-1.5 py-0.5 rounded font-mono">shown in snippet</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[#444444] font-mono">Real key: ••••{key.keyHash}</span>
                      <span className="text-[#2a2a2a]">·</span>
                      <span className="text-xs text-[#555555] font-mono">Added {new Date(key.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Proxy key */}
                  <div className="flex items-center gap-1 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-2.5 py-1.5 shrink-0">
                    <span className="font-mono text-xs text-[#00ff88]">{key.proxyKey}</span>
                    <CopyButton text={key.proxyKey} />
                  </div>

                  {/* Use in snippet */}
                  {!isSnippetKey && (
                    <button onClick={() => setActiveSnippetKey(key.proxyKey)}
                      className="shrink-0 text-[10px] text-[#444444] hover:text-[#888888] border border-[#1a1a1a] hover:border-[#333333] px-2 py-1.5 rounded-lg transition-all flex items-center gap-1">
                      <Zap size={10} /> Use in snippet
                    </button>
                  )}

                  {/* Toggle */}
                  <button onClick={() => toggleKey(key.id, !key.isActive)}
                    className={`shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                      key.isActive
                        ? "border-[#00ff88]/25 text-[#00ff88] bg-[#00ff88]/5"
                        : "border-[#1a1a1a] text-[#444444]"
                    }`}>
                    {key.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                    {key.isActive ? "Active" : "Paused"}
                  </button>

                  {/* Delete */}
                  <button onClick={() => deleteKey(key.id)} disabled={deletingId === key.id}
                    className="shrink-0 p-1.5 text-[#2a2a2a] hover:text-[#ff4444] hover:bg-[#ff4444]/8 rounded-lg transition-all">
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
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#0e0e0e] border border-[#222222] rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-mono text-base font-bold text-white mb-1">Add API Key</h3>
            <p className="text-xs text-[#555555] mb-5">Your provider key is encrypted with AES-256. We never log or expose it.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#cccccc] mb-1.5 font-medium">Provider</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(PROVIDER_META).map(([key, { label, color }]) => (
                    <button key={key} onClick={() => setForm(f => ({ ...f, provider: key }))}
                      className={`py-2 text-xs rounded-lg border transition-all ${
                        form.provider === key
                          ? "border-[#00ff88]/50 bg-[#00ff88]/5 text-white"
                          : "border-[#1a1a1a] text-[#555555] hover:border-[#333333] hover:text-[#888888]"
                      }`}
                      style={form.provider === key ? { borderColor: `${color}50` } : {}}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#cccccc] mb-1.5 font-medium">Key name</label>
                <input value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Production OpenAI Key"
                  className={inputCls} />
              </div>

              <div>
                <label className="block text-sm text-[#cccccc] mb-1.5 font-medium">API Key</label>
                <div className="relative">
                  <input type={showKey ? "text" : "password"}
                    value={form.apiKey}
                    onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                    placeholder={PROVIDER_META[form.provider]?.placeholder ?? "your-api-key"}
                    className={`${inputCls} font-mono pr-9`} />
                  <button onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444444] hover:text-[#888888] transition-colors">
                    {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <p className="text-xs text-[#333333] mt-1.5">Encrypted at rest · Never stored in plain text · Never logged</p>
              </div>

              {formError && (
                <div className="flex items-center gap-2 bg-[#ff4444]/8 border border-[#ff4444]/20 rounded-lg px-3 py-2.5 text-sm text-[#ff6666]">
                  <span>⚠</span> {formError}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setFormError(""); setForm({ name: "", provider: "openai", apiKey: "" }); setShowKey(false); }}
                className="flex-1 border border-[#1a1a1a] text-[#888888] hover:text-white hover:border-[#333333] text-sm py-2.5 rounded-lg transition-all">
                Cancel
              </button>
              <button onClick={createKey} disabled={saving}
                className="flex-1 bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50">
                {saving ? "Saving…" : "Add Key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
