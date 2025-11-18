import { notFound } from "next/navigation";

import { withUserContext } from "@/lib/rls";
import { getWorkspaceContext } from "@/lib/workspace";

import { PersonaList } from "@/components/personas/persona-list";
import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state";

export default async function PersonasPage() {
  const { user, activeMembership } = await getWorkspaceContext();

  if (!user) {
    notFound();
  }

  if (!activeMembership) {
    return (
      <div className="space-y-6">
        <WorkspaceEmptyState />
      </div>
    );
  }

  const personas = await withUserContext(user.id, (tx) =>
    tx.persona.findMany({
      where: { workspaceId: activeMembership.workspaceId },
      orderBy: { createdAt: "desc" },
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Personas</p>
        <h1 className="text-2xl font-semibold">Audience intelligence</h1>
      </div>
      <PersonaList personas={personas} />
    </div>
  );
}
