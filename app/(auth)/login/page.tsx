"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  // Where to go after login — default dashboard
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      setSuccess("Account created! Check your email to confirm, then sign in.");
    }
    if (searchParams.get("error") === "auth_failed") {
      setError("Authentication failed. Please try again.");
    }
    if (searchParams.get("error") === "missing_code") {
      setError("Invalid login link. Please try again.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email || !password) { setError("Email and password are required"); return; }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      if (signInError.message.includes("Email not confirmed")) {
        setError("Please confirm your email before signing in. Check your inbox.");
      } else {
        setError("Invalid email or password");
      }
    } else {
      // New users (no keys yet) → onboarding
      const keysRes = await fetch("/api/keys").catch(() => null);
      const keys    = keysRes?.ok ? await keysRes.json().catch(() => []) : [];
      const isNew   = Array.isArray(keys) && keys.length === 0 && redirectTo === "/dashboard";
      router.push(isNew ? "/dashboard/onboarding" : redirectTo);
      router.refresh();
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    setOauthLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirectTo)}` },
    });
  }

  const inputCls = "w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#444444] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/20 transition-colors";

  return (
    <div className="w-full max-w-md">
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-8">
        <h1 className="font-mono text-xl font-bold text-white mb-2">Sign in</h1>
        <p className="text-[#555555] text-sm mb-6">Enter your credentials to access the dashboard</p>

        <div className="space-y-2 mb-6">
          <button onClick={() => handleOAuth("google")} disabled={!!oauthLoading}
            className="w-full flex items-center justify-center gap-3 bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#00ff88] text-white text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {oauthLoading === "google" ? "Redirecting..." : "Continue with Google"}
          </button>
          <button onClick={() => handleOAuth("github")} disabled={!!oauthLoading}
            className="w-full flex items-center justify-center gap-3 bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#00ff88] text-white text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            {oauthLoading === "github" ? "Redirecting..." : "Continue with GitHub"}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[#1f1f1f]" />
          <span className="text-xs text-[#444444] font-mono">or</span>
          <div className="flex-1 h-px bg-[#1f1f1f]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#cccccc] mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-[#cccccc] mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" className={inputCls} />
          </div>

          {success && <div className="bg-[#00ff88]/8 border border-[#00ff88]/25 rounded-lg px-3 py-2.5 text-sm text-[#00ff88]">{success}</div>}
          {error && <div className="bg-[#ff4444]/8 border border-[#ff4444]/25 rounded-lg px-3 py-2.5 text-sm text-[#ff6666]">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[#555555]">
          Don&apos;t have an account?{" "}
          <Link href={`/register${redirectTo !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="text-[#00ff88] hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
