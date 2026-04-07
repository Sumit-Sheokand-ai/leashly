import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  let flaggedCount = 0;
  try {
    const db = createSupabaseAdmin();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await db.from("RequestLog")
      .select("id", { count: "exact", head: true })
      .eq("userId", user.id).eq("flagged", true).gte("timestamp", dayAgo);
    flaggedCount = count ?? 0;
  } catch {}

  return (
    <div className="flex min-h-screen bg-[#080808]">
      <Sidebar flaggedCount={flaggedCount} />
      <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
        <Topbar title="Leashly" />
        <main className="flex-1 p-6 max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}
