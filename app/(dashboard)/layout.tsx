import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const flaggedCount = await prisma.requestLog.count({
    where: {
      userId: user.id,
      flagged: true,
      timestamp: { gte: twentyFourHoursAgo },
    },
  });

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar flaggedCount={flaggedCount} />
      <div className="flex-1 ml-[240px] flex flex-col min-h-screen">
        <Topbar title="Leashly" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
