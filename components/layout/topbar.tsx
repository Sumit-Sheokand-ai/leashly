"use client";

import { useRouter, usePathname } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { NotificationBell } from "@/components/layout/notification-bell";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":            "Overview",
  "/dashboard/keys":      "API Keys",
  "/dashboard/rules":     "Rules",
  "/dashboard/logs":      "Request Logs",
  "/dashboard/alerts":    "Alerts",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings":  "Settings",
};

export function Topbar({ title }: { title: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  const pageLabel = ROUTE_LABELS[pathname] ?? title;

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

  const initials = email ? email[0].toUpperCase() : "?";

  return (
    <header className="h-14 bg-[#080808] border-b border-[#141414] flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[#2a2a2a] font-mono text-xs">Leashly</span>
        <span className="text-[#1e1e1e]">/</span>
        <span className="text-[#d0d0d0] font-medium text-sm">{pageLabel}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        <NotificationBell />

        <Link href="/dashboard/settings"
          className="p-2 text-[#333333] hover:text-[#888888] hover:bg-[#111111] rounded-lg transition-all">
          <Settings size={15} />
        </Link>

        <div className="flex items-center gap-2 pl-2 ml-1 border-l border-[#1a1a1a]">
          <div className="w-7 h-7 rounded-full bg-[#00ff88]/12 border border-[#00ff88]/20 flex items-center justify-center">
            <span className="text-[#00ff88] text-xs font-bold font-mono">{initials}</span>
          </div>
          <span className="text-xs text-[#444444] font-mono hidden sm:block max-w-[160px] truncate">{email}</span>
          <button onClick={handleSignOut}
            className="p-1.5 text-[#333333] hover:text-[#ff4444] hover:bg-[#ff4444]/8 rounded-lg transition-all ml-1"
            title="Sign out">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </header>
  );
}
