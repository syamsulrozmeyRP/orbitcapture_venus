import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state";
import { getWorkspaceContext } from "@/lib/workspace";

const overviewCards = [
  {
    label: "Scheduled items",
    value: "12",
    helper: "Next 30 days",
  },
  {
    label: "Approvals pending",
    value: "3",
    helper: "Need manager review",
  },
  {
    label: "AI credits",
    value: "1,240",
    helper: "of 2,000 monthly",
  },
];

export default async function DashboardPage() {
  const { activeMembership } = await getWorkspaceContext();

  if (!activeMembership) {
    return (
      <div className="space-y-6">
        <WorkspaceEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Workspace</p>
        <h1 className="text-2xl font-semibold text-foreground">{activeMembership.workspace.name}</h1>
        <p className="text-sm text-muted-foreground">
          Customize branding, invite collaborators, and keep every channel aligned.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {overviewCards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Workspace activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Editor.js block editor, distribution channels, and analytics will land here next.</p>
          <p>
            For now, confirm authentication, workspace selection, and RBAC are functioning with Clerk + PostgreSQL.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
