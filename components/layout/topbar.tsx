"use client";

import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function Topbar({ title }: { title: string }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-16 bg-[#0a0a0a] border-b border-[#1f1f1f] flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="font-mono text-base font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-[#666666]">
          <User size={14} />
          <span className="font-mono text-xs">{email}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-xs text-[#666666] hover:text-[#ff4444] transition-colors"
        >
          <LogOut size={14} />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}
