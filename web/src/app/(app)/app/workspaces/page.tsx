import { notFound } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteMemberForm } from "@/components/workspaces/invite-member-form";
import { WorkspaceMembersTable } from "@/components/workspaces/workspace-members-table";
import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state";
import { withUserContext } from "@/lib/rls";
import { getWorkspaceContext } from "@/lib/workspace";

export default async function WorkspaceSettingsPage() {
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

  const workspace = await withUserContext(user.id, (tx) =>
    tx.workspace.findUnique({
      where: { id: activeMembership.workspaceId },
      include: {
        members: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
        invites: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  );

  if (!workspace) {
    notFound();
  }

  const canInvite = activeMembership.role === "ADMIN";

  const brandColor = (workspace.theme as { brandColor?: string } | null)?.brandColor ?? "#4F46E5";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workspace details</CardTitle>
          <CardDescription>
            Branding, domains, and role assignments live here. Coming next: distribution channels and analytics integrations.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Name</p>
            <p className="text-lg font-semibold">{workspace.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Slug</p>
            <p className="font-medium">{workspace.slug}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Brand color</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="h-8 w-8 rounded-full border" style={{ backgroundColor: brandColor }} />
              <span className="font-mono text-sm">{brandColor}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite teammates</CardTitle>
          <CardDescription>Admins can invite collaborators and assign default roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteMemberForm workspaceId={workspace.id} canInvite={canInvite} />
          {!canInvite && (
            <p className="mt-2 text-xs text-muted-foreground">
              Only admins can send invitations. Contact your workspace owner to request access.
            </p>
          )}
        </CardContent>
      </Card>

      <WorkspaceMembersTable
        workspaceId={workspace.id}
        members={workspace.members}
        invites={workspace.invites}
        currentUserId={user.id}
      />
    </div>
  );
}
