import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard-shell";
import { auth, LOCAL_LOGIN_ENABLED } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { ensureWorkspaceForUser } from "@/lib/workspace";

const dashboardBrand = LOCAL_LOGIN_ENABLED ? "Pour&Prompt" : "OpenReply";

export const metadata: Metadata = {
  title: `${dashboardBrand} Dashboard`,
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspace = await ensureWorkspaceForUser(
    session.user.id,
    session.user.email
  );
  const accounts = await prisma.instagramAccount.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { connectedAt: "desc" },
    select: { username: true },
  });

  return (
    <DashboardShell
      brandName={dashboardBrand}
      workspaceName={workspace.name}
      instagramUsername={accounts[0]?.username ?? null}
      instagramAccountCount={accounts.length}
    >
      {children}
    </DashboardShell>
  );
}
