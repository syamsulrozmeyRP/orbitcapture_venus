'use client'

import { useActionState, useEffect, useState } from "react";
import { Users } from "lucide-react";

import { inviteMemberAction } from "@/actions/workspaces";
import { initialActionState } from "@/lib/action-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const roles = [
  { value: "ADMIN", label: "Admin" },
  { value: "EDITOR", label: "Editor" },
  { value: "WRITER", label: "Writer" },
  { value: "VIEWER", label: "Viewer" },
];

type Props = {
  workspaceId: string;
  canInvite: boolean;
};

export function InviteMemberForm({ workspaceId, canInvite }: Props) {
  const [state, formAction, isPending] = useActionState(inviteMemberAction, initialActionState);
  const [role, setRole] = useState("EDITOR");

  useEffect(() => {
    if (state.status === "success") {
      (document.getElementById("invite-form") as HTMLFormElement | null)?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRole("EDITOR");
    }
  }, [state.status]);

  return (
    <form id="invite-form" action={formAction} className="space-y-3">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <div className="flex items-center gap-2 text-sm font-medium">
        <Users className="h-4 w-4" /> Invite collaborators
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="teammate@agency.com"
            required
            disabled={!canInvite || isPending}
          />
          {state.fieldErrors?.email && (
            <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <input type="hidden" name="role" value={role} />
          <Select
            value={role}
            onValueChange={setRole}
            disabled={!canInvite || isPending}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {state.message && state.status !== "success" && (
        <p className="text-xs text-destructive">{state.message}</p>
      )}
      <Button type="submit" disabled={!canInvite || isPending}>
        {isPending ? "Sending..." : "Send invite"}
      </Button>
    </form>
  );
}
