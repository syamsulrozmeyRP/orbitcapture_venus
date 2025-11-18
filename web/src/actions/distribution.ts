"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DistributionChannel, DistributionStatus } from "@prisma/client";

import { getWorkspaceContext } from "@/lib/workspace";
import { withUserContext } from "@/lib/rls";
import { ActionState, initialActionState } from "@/lib/action-state";
import { sanitizeDistributionPayload, assertCanScheduleDistribution } from "@/lib/distribution";

const profileSchema = z.object({
  channel: z.nativeEnum(DistributionChannel),
  label: z.string().min(2).max(60),
  accessToken: z.string().max(256).optional(),
  externalId: z.string().max(120).optional(),
  spaceId: z.string().max(120).optional(),
});

const jobSchema = z.object({
  jobId: z.string().cuid().optional(),
  approvalRequestId: z.string().cuid().optional(),
  contentItemId: z.string().cuid(),
  channel: z.nativeEnum(DistributionChannel),
  mode: z.enum(["IMMEDIATE", "SCHEDULED"] as const),
  scheduledFor: z.string().datetime().optional(),
  headline: z.string().max(200).optional(),
  caption: z.string().max(2000).optional(),
  linkUrl: z.string().url().optional(),
  mediaUrl: z.string().url().optional(),
  ctaLabel: z.string().max(60).optional(),
});

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
    message: error instanceof Error ? error.message : "Unable to update distribution settings.",
  } satisfies ActionState;
}

function parseDate(value?: string | null) {
  if (!value) return undefined;
  const next = new Date(value);
  if (Number.isNaN(next.getTime())) return undefined;
  return next;
}

function revalidateApprovals() {
  revalidatePath("/app/approvals");
  revalidatePath("/app/planner");
}

export async function upsertDistributionProfileAction(previousState: ActionState, formData: FormData) {
  void previousState;
  try {
    const context = await getWorkspaceContext();
    if (!context.user || !context.activeMembership) {
      return { status: "error", message: "Select a workspace first." } satisfies ActionState;
    }
    if (context.activeMembership.role !== "ADMIN") {
      return { status: "error", message: "Only admins can manage channel connections." } satisfies ActionState;
    }

    const parsed = profileSchema.parse({
      channel: formData.get("channel"),
      label: formData.get("label"),
      accessToken: formData.get("accessToken") ?? undefined,
      externalId: formData.get("externalId") ?? undefined,
      spaceId: formData.get("spaceId") ?? undefined,
    });

    await withUserContext(context.user.id, (tx) =>
      tx.distributionProfile.upsert({
        where: { workspaceId_channel: { workspaceId: context.activeMembership!.workspaceId, channel: parsed.channel } },
        update: { label: parsed.label, config: { accessToken: parsed.accessToken, externalId: parsed.externalId, spaceId: parsed.spaceId } },
        create: {
          workspaceId: context.activeMembership!.workspaceId,
          channel: parsed.channel,
          label: parsed.label,
          config: { accessToken: parsed.accessToken, externalId: parsed.externalId, spaceId: parsed.spaceId },
        },
      }),
    );

    revalidateApprovals();
    return { status: "success", message: "Channel saved." } satisfies ActionState;
  } catch (error) {
    return handleError(error);
  }
}

export async function scheduleDistributionJobAction(previousState: ActionState = initialActionState, formData: FormData) {
  void previousState;
  try {
    const context = await getWorkspaceContext();
    if (!context.user || !context.activeMembership) {
      return { status: "error", message: "Select a workspace first." } satisfies ActionState;
    }

    const parsed = jobSchema.parse({
      jobId: formData.get("jobId") ?? undefined,
      approvalRequestId: formData.get("approvalRequestId") ?? undefined,
      contentItemId: formData.get("contentItemId"),
      channel: formData.get("channel"),
      mode: formData.get("mode"),
      scheduledFor: formData.get("scheduledFor") ?? undefined,
      headline: formData.get("headline") ?? undefined,
      caption: formData.get("caption") ?? undefined,
      linkUrl: formData.get("linkUrl") ?? undefined,
      mediaUrl: formData.get("mediaUrl") ?? undefined,
      ctaLabel: formData.get("ctaLabel") ?? undefined,
    });

    const scheduledFor = parsed.mode === "SCHEDULED" ? parseDate(parsed.scheduledFor) : new Date();
    if (parsed.mode === "SCHEDULED" && !scheduledFor) {
      throw new Error("Provide a valid schedule date.");
    }

    await withUserContext(context.user.id, async (tx) => {
      const workspaceId = context.activeMembership!.workspaceId;
      const content = await tx.contentItem.findUnique({
        where: { id: parsed.contentItemId, workspaceId },
        select: { id: true, title: true },
      });

      if (!content) {
        throw new Error("Content not found in this workspace.");
      }

      const profile = await tx.distributionProfile.findUnique({
        where: { workspaceId_channel: { workspaceId, channel: parsed.channel } },
      });

      if (!profile) {
        throw new Error("Connect this channel before scheduling.");
      }

      await assertCanScheduleDistribution(tx, workspaceId, parsed.contentItemId);

      const payload = sanitizeDistributionPayload({
        headline: parsed.headline,
        caption: parsed.caption,
        linkUrl: parsed.linkUrl,
        mediaUrl: parsed.mediaUrl,
        ctaLabel: parsed.ctaLabel,
      });

      const status = parsed.mode === "IMMEDIATE" ? DistributionStatus.QUEUED : DistributionStatus.SCHEDULED;

      const job = parsed.jobId
        ? await tx.distributionJob.update({
            where: { id: parsed.jobId, workspaceId },
            data: {
              channel: parsed.channel,
              profileId: profile.id,
              payload,
              scheduledFor: scheduledFor ?? new Date(),
              status,
              approvalRequestId: parsed.approvalRequestId ?? null,
            },
          })
        : await tx.distributionJob.create({
            data: {
              workspaceId,
              contentItemId: parsed.contentItemId,
              approvalRequestId: parsed.approvalRequestId ?? null,
              profileId: profile.id,
              channel: parsed.channel,
              payload,
              scheduledFor: scheduledFor ?? new Date(),
              status,
            },
          });

      if (parsed.mode === "IMMEDIATE") {
        await tx.distributionJob.update({
          where: { id: job.id },
          data: {
            status: DistributionStatus.SENT,
            lastAttemptAt: new Date(),
            result: { message: "Simulated publish", deliveredAt: new Date().toISOString() },
          },
        });
      }
    });

    revalidateApprovals();
    return { status: "success", message: parsed.mode === "IMMEDIATE" ? "Published immediately." : "Scheduled." } satisfies ActionState;
  } catch (error) {
    return handleError(error);
  }
}
