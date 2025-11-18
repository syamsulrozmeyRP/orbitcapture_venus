'use client'

import { useActionState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { switchWorkspaceAction } from "@/actions/workspaces";
import { initialActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";

export type WorkspaceSummary = {
  workspaceId: string;
  name: string;
  slug: string;
  role: string;
};

type Props = {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId?: string | null;
};

export function WorkspaceSwitcher({ workspaces, activeWorkspaceId }: Props) {
  const [state, formAction, isPending] = useActionState(switchWorkspaceAction, initialActionState);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-w-[180px] justify-between whitespace-nowrap"
        >
          {workspaces.find((w) => w.workspaceId === activeWorkspaceId)?.name ?? "Select workspace"}
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.length === 0 && (
          <DropdownMenuItem disabled>No workspaces yet</DropdownMenuItem>
        )}
        {workspaces.map((workspace) => (
          <form key={workspace.workspaceId} action={formAction}>
            <input type="hidden" name="workspaceId" value={workspace.workspaceId} />
            <DropdownMenuItem asChild disabled={isPending} className="cursor-pointer">
              <button type="submit" className="flex w-full items-center justify-between text-left">
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{workspace.name}</span>
                  <span className="text-xs text-muted-foreground">{workspace.role}</span>
                </span>
                <Check
                  className={cn(
                    "h-4 w-4",
                    activeWorkspaceId === workspace.workspaceId ? "opacity-100" : "opacity-0"
                  )}
                />
              </button>
            </DropdownMenuItem>
          </form>
        ))}
        {state.status === "error" && state.message && (
          <p className="px-2 pt-2 text-xs text-destructive">{state.message}</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
