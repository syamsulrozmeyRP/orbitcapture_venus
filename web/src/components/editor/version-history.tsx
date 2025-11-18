'use client'

import { useActionState } from "react";

import { createVersionAction, restoreVersionAction } from "@/actions/editor";
import { initialActionState } from "@/lib/action-state";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type VersionWithAuthor = {
  id: string;
  summary: string | null;
  createdAt: string;
  createdBy: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
};

type VersionHistoryProps = {
  contentItemId: string;
  versions: VersionWithAuthor[];
};

export function VersionHistory({ contentItemId, versions }: VersionHistoryProps) {
  const [createState, createAction, createPending] = useActionState(createVersionAction, initialActionState);
  const [restoreState, restoreAction, restorePending] = useActionState(restoreVersionAction, initialActionState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Version timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={createAction} className="space-y-2">
          <input type="hidden" name="contentItemId" value={contentItemId} />
          <Label htmlFor="summary">Snapshot note</Label>
          <Input id="summary" name="summary" placeholder="e.g. Ready for SEO review" />
          {createState.message && createState.status === "error" && (
            <p className="text-xs text-destructive">{createState.message}</p>
          )}
          <Button type="submit" className="w-full" disabled={createPending}>
            {createPending ? "Saving…" : "Save version"}
          </Button>
        </form>
        <div className="space-y-3">
          {versions.length === 0 && (
            <p className="text-sm text-muted-foreground">No versions yet.</p>
          )}
          {versions.map((version) => (
            <div key={version.id} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{version.summary ?? "Manual snapshot"}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(version.createdAt).toLocaleString()} by {version.createdBy.firstName ?? version.createdBy.email}
              </p>
              <form action={restoreAction} className="mt-2">
                <input type="hidden" name="versionId" value={version.id} />
                <Button size="sm" variant="outline" disabled={restorePending}>
                  Restore
                </Button>
              </form>
            </div>
          ))}
          {restoreState.message && restoreState.status === "error" && (
            <p className="text-xs text-destructive">{restoreState.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
