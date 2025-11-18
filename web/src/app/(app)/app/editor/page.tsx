import { withUserContext } from "@/lib/rls";
import { getWorkspaceContext } from "@/lib/workspace";

import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state";
import { EditorHomeClient } from "@/components/editor/editor-home-client";

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

  const [personas, contentItems] = await withUserContext(user.id, (tx) =>
    Promise.all([
      tx.persona.findMany({
        where: { workspaceId: activeMembership.workspaceId },
        select: {
          id: true,
          name: true,
          jobTitle: true,
          industry: true,
          goals: true,
          pains: true,
          voice: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      tx.contentItem.findMany({
        where: { workspaceId: activeMembership.workspaceId },
        include: {
          persona: { select: { name: true } },
          createdBy: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 40,
      }),
    ]),
  );

  const personaOptions = personas.map((persona) => ({
    id: persona.id,
    name: persona.name,
    jobTitle: persona.jobTitle,
    industry: persona.industry,
    goals: persona.goals,
    pains: persona.pains,
    voice: persona.voice,
  }));

  const contentPlans = contentItems.map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    channel: item.channel,
    personaName: item.persona?.name ?? null,
    writerName: formatMemberName(item.createdBy?.firstName, item.createdBy?.lastName, item.createdBy?.email),
    scheduledAt: item.scheduledAt?.toISOString() ?? null,
    updatedAt: item.updatedAt.toISOString(),
  }));

  const greetingName = user.firstName ?? user.lastName ?? user.email.split("@")[0];

  return (
    <div className="space-y-6">
      <EditorHomeClient greetingName={greetingName} personas={personaOptions} contentPlans={contentPlans} />
    </div>
  );
}

function formatMemberName(firstName?: string | null, lastName?: string | null, email?: string | null) {
  if (firstName || lastName) {
    return `${firstName ?? ""} ${lastName ?? ""}`.trim();
  }
  if (!email) return "AI Orbi";
  return email.split("@")[0];
}
