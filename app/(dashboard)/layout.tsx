import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  let flaggedCount = 0;
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    flaggedCount = await prisma.requestLog.count({
      where: { userId: user.id, flagged: true, timestamp: { gte: twentyFourHoursAgo } },
    });
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
