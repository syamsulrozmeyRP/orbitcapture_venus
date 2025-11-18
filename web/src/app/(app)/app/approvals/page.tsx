import { getApprovalDashboard } from "@/lib/approvals";

import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state";
import { ApprovalSummaryCards } from "@/components/approvals/approval-summary-cards";
import { CreateApprovalRequestDialog } from "@/components/approvals/create-approval-dialog";
import { ApprovalQueue } from "@/components/approvals/approval-queue";
import { NotificationSettingsCard } from "@/components/approvals/notification-settings-card";
import { DistributionCenter } from "@/components/approvals/distribution-center";

export default async function ApprovalsPage() {
  const data = await getApprovalDashboard();

  if (!data.hasWorkspace) {
    return <WorkspaceEmptyState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Approvals</p>
          <h1 className="text-2xl font-semibold">Workflow & distribution</h1>
        </div>
        <CreateApprovalRequestDialog contentItems={data.contentItems} members={data.members} />
      </div>

      <ApprovalSummaryCards summary={data.summary} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <ApprovalQueue
            requests={data.queue}
            members={data.members}
            canReviewAsEditor={data.canReviewAsEditor}
            canReviewAsManager={data.canReviewAsManager}
            connections={data.distributionConnections}
          />
        </div>
        <div className="space-y-4">
          <NotificationSettingsCard settings={data.notificationSettings} />
          <DistributionCenter connections={data.distributionConnections} upcomingJobs={data.upcomingJobs} />
        </div>
      </div>
    </div>
  );
}
