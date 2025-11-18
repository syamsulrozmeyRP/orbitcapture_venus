import Link from "next/link";

import { withUserContext } from "@/lib/rls";
import { getWorkspaceContext } from "@/lib/workspace";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state";

export default async function EditorHomePage() {
  const { user, activeMembership } = await getWorkspaceContext();

  if (!user) {
    return null;
  }

  if (!activeMembership) {
    return (
      <div className="space-y-6">
        <WorkspaceEmptyState />
      </div>
    );
  }

  const contentItems = await withUserContext(user.id, (tx) =>
    tx.contentItem.findMany({
      where: { workspaceId: activeMembership.workspaceId },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        scheduledAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Editor</p>
          <h1 className="text-2xl font-semibold">Collaborative drafts</h1>
        </div>
        <Button asChild>
          <Link href="/app/planner">Create new content</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Draft library</CardTitle>
          <CardDescription>Jump into the Editor.js canvas for any planned item.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {contentItems.length === 0 && (
            <p className="py-6 text-sm text-muted-foreground">No drafts yet—start from the planner.</p>
          )}
          {contentItems.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  Status: {item.status.replace("_", " ")} · Updated {item.updatedAt.toLocaleDateString()}
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/app/editor/${item.id}`}>Open editor</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
