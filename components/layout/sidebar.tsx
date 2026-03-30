"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Key,
  Shield,
  ScrollText,
  Bell,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/keys", label: "API Keys", icon: Key },
  { href: "/dashboard/rules", label: "Rules", icon: Shield },
  { href: "/dashboard/logs", label: "Logs", icon: ScrollText },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ flaggedCount = 0 }: { flaggedCount?: number }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-[#111111] border-r border-[#1f1f1f] flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#1f1f1f]">
        <Link href="/dashboard" className="flex items-center gap-0">
          <span className="font-mono text-xl font-bold text-[#00ff88]">Leash</span>
          <span className="font-mono text-xl font-bold text-white">ly</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative",
                isActive
                  ? "bg-[#00ff88]/10 text-[#00ff88]"
                  : "text-[#999999] hover:text-white hover:bg-[#1f1f1f]"
              )}
            >
              <Icon size={16} />
              <span>{label}</span>
              {label === "Logs" && flaggedCount > 0 && (
                <span className="ml-auto bg-[#ff4444] text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {flaggedCount > 99 ? "99+" : flaggedCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-6 py-4 border-t border-[#1f1f1f]">
        <p className="text-[11px] text-[#444444] font-mono">Leashly v0.1.0</p>
      </div>
    </aside>
  );
}
