import { getWorkspaceContext } from "@/lib/workspace";
import { withUserContext } from "@/lib/rls";
import { getAiCreditUsage, MONTHLY_CREDIT_LIMIT } from "@/lib/ai-credits";

export async function getPlannerData() {
  const { user, activeMembership, memberships } = await getWorkspaceContext();

  if (!user || !activeMembership) {
    return {
      user,
      activeMembership: null,
      memberships,
      personas: [],
      contentItems: [],
      tasks: [],
      members: [],
      aiCredits: { used: 0, limit: MONTHLY_CREDIT_LIMIT },
    } as const;
  }

  const workspaceId = activeMembership.workspaceId;

  const [personas, contentItems, tasks, members] = await withUserContext(user.id, (tx) =>
    Promise.all([
      tx.persona.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
      }),
      tx.contentItem.findMany({
        where: { workspaceId },
        include: {
          persona: true,
          tasks: true,
        },
        orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
      }),
      tx.contentTask.findMany({
        where: { workspaceId },
        include: {
          contentItem: {
            select: { id: true, title: true, scheduledAt: true },
          },
          assignee: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      tx.workspaceMember.findMany({
        where: { workspaceId },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      }),
    ]),
  );

  const aiCredits = await getAiCreditUsage(user.id, workspaceId);

  return {
    user,
    activeMembership,
    memberships,
    personas,
    contentItems,
    tasks,
    members,
    aiCredits,
  } as const;
}
