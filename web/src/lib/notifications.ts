import type { Prisma, PrismaClient } from "@prisma/client";
import { NotificationChannel, NotificationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const EMAIL_DEFAULTS = {
  editorAlerts: true,
  managerAlerts: true,
  digestHour: 8,
};

const SLACK_DEFAULTS = {
  webhookUrl: "",
  mentionRole: "here",
};

export type EmailNotificationConfig = typeof EMAIL_DEFAULTS;
export type SlackNotificationConfig = typeof SLACK_DEFAULTS;

export type NotificationPayload = {
  subject: string;
  body: string;
  actionUrl?: string;
};

type DbExecutor = Prisma.TransactionClient | PrismaClient;

export async function ensureNotificationDefaults(workspaceId: string, db: DbExecutor = prisma) {
  await Promise.all([
    db.notificationSetting.upsert({
      where: { workspaceId_channel: { workspaceId, channel: NotificationChannel.EMAIL } },
      update: {},
      create: {
        workspaceId,
        channel: NotificationChannel.EMAIL,
        config: EMAIL_DEFAULTS,
      },
    }),
    db.notificationSetting.upsert({
      where: { workspaceId_channel: { workspaceId, channel: NotificationChannel.SLACK } },
      update: {},
      create: {
        workspaceId,
        channel: NotificationChannel.SLACK,
        config: SLACK_DEFAULTS,
      },
    }),
  ]);
}

export function parseEmailConfig(setting?: { config: Prisma.JsonValue | null }) {
  const raw = (setting?.config as Partial<EmailNotificationConfig> | undefined) ?? {};
  return { ...EMAIL_DEFAULTS, ...raw } satisfies EmailNotificationConfig;
}

export function parseSlackConfig(setting?: { config: Prisma.JsonValue | null }) {
  const raw = (setting?.config as Partial<SlackNotificationConfig> | undefined) ?? {};
  return { ...SLACK_DEFAULTS, ...raw } satisfies SlackNotificationConfig;
}

async function sendEmail(recipientEmail: string, payload: NotificationPayload) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info(`[notifications] Email queued (simulated) -> ${recipientEmail}: ${payload.subject}`);
    return { success: true, metadata: { simulated: true } } as const;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.NOTIFICATION_FROM_EMAIL ?? "ContentOS <notify@contentos.app>",
      to: recipientEmail,
      subject: payload.subject,
      html: `
        <p>${payload.body}</p>
        ${payload.actionUrl ? `<p><a href="${payload.actionUrl}">Open request</a></p>` : ""}
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email delivery failed: ${response.statusText}`);
  }

  return { success: true, metadata: await response.json() } as const;
}

async function sendSlack(webhookUrl: string, payload: NotificationPayload, mentionRole?: string) {
  if (!webhookUrl) {
    throw new Error("Slack webhook URL missing");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `*${payload.subject}*\n${payload.body}${payload.actionUrl ? `\n<${payload.actionUrl}|Open request>` : ""}${mentionRole ? `\n@${mentionRole}` : ""}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack delivery failed: ${response.statusText}`);
  }

  return { success: true } as const;
}

export async function dispatchWorkflowNotification(
  {
    workspaceId,
    approvalRequestId,
    recipientId,
    channel,
    payload,
    db = prisma,
  }: {
    workspaceId: string;
    approvalRequestId?: string;
    recipientId?: string;
    channel: NotificationChannel;
    payload: NotificationPayload;
    db?: DbExecutor;
  },
) {
  const record = await db.workflowNotification.create({
    data: {
      workspaceId,
      approvalRequestId: approvalRequestId ?? null,
      recipientId: recipientId ?? null,
      channel,
      payload,
    },
  });

  try {
    if (channel === NotificationChannel.EMAIL) {
      if (!recipientId) throw new Error("Email notifications require recipientId");
      const recipient = await db.user.findUnique({ where: { id: recipientId } });
      if (!recipient) throw new Error("Recipient not found");
      await sendEmail(recipient.email, payload);
    } else if (channel === NotificationChannel.SLACK) {
      const slackSetting = await db.notificationSetting.findUnique({
        where: { workspaceId_channel: { workspaceId, channel: NotificationChannel.SLACK } },
      });
      const config = parseSlackConfig(slackSetting ?? undefined);
      await sendSlack(config.webhookUrl, payload, config.mentionRole);
    }

    await db.workflowNotification.update({
      where: { id: record.id },
      data: { status: NotificationStatus.SENT, sentAt: new Date(), error: null },
    });
  } catch (error) {
    await db.workflowNotification.update({
      where: { id: record.id },
      data: { status: NotificationStatus.FAILED, error: error instanceof Error ? error.message : "Failed to send" },
    });
    console.error("dispatchWorkflowNotification", error);
  }
}
