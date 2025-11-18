import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { getWorkspaceContext } from "@/lib/workspace";
import { getAiCreditUsage } from "@/lib/ai-credits";

type AppLayoutProps = {
  children: ReactNode;
};

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: AppLayoutProps) {
  const { user, memberships, activeMembership } = await getWorkspaceContext();

  if (!user) {
    redirect("/sign-in");
  }

  const workspaceSummaries = memberships.map((membership) => ({
    workspaceId: membership.workspaceId,
    name: membership.workspace.name,
    slug: membership.workspace.slug,
    role: membership.role,
  }));

  const activeWorkspaceSummary = activeMembership
    ? {
        workspaceId: activeMembership.workspaceId,
        name: activeMembership.workspace.name,
        slug: activeMembership.workspace.slug,
        role: activeMembership.role,
      }
    : null;

  const aiCredits = await getAiCreditUsage(user.id, activeMembership?.workspaceId);

  return (
    <div className="flex min-h-screen bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader
          workspaceSummaries={workspaceSummaries}
          activeWorkspace={activeWorkspaceSummary}
          aiCredits={aiCredits}
        />
        <main className="flex-1 px-6 pb-10 pt-6">{children}</main>
      </div>
    </div>
  );
}
