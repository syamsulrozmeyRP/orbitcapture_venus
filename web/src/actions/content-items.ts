"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "crypto";

import { ContentStatus, Prisma } from "@prisma/client";

import { getWorkspaceContext } from "@/lib/workspace";
import { withUserContext } from "@/lib/rls";
import { ActionState, initialActionState } from "@/lib/action-state";

const createContentSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().max(2000).optional(),
  channel: z.string().max(60).optional(),
  personaId: z.string().cuid().optional(),
  scheduledAt: z.string().optional(),
  aiHeadline: z.string().max(200).optional(),
  aiOutline: z.string().max(4000).optional(),
});

const rescheduleSchema = z.object({
  contentItemId: z.string().cuid(),
  scheduledAt: z.string().datetime().optional(),
});

const statusSchema = z.object({
  contentItemId: z.string().cuid(),
  status: z.nativeEnum(ContentStatus),
});

const convertChatSchema = z.object({
  personaId: z.string().cuid(),
  title: z.string().min(3).max(140),
  prompt: z.string().min(5).max(2000),
  outline: z.string().max(6000).optional(),
  body: z.string().min(20).max(10000),
  ideas: z.array(z.string().max(400)).optional(),
});

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function handleError(error: unknown): ActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: error.flatten().fieldErrors,
    };
  }

  return {
    status: "error",
    message: error instanceof Error ? error.message : "Unable to update content plan.",
  };
}

export async function createContentItemAction(prevState: ActionState = initialActionState, formData: FormData) {
  void prevState;
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      return { status: "error", message: "Select a workspace first." } satisfies ActionState;
    }

    const parsed = createContentSchema.parse({
      title: formData.get("title"),
      description: formData.get("description") ?? undefined,
      channel: formData.get("channel") ?? undefined,
      personaId: formData.get("personaId") ?? undefined,
      scheduledAt: formData.get("scheduledAt") ?? undefined,
      aiHeadline: formData.get("aiHeadline") ?? undefined,
      aiOutline: formData.get("aiOutline") ?? undefined,
    });

    await withUserContext(user.id, (tx) =>
      tx.contentItem.create({
        data: {
          workspaceId: activeMembership.workspaceId,
          createdById: user.id,
          personaId: parsed.personaId || null,
          title: parsed.title,
          description: parsed.description,
          channel: parsed.channel,
          aiHeadline: parsed.aiHeadline,
          aiOutline: parsed.aiOutline,
          scheduledAt: parseDate(parsed.scheduledAt),
        },
      }),
    );

    revalidatePath("/app/planner");
    return { status: "success", message: "Content item created." } satisfies ActionState;
  } catch (error) {
    return handleError(error);
  }
}

export async function rescheduleContentItemAction(payload: { contentItemId: string; scheduledAt?: string | null }) {
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) throw new Error("Select a workspace first.");

    const parsed = rescheduleSchema.parse(payload);

    await withUserContext(user.id, (tx) =>
      tx.contentItem.update({
        where: { id: parsed.contentItemId, workspaceId: activeMembership.workspaceId },
        data: { scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null },
      }),
    );

    revalidatePath("/app/planner");
  } catch (error) {
    console.error("rescheduleContentItemAction", error);
  }
}

export async function updateContentStatusAction(prevState: ActionState, formData: FormData) {
  void prevState;
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      return { status: "error", message: "Select a workspace first." } satisfies ActionState;
    }

    const parsed = statusSchema.parse({
      contentItemId: formData.get("contentItemId"),
      status: formData.get("status"),
    });

    await withUserContext(user.id, (tx) =>
      tx.contentItem.update({
        where: { id: parsed.contentItemId, workspaceId: activeMembership.workspaceId },
        data: { status: parsed.status },
      }),
    );

    revalidatePath("/app/planner");
    return { status: "success", message: "Status updated." } satisfies ActionState;
  } catch (error) {
    return handleError(error);
  }
}

type ConvertResult = ActionState & { contentItemId?: string };

function toEditorDocument(payload: z.infer<typeof convertChatSchema>) {
  const randomId = () => randomUUID();

  const blocks: Array<{ id: string; type: string; data: Record<string, unknown> }> = [];

  if (payload.title) {
    blocks.push({
      id: randomId(),
      type: "header",
      data: { text: payload.title, level: 2 },
    });
  }

  blocks.push({
    id: randomId(),
    type: "paragraph",
    data: { text: payload.prompt },
  });

  if (payload.body) {
    payload.body
      .split(/\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .forEach((chunk) => {
        blocks.push({
          id: randomId(),
          type: "paragraph",
          data: { text: chunk },
        });
      });
  }

  if (payload.outline) {
    const items = payload.outline
      .split(/\n|-/)
      .map((line) => line.replace(/^[-\s]+/, "").trim())
      .filter(Boolean);
    if (items.length > 0) {
      blocks.push({
        id: randomId(),
        type: "list",
        data: { style: "unordered", items },
      });
    }
  }

  if (payload.ideas && payload.ideas.length > 0) {
    blocks.push({
      id: randomId(),
      type: "list",
      data: { style: "unordered", items: payload.ideas },
    });
  }

  return {
    time: Date.now(),
    version: "2.28.0",
    blocks,
  };
}

export async function convertChatToContentAction(payload: z.infer<typeof convertChatSchema>): Promise<ConvertResult> {
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      return { status: "error", message: "Select a workspace first." };
    }

    const parsed = convertChatSchema.parse(payload);
    const document = toEditorDocument(parsed);

    const content = await withUserContext(user.id, (tx) =>
      tx.contentItem.create({
        data: {
          workspaceId: activeMembership.workspaceId,
          createdById: user.id,
          personaId: parsed.personaId,
          title: parsed.title,
          description: parsed.prompt,
          aiHeadline: parsed.title,
          aiOutline: parsed.outline,
          body: document as Prisma.InputJsonValue,
        },
        select: { id: true },
      }),
    );

    revalidatePath("/app/planner");
    revalidatePath("/app/editor");

    return {
      status: "success",
      message: "Draft created from chat.",
      contentItemId: content.id,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to convert conversation.",
    };
  }
}
