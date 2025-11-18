'use client'

import { UserButton } from "@clerk/nextjs";
import { Briefcase, Coins } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  WorkspaceSwitcher,
  type WorkspaceSummary,
} from "@/components/workspaces/workspace-switcher";
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog";
import type { AiCreditSnapshot } from "@/lib/ai-credits";

type AppHeaderProps = {
  workspaceSummaries: WorkspaceSummary[];
  activeWorkspace?: WorkspaceSummary | null;
  aiCredits: AiCreditSnapshot;
};

export function AppHeader({ workspaceSummaries, activeWorkspace, aiCredits }: AppHeaderProps) {
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
        <CreditsBadge credits={aiCredits} />
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

function CreditsBadge({ credits }: { credits: AiCreditSnapshot }) {
  const formatter = new Intl.NumberFormat("en-US");
  const safeLimit = credits.limit > 0 ? credits.limit : 1;
  const used = Math.max(0, credits.used);
  const remaining = Math.max(credits.limit - used, 0);
  const usagePercent = Math.min(100, Math.round((used / safeLimit) * 100));

  return (
    <div className="relative group/credits">
      <button
        type="button"
        className="flex items-center gap-2 rounded-full border border-border/60 bg-white/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm transition hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Coins className="h-4 w-4 text-emerald-600" />
        <span className="hidden sm:inline">Credits</span>
        <span className="text-muted-foreground">{formatter.format(remaining)} left</span>
        <span className="hidden items-center gap-1 sm:flex">
          <span className="text-[11px] text-muted-foreground">{usagePercent}% used</span>
          <div className="h-1.5 w-16 rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-primary"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </span>
      </button>
      <div className="invisible absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-border bg-white p-4 text-sm shadow-2xl opacity-0 transition-all duration-150 group-hover/credits:visible group-hover/credits:opacity-100 group-focus-within/credits:visible group-focus-within/credits:opacity-100">
        <div className="flex items-center justify-between text-xs font-medium">
          <span>{formatter.format(used)} tokens used</span>
          <span className="text-muted-foreground">{formatter.format(credits.limit)} monthly</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-primary"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="mt-3 grid gap-1 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span>Credits reset at the start of each month.</span>
          <span>Upgrade in Billing to unlock more OpenRouter generations.</span>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Available</p>
            <p className="text-lg font-semibold text-emerald-600">{formatter.format(remaining)}</p>
          </div>
          <Button variant="secondary" size="sm" className="text-xs">
            Credit usage
          </Button>
        </div>
      </div>
    </div>
  );
}
