"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";

export function Topbar({ title }: { title: string }) {
  const { data: session } = useSession();

  return (
    <header className="h-16 bg-[#0a0a0a] border-b border-[#1f1f1f] flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="font-mono text-base font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-[#666666]">
          <User size={14} />
          <span className="font-mono text-xs">{session?.user?.email}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-xs text-[#666666] hover:text-[#ff4444] transition-colors"
        >
          <LogOut size={14} />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}
