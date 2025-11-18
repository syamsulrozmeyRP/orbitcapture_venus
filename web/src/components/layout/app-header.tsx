'use client'

import { UserButton } from "@clerk/nextjs";
import { Briefcase } from "lucide-react";

import {
  WorkspaceSwitcher,
  type WorkspaceSummary,
} from "@/components/workspaces/workspace-switcher";
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog";

type AppHeaderProps = {
  workspaceSummaries: WorkspaceSummary[];
  activeWorkspace?: WorkspaceSummary | null;
};

export function AppHeader({ workspaceSummaries, activeWorkspace }: AppHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white/80 px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Briefcase className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Active workspace</p>
          <p className="text-base font-semibold text-foreground">
            {activeWorkspace?.name ?? "No workspace selected"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <WorkspaceSwitcher
          workspaces={workspaceSummaries}
          activeWorkspaceId={activeWorkspace?.workspaceId}
        />
        <CreateWorkspaceDialog />
        <UserButton afterSignOutUrl="/" showName appearance={{ elements: { userButtonPopoverCard: "border border-border" } }} />
      </div>
    </header>
  );
}
