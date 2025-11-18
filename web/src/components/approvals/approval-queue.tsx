'use client'

import { useActionState, useEffect, useState } from "react";
import { format } from "date-fns";
import { ApprovalState, DistributionChannel } from "@prisma/client";

import type {
  ApprovalQueueItem,
  MemberOption,
  DistributionConnection,
  DistributionJobSummary,
} from "@/lib/approvals";
import {
  transitionApprovalAction,
  updateApprovalAssignmentsAction,
  createApprovalCommentAction,
} from "@/actions/approvals";
import { scheduleDistributionJobAction } from "@/actions/distribution";
import { initialActionState } from "@/lib/action-state";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  requests: ApprovalQueueItem[];
  members: MemberOption[];
  canReviewAsEditor: boolean;
  canReviewAsManager: boolean;
  connections: DistributionConnection[];
};

const stateStyles: Record<ApprovalState, string> = {
  DRAFT: "bg-muted text-foreground",
  EDITOR_REVIEW: "bg-amber-100 text-amber-700",
  MANAGER_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export function ApprovalQueue({ requests, members, canReviewAsEditor, canReviewAsManager, connections }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRequest = requests.find((item) => item.id === selectedId) ?? null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Approval queue</CardTitle>
            <CardDescription>Track every request across Editor and Manager stages.</CardDescription>
          </div>
          <Badge variant="outline">Open {requests.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 && <p className="text-sm text-muted-foreground">No approval requests yet.</p>}
          {requests.map((request) => (
            <div key={request.id} className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{request.content.title}</p>
                  <Badge className={stateStyles[request.state]}>{request.state.replace("_", " ")}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Requested by {request.requestedBy.name} · {request.content.channel ?? "Unassigned channel"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedId(request.id)}>
                Review
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <ApprovalDetailSheet
        request={selectedRequest}
        onOpenChange={(open) => (open ? undefined : setSelectedId(null))}
        members={members}
        canReviewAsEditor={canReviewAsEditor}
        canReviewAsManager={canReviewAsManager}
        connections={connections}
      />
    </>
  );
}

type DetailProps = {
  request: ApprovalQueueItem | null;
  onOpenChange: (open: boolean) => void;
  members: MemberOption[];
  canReviewAsEditor: boolean;
  canReviewAsManager: boolean;
  connections: DistributionConnection[];
};

function ApprovalDetailSheet({ request, onOpenChange, members, canReviewAsEditor, canReviewAsManager, connections }: DetailProps) {
  const [transitionState, transitionAction, transitionPending] = useActionState(transitionApprovalAction, initialActionState);
  const [assignmentState, assignmentAction, assignmentPending] = useActionState(updateApprovalAssignmentsAction, initialActionState);
  const [commentState, commentAction, commentPending] = useActionState(createApprovalCommentAction, initialActionState);
  const open = Boolean(request);

  const editorOptions = members.filter((member) => member.role === "ADMIN" || member.role === "EDITOR");
  const managerOptions = members.filter((member) => member.role === "ADMIN");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-3xl">
        {request && (
          <div className="space-y-5">
            <SheetHeader>
              <SheetTitle className="text-left">
                {request.content.title}
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {request.content.channel && <span>{request.content.channel}</span>}
                  {request.content.personaName && <span>Persona · {request.content.personaName}</span>}
                  {request.content.scheduledAt && <span>Due {format(new Date(request.content.scheduledAt), "MMM d, h:mma")}</span>}
                </div>
              </SheetTitle>
            </SheetHeader>

            <section className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Assignments</p>
                  <p className="text-xs text-muted-foreground">Pick reviewers for each stage.</p>
                </div>
              </div>
              <form action={assignmentAction} className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="approvalRequestId" value={request.id} />
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Editor</Label>
                  <Select name="editorReviewerId" defaultValue={request.editorReviewer?.id ?? undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
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
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Manager</Label>
                  <Select name="managerReviewerId" defaultValue={request.managerReviewer?.id ?? undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
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
                {assignmentState.status === "error" && assignmentState.message && (
                  <p className="text-xs text-destructive md:col-span-2">{assignmentState.message}</p>
                )}
                <div className="md:col-span-2">
                  <Button type="submit" size="sm" disabled={assignmentPending}>
                    {assignmentPending ? "Saving…" : "Save assignees"}
                  </Button>
                </div>
              </form>
            </section>

            <WorkflowActions
              key={request.id}
              request={request}
              transitionAction={transitionAction}
              transitionState={transitionState}
              transitionPending={transitionPending}
              canReviewAsEditor={canReviewAsEditor}
              canReviewAsManager={canReviewAsManager}
            />

            <section className="space-y-3 rounded-xl border p-4">
              <p className="text-sm font-semibold">Timeline</p>
              <div className="space-y-2 text-xs">
                {request.events.length === 0 && <p className="text-muted-foreground">No activity yet.</p>}
                {request.events.map((event) => (
                  <div key={event.id} className="rounded-lg border p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{event.author.name}</span>
                      <span className="text-muted-foreground">{format(new Date(event.createdAt), "MMM d, h:mma")}</span>
                    </div>
                    <p className="text-muted-foreground">{event.type.replace(/_/g, " ")}</p>
                    {event.comment && <p className="mt-1 text-foreground">{event.comment}</p>}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2 rounded-xl border p-4">
              <p className="text-sm font-semibold">Comment</p>
              <form action={commentAction} className="space-y-2">
                <input type="hidden" name="approvalRequestId" value={request.id} />
                <Textarea name="comment" rows={3} placeholder="Document feedback or ask questions" />
                {commentState.status === "error" && commentState.message && <p className="text-xs text-destructive">{commentState.message}</p>}
                <Button type="submit" size="sm" disabled={commentPending}>
                  {commentPending ? "Sending…" : "Add comment"}
                </Button>
              </form>
            </section>

            {request.state === ApprovalState.APPROVED && (
              <DistributionSection
                requestId={request.id}
                content={request.content}
                jobs={request.distributionJobs}
                connections={connections}
              />
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

type WorkflowProps = {
  request: ApprovalQueueItem;
  transitionAction: (formData: FormData) => void;
  transitionState: typeof initialActionState;
  transitionPending: boolean;
  canReviewAsEditor: boolean;
  canReviewAsManager: boolean;
};

function WorkflowActions({ request, transitionAction, transitionState, transitionPending, canReviewAsEditor, canReviewAsManager }: WorkflowProps) {
  const [rejectionReason, setRejectionReason] = useState("Needs more detail");

  const showSubmit = request.state === ApprovalState.DRAFT;
  const showEditorApprove = request.state === ApprovalState.EDITOR_REVIEW && canReviewAsEditor;
  const showManagerApprove = request.state === ApprovalState.MANAGER_REVIEW && canReviewAsManager;
  const showReject = request.state === ApprovalState.EDITOR_REVIEW || request.state === ApprovalState.MANAGER_REVIEW;
  const showReopen = request.state === ApprovalState.REJECTED && canReviewAsEditor;

  return (
    <section className="space-y-3 rounded-xl border p-4">
      <p className="text-sm font-semibold">Workflow actions</p>
      <div className="flex flex-wrap gap-2">
        {showSubmit && (
          <form action={transitionAction}>
            <input type="hidden" name="approvalRequestId" value={request.id} />
            <input type="hidden" name="intent" value="submit" />
            <Button size="sm" disabled={transitionPending}>
              {transitionPending ? "Submitting…" : "Submit for review"}
            </Button>
          </form>
        )}
        {showEditorApprove && (
          <form action={transitionAction}>
            <input type="hidden" name="approvalRequestId" value={request.id} />
            <input type="hidden" name="intent" value="advance" />
            <Button size="sm" variant="secondary" disabled={transitionPending}>
              {transitionPending ? "Moving…" : "Send to manager"}
            </Button>
          </form>
        )}
        {showManagerApprove && (
          <form action={transitionAction}>
            <input type="hidden" name="approvalRequestId" value={request.id} />
            <input type="hidden" name="intent" value="advance" />
            <Button size="sm" disabled={transitionPending}>
              {transitionPending ? "Approving…" : "Approve & mark ready"}
            </Button>
          </form>
        )}
        {showReopen && (
          <form action={transitionAction}>
            <input type="hidden" name="approvalRequestId" value={request.id} />
            <input type="hidden" name="intent" value="reopen" />
            <Button size="sm" variant="outline" disabled={transitionPending}>
              Reopen
            </Button>
          </form>
        )}
      </div>
      {showReject && (
        <form action={transitionAction} className="space-y-2">
          <input type="hidden" name="approvalRequestId" value={request.id} />
          <input type="hidden" name="intent" value="reject" />
          <Textarea
            name="rejectionReason"
            rows={3}
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="Explain what needs to change"
          />
          <Button variant="destructive" size="sm" disabled={transitionPending}>
            {transitionPending ? "Sending…" : "Reject"}
          </Button>
        </form>
      )}
      {transitionState.status === "error" && transitionState.message && (
        <p className="text-xs text-destructive">{transitionState.message}</p>
      )}
    </section>
  );
}

type DistributionSectionProps = {
  requestId: string;
  content: ApprovalQueueItem["content"];
  jobs: DistributionJobSummary[];
  connections: DistributionConnection[];
};

function DistributionSection({ requestId, content, jobs, connections }: DistributionSectionProps) {
  const readyChannels = connections.filter((connection) => connection.profile?.hasToken);

  return (
    <section className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Distribution</p>
          <p className="text-xs text-muted-foreground">Schedule multi-channel publishing now that it’s approved.</p>
        </div>
        {readyChannels.length > 0 && (
          <ScheduleDistributionDialog
            requestId={requestId}
            content={content}
            connections={readyChannels}
          />
        )}
      </div>
      {readyChannels.length === 0 && (
        <p className="text-sm text-muted-foreground">Connect at least one channel to schedule distribution.</p>
      )}
      <div className="space-y-2">
        {jobs.length === 0 && <p className="text-xs text-muted-foreground">No distribution jobs yet.</p>}
        {jobs.map((job) => (
          <div key={job.id} className="rounded-lg border p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium">{job.channel}</span>
              <Badge>{job.status}</Badge>
            </div>
            <p className="text-muted-foreground">
              {job.scheduledFor ? `Scheduled for ${format(new Date(job.scheduledFor), "MMM d, h:mma")}` : "Queued now"}
            </p>
            {job.headline && <p className="mt-1 text-foreground">{job.headline}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

type ScheduleDialogProps = {
  requestId: string;
  content: ApprovalQueueItem["content"];
  connections: DistributionConnection[];
};

function ScheduleDistributionDialog({ requestId, content, connections }: ScheduleDialogProps) {
  const [state, formAction, pending] = useActionState(scheduleDistributionJobAction, initialActionState);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"IMMEDIATE" | "SCHEDULED">("IMMEDIATE");
  const [channel, setChannel] = useState<DistributionChannel>(connections[0]?.channel ?? DistributionChannel.WEBFLOW);

  useEffect(() => {
    if (state.status === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      setMode("IMMEDIATE");
    }
  }, [state.status]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Schedule publish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl space-y-4">
        <DialogHeader>
          <DialogTitle>Schedule distribution</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="approvalRequestId" value={requestId} />
          <input type="hidden" name="contentItemId" value={content.id} />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Channel</Label>
            <Select name="channel" value={channel} onValueChange={(value) => setChannel(value as DistributionChannel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {connections.map((connection) => (
                  <SelectItem key={connection.channel} value={connection.channel}>
                    {connection.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mode</Label>
            <Select name="mode" value={mode} onValueChange={(value) => setMode(value as "IMMEDIATE" | "SCHEDULED")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IMMEDIATE">Publish now</SelectItem>
                <SelectItem value="SCHEDULED">Schedule for later</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === "SCHEDULED" && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Send at</Label>
              <Input type="datetime-local" name="scheduledFor" required={mode === "SCHEDULED"} />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Headline</Label>
            <Input name="headline" defaultValue={content.aiHeadline ?? content.title} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Caption</Label>
            <Textarea name="caption" rows={3} defaultValue={content.description ?? content.aiOutline ?? ""} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Link URL</Label>
              <Input name="linkUrl" placeholder="https://" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Media URL</Label>
              <Input name="mediaUrl" placeholder="https://" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">CTA label</Label>
            <Input name="ctaLabel" placeholder="Read more" />
          </div>
          {state.status === "error" && state.message && <p className="text-xs text-destructive">{state.message}</p>}
          {state.status === "success" && state.message && <p className="text-xs text-emerald-600">{state.message}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Scheduling…" : "Confirm"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
