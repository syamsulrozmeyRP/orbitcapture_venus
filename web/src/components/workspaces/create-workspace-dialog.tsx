'use client'

import { useActionState, useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createWorkspaceAction } from "@/actions/workspaces";
import { initialActionState } from "@/lib/action-state";

export function CreateWorkspaceDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createWorkspaceAction, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [state.status]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          New workspace
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Set up branding once and reuse it across the planner, editor, and distribution center.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace name</Label>
            <Input id="name" name="name" placeholder="e.g., Orbit Agency" required />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Internal notes" rows={3} />
            {state.fieldErrors?.description && (
              <p className="text-sm text-destructive">{state.fieldErrors.description[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="brandColor">Brand color</Label>
            <Input id="brandColor" name="brandColor" type="color" defaultValue="#4F46E5" />
          </div>
          {state.message && state.status !== "success" && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
