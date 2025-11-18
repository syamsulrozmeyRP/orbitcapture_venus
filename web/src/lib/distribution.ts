import type { ContentItem, DistributionJob, DistributionProfile, Prisma } from "@prisma/client";
import { DistributionStatus } from "@prisma/client";

export type DistributionPayload = {
  headline?: string;
  caption?: string;
  linkUrl?: string;
  ctaLabel?: string;
  mediaUrl?: string;
};

export function derivePayloadFromContent(content: Pick<ContentItem, "title" | "description" | "aiHeadline" | "aiOutline">) {
  return {
    headline: content.aiHeadline ?? content.title,
    caption: content.description ?? content.aiOutline ?? undefined,
  } satisfies DistributionPayload;
}

export function sanitizeDistributionPayload(input: DistributionPayload) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null && String(value).trim().length > 0),
  );
}

export function summarizeProfile(profile: DistributionProfile) {
  const config = (profile.config as Record<string, unknown> | null) ?? {};
  return {
    id: profile.id,
    channel: profile.channel,
    label: profile.label ?? (config?.accountName as string | undefined) ?? "Connected",
    hasToken: Boolean(config?.accessToken ?? config?.apiKey),
    updatedAt: profile.updatedAt.toISOString(),
    config: {
      accessToken: typeof config.accessToken === "string" ? config.accessToken : "",
      externalId: typeof config.externalId === "string" ? config.externalId : "",
      spaceId: typeof config.spaceId === "string" ? config.spaceId : "",
    },
  };
}

export function summarizeJob(
  job: DistributionJob & {
    contentItem: Pick<ContentItem, "id" | "title">;
  },
) {
  const payload = (job.payload as DistributionPayload | null) ?? {};
  return {
    id: job.id,
    approvalRequestId: job.approvalRequestId,
    channel: job.channel,
    status: job.status,
    scheduledFor: job.scheduledFor ? job.scheduledFor.toISOString() : null,
    lastAttemptAt: job.lastAttemptAt ? job.lastAttemptAt.toISOString() : null,
    headline: payload.headline,
    caption: payload.caption,
    linkUrl: payload.linkUrl,
    ctaLabel: payload.ctaLabel,
    mediaUrl: payload.mediaUrl,
    createdAt: job.createdAt.toISOString(),
    content: {
      id: job.contentItem.id,
      title: job.contentItem.title,
    },
  };
}

export async function assertCanScheduleDistribution(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  contentItemId: string,
) {
  const approval = await tx.approvalRequest.findUnique({
    where: { contentItemId },
    select: { state: true },
  });

  if (!approval || approval.state !== "APPROVED") {
    throw new Error("Content must be fully approved before scheduling distribution.");
  }

  const existingJob = await tx.distributionJob.findFirst({
    where: {
      workspaceId,
      contentItemId,
      status: { in: [DistributionStatus.QUEUED, DistributionStatus.SCHEDULED, DistributionStatus.SENDING] },
    },
  });

  if (existingJob) {
    throw new Error("A distribution job is already queued for this content.");
  }

  return null;
}

