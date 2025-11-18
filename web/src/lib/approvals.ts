import {
  ApprovalState,
  NotificationChannel,
  type WorkspaceRole,
  type ContentStatus,
  type ApprovalEvent,
  type ApprovalRequest,
  type DistributionProfile,
  type DistributionJob,
  type ContentItem,
} from "@prisma/client";

import { getWorkspaceContext } from "@/lib/workspace";
import { withUserContext } from "@/lib/rls";
import {
  ensureNotificationDefaults,
  parseEmailConfig,
  parseSlackConfig,
  type EmailNotificationConfig,
  type SlackNotificationConfig,
} from "@/lib/notifications";
import { CHANNEL_ORDER, CHANNEL_DEFINITIONS } from "@/lib/channel-definitions";
import { derivePayloadFromContent, summarizeJob, summarizeProfile } from "@/lib/distribution";

export type MemberOption = {
  id: string;
  label: string;
  email: string;
  role: WorkspaceRole;
};

export type ContentOption = {
  id: string;
  title: string;
  channel?: string | null;
  status: ContentStatus;
  personaName?: string | null;
  description?: string | null;
  scheduledAt?: string | null;
  aiHeadline?: string | null;
  aiOutline?: string | null;
};

export type ApprovalEventSummary = {
  id: string;
  type: ApprovalEvent["type"];
  comment?: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
};

export type DistributionProfileSummary = ReturnType<typeof summarizeProfile>;
export type DistributionJobSummary = ReturnType<typeof summarizeJob>;

export type ApprovalQueueItem = {
  id: string;
  state: ApprovalState;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  editorReviewedAt?: string | null;
  managerReviewedAt?: string | null;
  approvedAt?: string | null;
  requestedBy: {
    id: string;
    name: string;
    email: string;
  };
  editorReviewer?: MemberOption | null;
  managerReviewer?: MemberOption | null;
  content: ContentOption;
  events: ApprovalEventSummary[];
  distributionJobs: DistributionJobSummary[];
};

export type NotificationSettingsPayload = {
  email: EmailNotificationConfig;
  slack: SlackNotificationConfig;
};

export type DistributionConnection = {
  channel: DistributionProfile["channel"];
  label: string;
  description: string;
  accentClass: string;
  recommendedEmoji: string;
  profile?: DistributionProfileSummary | null;
};

export type ApprovalSummaryMetrics = {
  totalOpen: number;
  pendingEditor: number;
  pendingManager: number;
  approvedAwaitingPublish: number;
  rejected: number;
};

export type ApprovalDashboard = {
  hasWorkspace: boolean;
  userRole: WorkspaceRole | null;
  canReviewAsEditor: boolean;
  canReviewAsManager: boolean;
  members: MemberOption[];
  contentItems: ContentOption[];
  queue: ApprovalQueueItem[];
  summary: ApprovalSummaryMetrics;
  notificationSettings: NotificationSettingsPayload;
  distributionConnections: DistributionConnection[];
  upcomingJobs: DistributionJobSummary[];
};

function formatMember(member: { user: { id: string; firstName: string | null; lastName: string | null; email: string }; role: WorkspaceRole }) {
  const name = member.user.firstName ? `${member.user.firstName} ${member.user.lastName ?? ""}`.trim() : member.user.email;
  return {
    id: member.user.id,
    label: name,
    email: member.user.email,
    role: member.role,
  } satisfies MemberOption;
}

function formatContent(content: {
  id: string;
  title: string;
  channel: string | null;
  status: ContentStatus;
  persona?: { name: string | null } | null;
  description: string | null;
  scheduledAt: Date | null;
  aiHeadline: string | null;
  aiOutline: string | null;
}) {
  return {
    id: content.id,
    title: content.title,
    channel: content.channel,
    status: content.status,
    personaName: content.persona?.name ?? null,
    description: content.description,
    scheduledAt: content.scheduledAt ? content.scheduledAt.toISOString() : null,
    aiHeadline: content.aiHeadline,
    aiOutline: content.aiOutline,
  } satisfies ContentOption;
}

function mapApprovalRequest(
  request: ApprovalRequest & {
    requestedBy: { id: string; email: string; firstName: string | null; lastName: string | null };
    editorReviewer?: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
    managerReviewer?: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
    contentItem: Parameters<typeof formatContent>[0];
    events: (ApprovalEvent & { author: { id: string; email: string; firstName: string | null; lastName: string | null } })[];
    distributionJobs: (DistributionJob & {
      contentItem: { id: string; title: string };
    })[];
  },
  memberLookup: Record<string, MemberOption | undefined>,
) {
  const events: ApprovalEventSummary[] = request.events
    .map((event) => ({
      id: event.id,
      type: event.type,
      comment: event.comment,
      createdAt: event.createdAt.toISOString(),
      author: {
        id: event.author.id,
        email: event.author.email,
        name: event.author.firstName ? `${event.author.firstName} ${event.author.lastName ?? ""}`.trim() : event.author.email,
      },
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return {
    id: request.id,
    state: request.state,
    rejectionReason: request.rejectionReason,
    submittedAt: request.submittedAt ? request.submittedAt.toISOString() : null,
    editorReviewedAt: request.editorReviewedAt ? request.editorReviewedAt.toISOString() : null,
    managerReviewedAt: request.managerReviewedAt ? request.managerReviewedAt.toISOString() : null,
    approvedAt: request.approvedAt ? request.approvedAt.toISOString() : null,
    requestedBy: {
      id: request.requestedBy.id,
      email: request.requestedBy.email,
      name: request.requestedBy.firstName
        ? `${request.requestedBy.firstName} ${request.requestedBy.lastName ?? ""}`.trim()
        : request.requestedBy.email,
    },
    editorReviewer: request.editorReviewerId ? memberLookup[request.editorReviewerId ?? ""] ?? null : null,
    managerReviewer: request.managerReviewerId ? memberLookup[request.managerReviewerId ?? ""] ?? null : null,
    content: formatContent(request.contentItem),
    events,
    distributionJobs: request.distributionJobs.map((job) => summarizeJob(job)),
  } satisfies ApprovalQueueItem;
}

function calculateSummary(queue: ApprovalQueueItem[]): ApprovalSummaryMetrics {
  const summary: ApprovalSummaryMetrics = {
    totalOpen: 0,
    pendingEditor: 0,
    pendingManager: 0,
    approvedAwaitingPublish: 0,
    rejected: 0,
  };

  queue.forEach((request) => {
    if (request.state !== ApprovalState.APPROVED) {
      summary.totalOpen += 1;
    }
    switch (request.state) {
      case ApprovalState.EDITOR_REVIEW:
        summary.pendingEditor += 1;
        break;
      case ApprovalState.MANAGER_REVIEW:
        summary.pendingManager += 1;
        break;
      case ApprovalState.APPROVED: {
        const hasSentJob = request.distributionJobs.some((job) => job.status === "SENT");
        if (!hasSentJob) summary.approvedAwaitingPublish += 1;
        break;
      }
      case ApprovalState.REJECTED:
        summary.rejected += 1;
        break;
      default:
        break;
    }
  });

  return summary;
}

export async function getApprovalDashboard(): Promise<ApprovalDashboard> {
  const context = await getWorkspaceContext();
  const userRole = context.activeMembership?.role ?? null;

  if (!context.user || !context.activeMembership) {
    return {
      hasWorkspace: false,
      userRole,
      canReviewAsEditor: false,
      canReviewAsManager: false,
      members: [],
      contentItems: [],
      queue: [],
      summary: {
        totalOpen: 0,
        pendingEditor: 0,
        pendingManager: 0,
        approvedAwaitingPublish: 0,
        rejected: 0,
      },
      notificationSettings: { email: parseEmailConfig(), slack: parseSlackConfig() },
      distributionConnections: CHANNEL_ORDER.map((channel) => ({
        channel,
        label: CHANNEL_DEFINITIONS[channel].label,
        description: CHANNEL_DEFINITIONS[channel].description,
        accentClass: CHANNEL_DEFINITIONS[channel].accentClass,
        recommendedEmoji: CHANNEL_DEFINITIONS[channel].recommendedEmoji,
        profile: null,
      })),
      upcomingJobs: [],
    } satisfies ApprovalDashboard;
  }

  const workspaceId = context.activeMembership.workspaceId;

  const data = await withUserContext(context.user.id, async (tx) => {
    await ensureNotificationDefaults(workspaceId, tx);

    const [members, contentItems, requests, notificationSettings, profiles, upcomingJobs] = await Promise.all([
      tx.workspaceMember.findMany({
        where: { workspaceId },
        include: { user: true },
        orderBy: { user: { firstName: "asc" } },
      }),
      tx.contentItem.findMany({
        where: { workspaceId },
        include: { persona: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      tx.approvalRequest.findMany({
        where: { workspaceId },
        include: {
          requestedBy: true,
          editorReviewer: true,
          managerReviewer: true,
          contentItem: { include: { persona: { select: { name: true } } } },
          events: { include: { author: true } },
          distributionJobs: { include: { contentItem: { select: { id: true, title: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      tx.notificationSetting.findMany({ where: { workspaceId } }),
      tx.distributionProfile.findMany({ where: { workspaceId } }),
      tx.distributionJob.findMany({
        where: {
          workspaceId,
          status: { in: ["QUEUED", "SCHEDULED"] },
        },
        include: { contentItem: { select: { id: true, title: true } } },
        orderBy: { scheduledFor: "asc" },
      }),
    ]);

    return { members, contentItems, requests, notificationSettings, profiles, upcomingJobs };
  });

  const memberOptions = data.members.map(formatMember);
  const memberLookup = Object.fromEntries(memberOptions.map((member) => [member.id, member]));
  const contentOptions = data.contentItems.map(formatContent);

  const queue = data.requests.map((request) => mapApprovalRequest(request, memberLookup));

  const emailSetting = data.notificationSettings.find((s) => s.channel === NotificationChannel.EMAIL);
  const slackSetting = data.notificationSettings.find((s) => s.channel === NotificationChannel.SLACK);

  const connections = CHANNEL_ORDER.map((channel) => ({
    channel,
    label: CHANNEL_DEFINITIONS[channel].label,
    description: CHANNEL_DEFINITIONS[channel].description,
    accentClass: CHANNEL_DEFINITIONS[channel].accentClass,
    recommendedEmoji: CHANNEL_DEFINITIONS[channel].recommendedEmoji,
    profile: summarizeProfileOrNull(data.profiles.find((profile) => profile.channel === channel) ?? null),
  }));

  const upcomingJobs = data.upcomingJobs.map((job) => summarizeJob(job));

  return {
    hasWorkspace: true,
    userRole,
    canReviewAsEditor: userRole === "ADMIN" || userRole === "EDITOR",
    canReviewAsManager: userRole === "ADMIN",
    members: memberOptions,
    contentItems: contentOptions,
    queue,
    summary: calculateSummary(queue),
    notificationSettings: {
      email: parseEmailConfig(emailSetting ?? undefined),
      slack: parseSlackConfig(slackSetting ?? undefined),
    },
    distributionConnections: connections,
    upcomingJobs,
  } satisfies ApprovalDashboard;
}

function summarizeProfileOrNull(profile: DistributionProfile | null) {
  if (!profile) return null;
  return summarizeProfile(profile);
}

export function getDefaultDistributionPayload(content: ContentOption) {
  return derivePayloadFromContent({
    title: content.title,
    description: content.description ?? null,
    aiHeadline: content.aiHeadline ?? null,
    aiOutline: content.aiOutline ?? null,
  } satisfies Pick<ContentItem, "title" | "description" | "aiHeadline" | "aiOutline">);
}
