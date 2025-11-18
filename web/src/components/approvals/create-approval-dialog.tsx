'use client'

import { useActionState, useEffect, useMemo, useState } from "react";

import { WorkspaceRole } from "@prisma/client";

import type { ContentOption, MemberOption } from "@/lib/approvals";
import { createApprovalRequestAction } from "@/actions/approvals";
import { initialActionState } from "@/lib/action-state";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  contentItems: ContentOption[];
  members: MemberOption[];
};

export function CreateApprovalRequestDialog({ contentItems, members }: Props) {
  const [state, formAction, pending] = useActionState(createApprovalRequestAction, initialActionState);
  const [open, setOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | undefined>();

  useEffect(() => {
    if (state.status === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      setSelectedContentId(undefined);
    }
  }, [state.status]);

  const selectedContent = useMemo(() => contentItems.find((item) => item.id === selectedContentId), [contentItems, selectedContentId]);

  const editorOptions = members.filter((member) => member.role === WorkspaceRole.ADMIN || member.role === WorkspaceRole.EDITOR);
  const managerOptions = members.filter((member) => member.role === WorkspaceRole.ADMIN);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Create approval
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start approval workflow</DialogTitle>
          <DialogDescription>Select a content item, assign reviewers, and optionally submit immediately.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Content item</Label>
            <Select
              name="contentItemId"
              value={selectedContentId}
              onValueChange={(value) => setSelectedContentId(value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select content" />
              </SelectTrigger>
              <SelectContent>
                {contentItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.title} {item.channel ? `· ${item.channel}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedContent && (
              <p className="text-xs text-muted-foreground">
                {selectedContent.personaName ? `${selectedContent.personaName} persona · ` : ""}
                Status: {selectedContent.status}
                {selectedContent.scheduledAt ? ` · Scheduled ${new Date(selectedContent.scheduledAt).toLocaleString()}` : ""}
              </p>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Editor reviewer</Label>
              <Select name="editorReviewerId">
                <SelectTrigger>
                  <SelectValue placeholder="Select editor" />
                </SelectTrigger>
                <SelectContent>
                  {editorOptions.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Manager reviewer</Label>
              <Select name="managerReviewerId">
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {managerOptions.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Kickoff note</Label>
            <Textarea id="note" name="note" rows={3} placeholder="Call out important context or links" />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-3">
            <input id="autoSubmit" name="autoSubmit" type="checkbox" className="h-4 w-4 rounded border border-input accent-primary" />
            <div>
              <Label htmlFor="autoSubmit" className="text-sm font-medium">
                Submit immediately
              </Label>
              <p className="text-xs text-muted-foreground">Moves the request straight into Editor review once saved.</p>
            </div>
          </div>
          {state.status === "error" && state.message && <p className="text-sm text-destructive">{state.message}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create workflow"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
