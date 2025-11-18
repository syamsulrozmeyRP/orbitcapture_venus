'use client'

import { useActionState, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { removeMemberAction, updateMemberRoleAction } from "@/actions/workspaces";
import { initialActionState } from "@/lib/action-state";

const roles = [
  { value: "ADMIN", label: "Admin" },
  { value: "EDITOR", label: "Editor" },
  { value: "WRITER", label: "Writer" },
  { value: "VIEWER", label: "Viewer" },
];

type Props = {
  workspaceId: string;
  memberId: string;
  currentRole: string;
  canEditRole: boolean;
  canRemove: boolean;
};

export function MemberRoleActions({
  workspaceId,
  memberId,
  currentRole,
  canEditRole,
  canRemove,
}: Props) {
  const [, roleAction, rolePending] = useActionState(updateMemberRoleAction, initialActionState);
  const [, removeAction, removePending] = useActionState(removeMemberAction, initialActionState);
  const [role, setRole] = useState(currentRole);

  useEffect(() => {
    setRole(currentRole);
  }, [currentRole]);

  const handleRoleChange = (role: string) => {
    const data = new FormData();
    data.append("workspaceId", workspaceId);
    data.append("memberId", memberId);
    data.append("role", role);
    roleAction(data);
  };

  const handleRemove = () => {
    const data = new FormData();
    data.append("workspaceId", workspaceId);
    data.append("memberId", memberId);
    removeAction(data);
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={role}
        onValueChange={(value) => {
          setRole(value);
          handleRoleChange(value);
        }}
        disabled={!canEditRole || rolePending}
      >
        <SelectTrigger className="h-9 w-[130px]">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              {role.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!canRemove || removePending}
        onClick={handleRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
