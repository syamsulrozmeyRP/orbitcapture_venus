import { getPlannerData } from "@/lib/planner";

import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state";
import { PlannerClient } from "@/components/planner/planner-client";

export default async function PlannerPage() {
  const data = await getPlannerData();

  if (!data.activeMembership) {
    return (
      <div className="space-y-6">
        <WorkspaceEmptyState />
      </div>
    );
  }

  const calendarEvents = data.contentItems.map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    channel: item.channel,
    personaName: item.persona?.name,
    scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Planner</p>
        <h1 className="text-2xl font-semibold">Content calendar</h1>
      </div>

      <PlannerClient events={calendarEvents} />
    </div>
  );
}
