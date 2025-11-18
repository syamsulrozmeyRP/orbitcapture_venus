import { cookies } from "next/headers";

import { getOrCreateCurrentUser } from "@/lib/auth";
import { WORKSPACE_COOKIE } from "@/lib/constants";
import { withUserContext } from "@/lib/rls";

export async function getWorkspaceContext() {
  const user = await getOrCreateCurrentUser();

  if (!user) {
    return {
      user: null,
      memberships: [],
      activeMembership: null,
    } as const;
  }

  const memberships = await withUserContext(user.id, (tx) =>
    tx.workspaceMember.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: { workspace: true },
      orderBy: { workspace: { createdAt: "asc" } },
    }),
  );

  const cookieStore = await cookies();
  const cookieWorkspaceId = cookieStore.get(WORKSPACE_COOKIE)?.value;
  const activeMembership =
    memberships.find((member) => member.workspaceId === cookieWorkspaceId) ?? memberships[0] ?? null;

  return {
    user,
    memberships,
    activeMembership,
  } as const;
}
