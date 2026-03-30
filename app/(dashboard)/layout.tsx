import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/prisma";
import { SessionProvider } from "@/components/layout/session-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const flaggedCount = await prisma.requestLog.count({
    where: {
      userId: session.user.id,
      flagged: true,
      timestamp: { gte: twentyFourHoursAgo },
    },
  });

  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar flaggedCount={flaggedCount} />
        <div className="flex-1 ml-[240px] flex flex-col min-h-screen">
          <Topbar title="Leashly" />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
