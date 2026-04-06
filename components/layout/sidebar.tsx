"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Key, Shield, ScrollText, Bell, Settings, BarChart2, Zap, Database, FlaskConical, Users, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",            label: "Overview",   icon: LayoutDashboard },
  { href: "/dashboard/analytics",  label: "Analytics",  icon: BarChart2 },
  { href: "/dashboard/keys",       label: "API Keys",   icon: Key },
  { href: "/dashboard/rules",      label: "Rules",      icon: Shield },
  // New upgrade features
  { href: "/dashboard/routing",    label: "Routing",    icon: Zap,          badge: "new" },
  { href: "/dashboard/cache",      label: "Cache",      icon: Database,     badge: "new" },
  { href: "/dashboard/benchmark",  label: "Benchmark",  icon: FlaskConical, badge: "new" },
  // Existing
  { href: "/dashboard/logs",       label: "Logs",       icon: ScrollText },
  { href: "/dashboard/alerts",     label: "Alerts",     icon: Bell },
  // New
  { href: "/dashboard/workspace",  label: "Workspace",  icon: Users,        badge: "new" },
  { href: "/dashboard/settings",   label: "Settings",   icon: Settings },
  { href: "/dashboard/billing",    label: "Billing",    icon: CreditCard,   badge: "new" },
];

export function Sidebar({ flaggedCount = 0 }: { flaggedCount?: number }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-[#080808] border-r border-[#111111] flex flex-col z-40">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-[#111111]">
        <Link href="/dashboard" className="flex items-center">
          <Image src="/logo.svg" alt="Leashly" width={112} height={28} priority />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const isActive = href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);

          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all relative",
                isActive
                  ? "bg-[#00ff88]/8 text-white"
                  : "text-[#555555] hover:text-[#aaaaaa] hover:bg-[#0d0d0d]"
              )}>
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#00ff88] rounded-r-full" />
              )}
              <Icon size={15} className={isActive ? "text-[#00ff88]" : ""} />
              <span className="font-medium flex-1">{label}</span>
              {label === "Logs" && flaggedCount > 0 && (
                <span className="ml-auto bg-[#ff4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {flaggedCount > 99 ? "99+" : flaggedCount}
                </span>
              )}
              {badge && !isActive && (
                <span className="text-[9px] font-bold uppercase tracking-wide bg-[#00ff88]/10 text-[#00ff88] px-1.5 py-0.5 rounded-full border border-[#00ff88]/20">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#111111]">
        <p className="text-[10px] text-[#222222] font-mono">v0.2.0</p>
      </div>
    </aside>
  );
}
