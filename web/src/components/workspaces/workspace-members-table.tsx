import { type MembershipStatus, type WorkspaceRole } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MemberRoleActions } from "@/components/workspaces/member-role-actions";

type Member = {
  id: string;
  role: WorkspaceRole;
  status: MembershipStatus;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
};

type Invite = {
  id: string;
  email: string;
  role: WorkspaceRole;
  createdAt: Date;
};

type Props = {
  workspaceId: string;
  members: Member[];
  invites: Invite[];
  currentUserId: string;
};

export function WorkspaceMembersTable({ workspaceId, members, invites, currentUserId }: Props) {
  const currentUserMembership = members.find((member) => member.user.id === currentUserId);
  const canManage = currentUserMembership?.role === "ADMIN";

  return (
    <div className="grid gap-6" id="members">
      <Card>
        <CardHeader>
          <CardTitle>Active members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.user.firstName ? `${member.user.firstName} ${member.user.lastName ?? ""}` : member.user.email}
                  </TableCell>
                  <TableCell>{member.user.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === "ADMIN" ? "default" : "outline"}>{member.role}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{member.status.toLowerCase()}</TableCell>
                  <TableCell className="flex justify-end">
                    <MemberRoleActions
                      workspaceId={workspaceId}
                      memberId={member.id}
                      currentRole={member.role}
                      canEditRole={canManage && member.user.id !== currentUserId}
                      canRemove={canManage && member.user.id !== currentUserId}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Role: {invite.role} • Invited {invite.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline">Pending</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
