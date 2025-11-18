import { getPlannerData } from "@/lib/planner";

import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state";
import { CalendarBoard } from "@/components/planner/calendar-board";
import { CreateContentDialog } from "@/components/planner/create-content-dialog";
import { TaskList } from "@/components/planner/task-list";
import { AiCreditCard } from "@/components/planner/ai-credit-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PlannerPage() {
  const data = await getPlannerData();

  if (!data.activeMembership) {
    return (
      <div className="space-y-6">
        <WorkspaceEmptyState />
      </div>
    );
  }

  const scheduledCount = data.contentItems.filter((item) => item.scheduledAt !== null).length;
  const tasksInProgress = data.tasks.filter((task) => task.status !== "COMPLETED").length;

  const personaOptions = data.personas.map((persona) => ({
    id: persona.id,
    name: persona.name,
    jobTitle: persona.jobTitle,
    industry: persona.industry,
    pains: persona.pains,
    goals: persona.goals,
  }));

  const calendarEvents = data.contentItems.map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    channel: item.channel,
    personaName: item.persona?.name,
    scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString() : null,
  }));

  const contentOptions = data.contentItems.map((item) => ({ id: item.id, title: item.title }));
  const memberOptions = data.members.map((member) => ({
    id: member.user.id,
    label: member.user.firstName ? `${member.user.firstName} ${member.user.lastName ?? ""}` : member.user.email,
  }));

  const taskPayload = data.tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    contentItem: {
      id: task.contentItem.id,
      title: task.contentItem.title,
      scheduledAt: task.contentItem.scheduledAt ? task.contentItem.scheduledAt.toISOString() : null,
    },
    assignee: task.assignee
      ? {
          firstName: task.assignee.firstName,
          lastName: task.assignee.lastName,
          email: task.assignee.email,
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Planner</p>
          <h1 className="text-2xl font-semibold">Content calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <CreateContentDialog personas={personaOptions} />
          <Button variant="ghost" asChild>
            <a href="/app/personas">Manage personas</a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Scheduled items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{scheduledCount}</p>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Open tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{tasksInProgress}</p>
            <p className="text-xs text-muted-foreground">Awaiting review or delivery</p>
          </CardContent>
        </Card>
        <AiCreditCard used={data.aiCredits.used} limit={data.aiCredits.limit} />
      </div>

      <CalendarBoard events={calendarEvents} />

      <TaskList tasks={taskPayload} contentItems={contentOptions} members={memberOptions} />
    </div>
  );
}
