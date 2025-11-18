"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  ApprovalState,
  ContentStatus,
  NotificationChannel,
  WorkspaceRole,
  type ApprovalRequest,
  type Prisma,
} from "@prisma/client";

import { getWorkspaceContext } from "@/lib/workspace";
import { withUserContext } from "@/lib/rls";
import { ActionState, initialActionState } from "@/lib/action-state";
import { dispatchWorkflowNotification, parseEmailConfig, parseSlackConfig } from "@/lib/notifications";

const transitionIntents = ["submit", "advance", "reject", "reopen"] as const;
type TransitionIntent = (typeof transitionIntents)[number];
type Tx = Prisma.TransactionClient;
type ActorContext = { id: string; role: WorkspaceRole };

const createApprovalSchema = z.object({
  contentItemId: z.string().cuid(),
  editorReviewerId: z.string().cuid().optional(),
  managerReviewerId: z.string().cuid().optional(),
  note: z.string().max(1000).optional(),
  autoSubmit: z.boolean().optional(),
});

const transitionSchema = z.object({
  approvalRequestId: z.string().cuid(),
  intent: z.enum(transitionIntents),
  rejectionReason: z.string().max(500).optional(),
});

const assignmentSchema = z.object({
  approvalRequestId: z.string().cuid(),
  editorReviewerId: z.string().cuid().optional(),
  managerReviewerId: z.string().cuid().optional(),
});

const commentSchema = z.object({
  approvalRequestId: z.string().cuid(),
  comment: z.string().min(3).max(1000),
});

const notificationSchema = z.object({
  emailEditorAlerts: z.boolean().optional(),
  emailManagerAlerts: z.boolean().optional(),
  slackWebhookUrl: z.string().url().or(z.literal("")).optional(),
  slackMentionRole: z.string().max(50).optional(),
});

function asBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function asOptionalString(value: FormDataEntryValue | null) {
  if (value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : undefined;
}

function handleError(error: unknown): ActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: error.flatten().fieldErrors,
    } satisfies ActionState;
  }

  return {
    status: "error",
    message: error instanceof Error ? error.message : "Unable to update approval workflow.",
  } satisfies ActionState;
}

async function addEvent(
  tx: Tx,
  requestId: string,
  authorId: string,
  type: "SUBMITTED" | "MOVED_TO_EDITOR" | "MOVED_TO_MANAGER" | "APPROVED" | "REJECTED" | "COMMENT",
  comment?: string,
) {
  await tx.approvalEvent.create({
    data: {
      approvalRequestId: requestId,
      authorId,
      type,
      comment: comment ?? null,
    },
  });
}

async function performTransition(
  tx: Tx,
  request: ApprovalRequest & {
    contentItem: { id: string; title: string };
    requestedBy: { id: string; email: string; firstName: string | null; lastName: string | null };
    editorReviewer?: { id: string } | null;
    managerReviewer?: { id: string } | null;
  },
  intent: TransitionIntent,
  actor: ActorContext,
  rejectionReason?: string,
) {
  switch (intent) {
    case "submit": {
      if (actor.role === "VIEWER") {
        throw new Error("Viewers cannot submit approvals.");
      }
      if (request.state !== ApprovalState.DRAFT) {
        throw new Error("Only draft requests can be submitted.");
      }

      await tx.approvalRequest.update({
        where: { id: request.id },
        data: {
          state: ApprovalState.EDITOR_REVIEW,
          submittedAt: new Date(),
        },
      });
      await tx.contentItem.update({
        where: { id: request.contentItemId },
        data: { status: ContentStatus.IN_REVIEW },
      });
      await addEvent(tx, request.id, actor.id, "SUBMITTED");

      if (request.editorReviewerId) {
        await Promise.all([
          dispatchWorkflowNotification({
            workspaceId: request.workspaceId,
            approvalRequestId: request.id,
            recipientId: request.editorReviewerId,
            channel: NotificationChannel.EMAIL,
            payload: {
              subject: `New content awaiting Editor review: ${request.contentItem.title}`,
              body: `${request.requestedBy.firstName ?? ""} submitted content for your review.`,
            },
            db: tx,
          }),
          dispatchWorkflowNotification({
            workspaceId: request.workspaceId,
            approvalRequestId: request.id,
            channel: NotificationChannel.SLACK,
            payload: {
              subject: `Editor review needed – ${request.contentItem.title}`,
              body: `${request.requestedBy.firstName ?? ""} requested your review.`,
            },
            db: tx,
          }),
        ]);
      }
      break;
    }
    case "advance": {
      if (request.state === ApprovalState.EDITOR_REVIEW) {
        if (!(actor.role === "ADMIN" || actor.role === "EDITOR")) {
          throw new Error("Only Editors or Admins can move requests to manager review.");
        }
        if (!request.managerReviewerId) {
          throw new Error("Assign a manager reviewer before advancing.");
        }
        await tx.approvalRequest.update({
          where: { id: request.id },
          data: {
            state: ApprovalState.MANAGER_REVIEW,
            editorReviewedAt: new Date(),
          },
        });
        await addEvent(tx, request.id, actor.id, "MOVED_TO_MANAGER");
        await dispatchWorkflowNotification({
          workspaceId: request.workspaceId,
          approvalRequestId: request.id,
          recipientId: request.managerReviewerId,
          channel: NotificationChannel.EMAIL,
          payload: {
            subject: `Manager review needed – ${request.contentItem.title}`,
            body: `Editor approved this request. Please complete manager review.`,
          },
          db: tx,
        });
      } else if (request.state === ApprovalState.MANAGER_REVIEW) {
        if (actor.role !== "ADMIN") {
          throw new Error("Only Admins can finalize approvals.");
        }
        await tx.approvalRequest.update({
          where: { id: request.id },
          data: {
            state: ApprovalState.APPROVED,
            managerReviewedAt: new Date(),
            approvedAt: new Date(),
          },
        });
        await tx.contentItem.update({
          where: { id: request.contentItemId },
          data: { status: ContentStatus.APPROVED },
        });
        await addEvent(tx, request.id, actor.id, "APPROVED");
        await dispatchWorkflowNotification({
          workspaceId: request.workspaceId,
          approvalRequestId: request.id,
          recipientId: request.requestedById,
          channel: NotificationChannel.EMAIL,
          payload: {
            subject: `Approved for publishing – ${request.contentItem.title}`,
            body: "Content cleared all approval gates and is ready for distribution.",
          },
          db: tx,
        });
      } else {
        throw new Error("This request cannot be advanced further.");
      }
      break;
    }
    case "reject": {
      if (!(actor.role === "ADMIN" || actor.role === "EDITOR")) {
        throw new Error("Only Editors or Admins can reject requests.");
      }
      if (request.state !== ApprovalState.EDITOR_REVIEW && request.state !== ApprovalState.MANAGER_REVIEW) {
        throw new Error("Only in-review items can be rejected.");
      }
      if (!rejectionReason) {
        throw new Error("Provide a rejection reason.");
      }
      await tx.approvalRequest.update({
        where: { id: request.id },
        data: {
          state: ApprovalState.REJECTED,
          rejectionReason,
        },
      });
      await tx.contentItem.update({
        where: { id: request.contentItemId },
        data: { status: ContentStatus.READY },
      });
      await addEvent(tx, request.id, actor.id, "REJECTED", rejectionReason);

      await dispatchWorkflowNotification({
        workspaceId: request.workspaceId,
        approvalRequestId: request.id,
        recipientId: request.requestedById,
        channel: NotificationChannel.EMAIL,
        payload: {
          subject: `Changes requested – ${request.contentItem.title}`,
          body: rejectionReason,
        },
        db: tx,
      });
      break;
    }
    case "reopen": {
      if (!(actor.role === "ADMIN" || actor.role === "EDITOR")) {
        throw new Error("Only Editors or Admins can reopen requests.");
      }
      if (request.state !== ApprovalState.REJECTED) {
        throw new Error("Only rejected requests can be reopened.");
      }
      await tx.approvalRequest.update({
        where: { id: request.id },
        data: {
          state: ApprovalState.EDITOR_REVIEW,
          rejectionReason: null,
          submittedAt: new Date(),
        },
      });
      await addEvent(tx, request.id, actor.id, "MOVED_TO_EDITOR", "Reopened after changes.");
      break;
    }
    default:
      throw new Error("Unsupported transition.");
  }
}

async function fetchRequest(tx: Tx, id: string, workspaceId: string) {
  const request = await tx.approvalRequest.findUnique({
    where: { id },
    include: {
      requestedBy: true,
      editorReviewer: true,
      managerReviewer: true,
      contentItem: true,
    },
  });

  if (!request || request.workspaceId !== workspaceId) {
    throw new Error("Approval request not found.");
  }

  return request;
}

function revalidateApprovals() {
  revalidatePath("/app/approvals");
  revalidatePath("/app/planner");
}

export async function createApprovalRequestAction(prevState: ActionState = initialActionState, formData: FormData) {
  void prevState;
  try {
    const context = await getWorkspaceContext();
    if (!context.user || !context.activeMembership) {
      return { status: "error", message: "Select a workspace to continue." } satisfies ActionState;
    }

    const parsed = createApprovalSchema.parse({
      contentItemId: formData.get("contentItemId"),
      editorReviewerId: formData.get("editorReviewerId") ?? undefined,
      managerReviewerId: formData.get("managerReviewerId") ?? undefined,
      note: asOptionalString(formData.get("note")),
      autoSubmit: asBoolean(formData.get("autoSubmit")),
    });

    await withUserContext(context.user.id, async (tx) => {
      const existing = await tx.approvalRequest.findUnique({ where: { contentItemId: parsed.contentItemId } });

      const request = existing
        ? await tx.approvalRequest.update({
            where: { id: existing.id },
            data: {
              editorReviewerId: parsed.editorReviewerId ?? existing.editorReviewerId,
              managerReviewerId: parsed.managerReviewerId ?? existing.managerReviewerId,
            },
          })
        : await tx.approvalRequest.create({
            data: {
              workspaceId: context.activeMembership.workspaceId,
              contentItemId: parsed.contentItemId,
              requestedById: context.user.id,
              editorReviewerId: parsed.editorReviewerId ?? null,
              managerReviewerId: parsed.managerReviewerId ?? null,
            },
          });

      if (parsed.note) {
        await addEvent(tx, request.id, context.user.id, "COMMENT", parsed.note);
      }

      if (parsed.autoSubmit) {
        const hydrated = await fetchRequest(tx, request.id, context.activeMembership.workspaceId);
        await performTransition(tx, hydrated, "submit", { id: context.user.id, role: context.activeMembership.role });
      }
    });

    revalidateApprovals();
    return { status: "success", message: "Approval workflow initialized." } satisfies ActionState;
  } catch (error) {
    return handleError(error);
  }
}

export async function transitionApprovalAction(previousState: ActionState, formData: FormData) {
  void previousState;
  try {
    const context = await getWorkspaceContext();
    if (!context.user || !context.activeMembership) {
      return { status: "error", message: "Select a workspace first." } satisfies ActionState;
    }

    const parsed = transitionSchema.parse({
      approvalRequestId: formData.get("approvalRequestId"),
      intent: formData.get("intent"),
      rejectionReason: asOptionalString(formData.get("rejectionReason")),
    });

    await withUserContext(context.user.id, async (tx) => {
      const request = await fetchRequest(tx, parsed.approvalRequestId, context.activeMembership!.workspaceId);
      await performTransition(tx, request, parsed.intent, { id: context.user!.id, role: context.activeMembership!.role }, parsed.rejectionReason);
    });

    revalidateApprovals();
    return { status: "success", message: "Workflow updated." } satisfies ActionState;
  } catch (error) {
    return handleError(error);
  }
}

export async function updateApprovalAssignmentsAction(previousState: ActionState, formData: FormData) {
  void previousState;
  try {
    const context = await getWorkspaceContext();
    if (!context.user || !context.activeMembership) {
      return { status: "error", message: "Select a workspace first." } satisfies ActionState;
    }

    const parsed = assignmentSchema.parse({
      approvalRequestId: formData.get("approvalRequestId"),
      editorReviewerId: formData.get("editorReviewerId") ?? undefined,
      managerReviewerId: formData.get("managerReviewerId") ?? undefined,
    });

    await withUserContext(context.user.id, (tx) =>
      tx.approvalRequest.update({
        where: { id: parsed.approvalRequestId },
        data: {
          editorReviewerId: parsed.editorReviewerId ?? null,
          managerReviewerId: parsed.managerReviewerId ?? null,
        },
      }),
    );

    revalidateApprovals();
    return { status: "success", message: "Assignments saved." } satisfies ActionState;
  } catch (error) {
    return handleError(error);
  }
}

export async function createApprovalCommentAction(previousState: ActionState, formData: FormData) {
  void previousState;
  try {
    const context = await getWorkspaceContext();
    if (!context.user || !context.activeMembership) {
      return { status: "error", message: "Select a workspace first." } satisfies ActionState;
    }

    const parsed = commentSchema.parse({
      approvalRequestId: formData.get("approvalRequestId"),
      comment: asOptionalString(formData.get("comment")),
    });

    await withUserContext(context.user.id, (tx) => addEvent(tx, parsed.approvalRequestId, context.user!.id, "COMMENT", parsed.comment));

    revalidateApprovals();
    return { status: "success", message: "Comment added." } satisfies ActionState;
  } catch (error) {
    return handleError(error);
  }
}

export async function updateNotificationSettingsAction(previousState: ActionState, formData: FormData) {
  void previousState;
  try {
    const context = await getWorkspaceContext();
    if (!context.user || !context.activeMembership) {
      return { status: "error", message: "Select a workspace first." } satisfies ActionState;
    }

    const parsed = notificationSchema.parse({
      emailEditorAlerts: asBoolean(formData.get("emailEditorAlerts")),
      emailManagerAlerts: asBoolean(formData.get("emailManagerAlerts")),
      slackWebhookUrl: formData.get("slackWebhookUrl") ?? undefined,
      slackMentionRole: asOptionalString(formData.get("slackMentionRole")),
    });

    await withUserContext(context.user.id, async (tx) => {
      const [emailSetting, slackSetting] = await Promise.all([
        tx.notificationSetting.findUnique({
          where: {
            workspaceId_channel: { workspaceId: context.activeMembership!.workspaceId, channel: NotificationChannel.EMAIL },
          },
        }),
        tx.notificationSetting.findUnique({
          where: {
            workspaceId_channel: { workspaceId: context.activeMembership!.workspaceId, channel: NotificationChannel.SLACK },
          },
        }),
      ]);

      const emailConfig = {
        ...parseEmailConfig(emailSetting ?? undefined),
        editorAlerts: parsed.emailEditorAlerts ?? true,
        managerAlerts: parsed.emailManagerAlerts ?? true,
      };
      const slackConfig = {
        ...parseSlackConfig(slackSetting ?? undefined),
        webhookUrl: parsed.slackWebhookUrl ?? "",
        mentionRole: parsed.slackMentionRole ?? "here",
      };

      await Promise.all([
        tx.notificationSetting.upsert({
          where: {
            workspaceId_channel: { workspaceId: context.activeMembership!.workspaceId, channel: NotificationChannel.EMAIL },
          },
          update: { config: emailConfig },
          create: {
            workspaceId: context.activeMembership!.workspaceId,
            channel: NotificationChannel.EMAIL,
            config: emailConfig,
          },
        }),
        tx.notificationSetting.upsert({
          where: {
            workspaceId_channel: { workspaceId: context.activeMembership!.workspaceId, channel: NotificationChannel.SLACK },
          },
          update: { config: slackConfig },
          create: {
            workspaceId: context.activeMembership!.workspaceId,
            channel: NotificationChannel.SLACK,
            config: slackConfig,
          },
        }),
      ]);
    });

    revalidateApprovals();
    return { status: "success", message: "Notification preferences updated." } satisfies ActionState;
  } catch (error) {
    return handleError(error);
  }
}
