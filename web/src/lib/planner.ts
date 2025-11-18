import { endOfMonth, startOfMonth } from "date-fns";

import { getWorkspaceContext } from "@/lib/workspace";
import { withUserContext } from "@/lib/rls";

const MONTHLY_CREDIT_LIMIT = 50000;

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
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const [personas, contentItems, tasks, members, usage] = await withUserContext(user.id, (tx) =>
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
      tx.aiUsage.aggregate({
        _sum: { promptTokens: true, completionTokens: true },
        where: {
          workspaceId,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
    ]),
  );

  const used = (usage._sum.promptTokens ?? 0) + (usage._sum.completionTokens ?? 0);

  return {
    user,
    activeMembership,
    memberships,
    personas,
    contentItems,
    tasks,
    members,
    aiCredits: { used, limit: MONTHLY_CREDIT_LIMIT },
  } as const;
}
