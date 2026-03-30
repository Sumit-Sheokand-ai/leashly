"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Copy, Check, Key, ToggleLeft, ToggleRight } from "lucide-react";

interface ApiKey {
  id: string; name: string; keyHash: string; proxyKey: string;
  provider: string; createdAt: string; isActive: boolean;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#7c3aed", anthropic: "#ea580c", gemini: "#2563eb", custom: "#666666",
};

function ProviderBadge({ provider }: { provider: string }) {
  const color = PROVIDER_COLORS[provider] ?? "#666666";
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-mono"
      style={{ background: `${color}22`, color }}>
      {provider}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-[#444444] hover:text-[#00ff88] transition-colors p-1 rounded">
      {copied ? <Check size={13} className="text-[#00ff88]" /> : <Copy size={13} />}
    </button>
  );
}

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", provider: "openai", apiKey: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadKeys() {
    const res = await fetch("/api/keys");
    const data = await res.json();
    setKeys(data);
    setLoading(false);
  }

  async function createKey() {
    setFormError("");
    if (!form.name || !form.apiKey) { setFormError("All fields are required"); return; }
    setSaving(true);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setShowModal(false);
      setForm({ name: "", provider: "openai", apiKey: "" });
      loadKeys();
    } else {
      const d = await res.json();
      setFormError(d.error ?? "Failed to create key");
    }
  }

  async function toggleKey(id: string, isActive: boolean) {
    await fetch(`/api/keys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    setKeys(k => k.map(key => key.id === id ? { ...key, isActive } : key));
  }

  async function deleteKey(id: string) {
    if (!confirm("Delete this key? Requests using it will fail.")) return;
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    setKeys(k => k.filter(key => key.id !== id));
  }

  useEffect(() => { loadKeys(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">API Keys</h2>
          <p className="text-sm text-[#666666]">Manage your provider keys and Leashly proxy keys</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00cc6e] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add Key
        </button>
      </div>

      {/* How to use */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
        <h3 className="font-mono text-xs text-[#666666] mb-3 uppercase tracking-wider">How to use your proxy key</h3>
        <pre className="text-xs text-[#00ff88] font-mono bg-[#0a0a0a] rounded-lg p-4 overflow-x-auto">
{`import OpenAI from 'openai';
const client = new OpenAI({
  apiKey: "lsh_xxxxxxxxxxxx",   // your Leashly proxy key below
  baseURL: process.env.LEASHLY_BASE_URL + "/api/proxy",
});`}
        </pre>
      </div>

      {/* Keys table */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-[#444444] text-sm">Loading...</div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-3 text-center">
            <Key size={32} className="text-[#333333]" />
            <p className="text-[#666666] text-sm">No keys yet. Add your first API key.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f1f1f]">
                  {["Name", "Provider", "Real Key", "Proxy Key (use this)", "Created", "Status", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs text-[#444444] font-mono font-normal whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map((key, i) => (
                  <tr key={key.id} className={`border-b border-[#1f1f1f] hover:bg-[#1a1a1a] transition-colors ${i % 2 !== 0 ? "bg-[#0d0d0d]" : ""}`}>
                    <td className="px-5 py-3 font-medium text-white">{key.name}</td>
                    <td className="px-5 py-3"><ProviderBadge provider={key.provider} /></td>
                    <td className="px-5 py-3 font-mono text-xs text-[#666666]">••••{key.keyHash}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-[#f0f0f0]">{key.proxyKey}</span>
                        <CopyButton text={key.proxyKey} />
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[#666666]">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleKey(key.id, !key.isActive)}
                        className="flex items-center gap-1.5 text-xs transition-colors"
                        style={{ color: key.isActive ? "#00ff88" : "#666666" }}>
                        {key.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        {key.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => deleteKey(key.id)}
                        className="text-[#444444] hover:text-[#ff4444] transition-colors p-1">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Key Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-6 w-full max-w-md">
            <h3 className="font-mono text-base font-bold text-white mb-1">Add API Key</h3>
            <p className="text-sm text-[#666666] mb-5">Your key is encrypted at rest. We never expose it.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#f0f0f0] mb-1.5">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Production OpenAI Key"
                  className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#444444] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-[#f0f0f0] mb-1.5">Provider</label>
                <select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff88] transition-colors">
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#f0f0f0] mb-1.5">API Key</label>
                <input type="password" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#444444] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-colors font-mono" />
              </div>
              {formError && (
                <div className="bg-[#ff4444]/10 border border-[#ff4444]/30 rounded-lg px-3 py-2.5 text-sm text-[#ff4444]">{formError}</div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setFormError(""); setForm({ name: "", provider: "openai", apiKey: "" }); }}
                className="flex-1 border border-[#1f1f1f] text-[#f0f0f0] hover:border-[#666666] text-sm py-2.5 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={createKey} disabled={saving}
                className="flex-1 bg-[#00ff88] hover:bg-[#00cc6e] text-black font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Add Key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
