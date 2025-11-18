'use client'

import { useActionState } from "react";

import { createCommentThreadAction, replyToThreadAction, resolveThreadAction } from "@/actions/editor";
import { initialActionState } from "@/lib/action-state";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommentAuthor = {
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
};

export type EditorThread = {
  id: string;
  anchor: { text?: string } | null;
  resolved: boolean;
  comments: {
    id: string;
    body: string;
    createdAt: string;
    author: CommentAuthor;
  }[];
  author: CommentAuthor;
};

type CommentPanelProps = {
  contentItemId: string;
  threads: EditorThread[];
  anchor: { text: string; createdAt: number } | null;
};

export function CommentPanel({ contentItemId, threads, anchor }: CommentPanelProps) {
  const [createState, createAction, createPending] = useActionState(createCommentThreadAction, initialActionState);
  const [replyState, replyAction, replyPending] = useActionState(replyToThreadAction, initialActionState);
  const [resolveState, resolveAction, resolvePending] = useActionState(resolveThreadAction, initialActionState);

  const anchorValue = anchor ? JSON.stringify(anchor) : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <form action={createAction} className="space-y-2">
          <input type="hidden" name="contentItemId" value={contentItemId} />
          <input type="hidden" name="anchor" value={anchorValue} />
          <Textarea
            name="body"
            placeholder={anchor ? `Feedback on “${anchor.text.slice(0, 48)}”` : "Highlight text in the editor, then leave a comment"}
            rows={3}
            required
          />
          {createState.message && createState.status === "error" && (
            <p className="text-xs text-destructive">{createState.message}</p>
          )}
          <Button type="submit" size="sm" disabled={createPending}>
            {createPending ? "Posting…" : "Add comment"}
          </Button>
        </form>
        <div className="space-y-3">
          {threads.length === 0 && <p className="text-muted-foreground">No comments yet.</p>}
          {threads.map((thread) => (
            <div key={thread.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase text-muted-foreground">{thread.resolved ? "Resolved" : "Open"}</p>
                <form action={resolveAction}>
                  <input type="hidden" name="threadId" value={thread.id} />
                  <input type="hidden" name="resolved" value={(!thread.resolved).toString()} />
                  <Button size="sm" variant="ghost" type="submit" disabled={resolvePending}>
                    {thread.resolved ? "Reopen" : "Resolve"}
                  </Button>
                </form>
              </div>
              {thread.anchor?.text && <p className="mt-1 rounded bg-muted px-2 py-1 text-xs">“{thread.anchor.text}”</p>}
              <div className="mt-2 space-y-2">
                {thread.comments.map((comment) => (
                  <div key={comment.id} className="rounded bg-secondary/30 p-2">
                    <p className="text-xs font-semibold">
                      {comment.author.firstName ?? comment.author.email} · {new Date(comment.createdAt).toLocaleString()}
                    </p>
                    <p>{comment.body}</p>
                  </div>
                ))}
              </div>
              <form action={replyAction} className="mt-3 space-y-2">
                <input type="hidden" name="threadId" value={thread.id} />
                <Textarea name="body" rows={2} placeholder="Reply…" required />
                {replyState.message && replyState.status === "error" && (
                  <p className="text-xs text-destructive">{replyState.message}</p>
                )}
                <Button size="sm" type="submit" disabled={replyPending}>
                  {replyPending ? "Sending…" : "Reply"}
                </Button>
              </form>
            </div>
          ))}
          {resolveState.message && resolveState.status === "error" && (
            <p className="text-xs text-destructive">{resolveState.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
