"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma } from "@prisma/client";
import { withUserContext } from "@/lib/rls";
import { getWorkspaceContext } from "@/lib/workspace";
import { ActionState, initialActionState } from "@/lib/action-state";

const editorStateSchema = z.object({
  time: z.number().optional(),
  version: z.string().optional(),
  blocks: z.array(z.any()),
});

const versionSchema = z.object({
  contentItemId: z.string().cuid(),
  summary: z.string().max(200).optional(),
});

const restoreSchema = z.object({
  versionId: z.string().cuid(),
});

const commentThreadSchema = z.object({
  contentItemId: z.string().cuid(),
  anchor: z.any(),
  body: z.string().min(2),
});

const commentReplySchema = z.object({
  threadId: z.string().cuid(),
  body: z.string().min(2),
});

const resolveSchema = z.object({
  threadId: z.string().cuid(),
  resolved: z.boolean(),
});

export async function saveEditorStateAction(contentItemId: string, payload: unknown) {
  const { user, activeMembership } = await getWorkspaceContext();
  if (!user || !activeMembership) {
    throw new Error("Not authorized");
  }

  const parsed = editorStateSchema.parse(payload);
  const jsonBody = parsed as Prisma.InputJsonValue;

  await withUserContext(user.id, (tx) =>
    tx.contentItem.update({
      where: { id: contentItemId, workspaceId: activeMembership.workspaceId },
      data: {
        body: jsonBody,
        lastAutosavedAt: new Date(),
      },
    }),
  );
}

export async function createVersionAction(prevState: ActionState = initialActionState, formData: FormData): Promise<ActionState> {
  void prevState;
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      return { status: "error", message: "Not authorized" } satisfies ActionState;
    }

    const parsed = versionSchema.parse({
      contentItemId: formData.get("contentItemId"),
      summary: formData.get("summary") ?? undefined,
    });

    const content = await withUserContext(user.id, (tx) =>
      tx.contentItem.findFirst({
        where: { id: parsed.contentItemId, workspaceId: activeMembership.workspaceId },
        select: { body: true },
      }),
    );

    if (!content?.body) {
      return { status: "error", message: "Nothing to snapshot." } satisfies ActionState;
    }

    const snapshot = content.body as Prisma.InputJsonValue;

    await withUserContext(user.id, (tx) =>
      tx.contentVersion.create({
        data: {
          contentItemId: parsed.contentItemId,
          createdById: user.id,
          summary: parsed.summary,
          data: snapshot,
        },
      }),
    );

    revalidatePath(`/app/editor/${parsed.contentItemId}`);
    return { status: "success", message: "Version saved." } satisfies ActionState;
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to save version.",
    } satisfies ActionState;
  }
}

export async function restoreVersionAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  void prevState;
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      return { status: "error", message: "Not authorized" } satisfies ActionState;
    }

    const parsed = restoreSchema.parse({ versionId: formData.get("versionId") });

    const version = await withUserContext(user.id, (tx) =>
      tx.contentVersion.findFirst({
        where: { id: parsed.versionId },
        include: { contentItem: true },
      }),
    );

    if (!version || version.contentItem.workspaceId !== activeMembership.workspaceId) {
      return { status: "error", message: "Version not found." } satisfies ActionState;
    }

    await withUserContext(user.id, (tx) =>
      tx.contentItem.update({
        where: { id: version.contentItemId },
        data: {
          body: version.data as Prisma.InputJsonValue,
          lastAutosavedAt: new Date(),
        },
      }),
    );

    revalidatePath(`/app/editor/${version.contentItemId}`);
    return { status: "success", message: "Version restored." } satisfies ActionState;
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to restore version.",
    } satisfies ActionState;
  }
}

export async function createCommentThreadAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  void prevState;
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      return { status: "error", message: "Not authorized" } satisfies ActionState;
    }

    const anchorInput = formData.get("anchor");
    const anchorValue = typeof anchorInput === "string" && anchorInput.length > 0 ? JSON.parse(anchorInput) : {};

    const parsed = commentThreadSchema.parse({
      contentItemId: formData.get("contentItemId"),
      anchor: anchorValue,
      body: formData.get("body"),
    });

    await withUserContext(user.id, (tx) =>
      tx.commentThread.create({
        data: {
          contentItemId: parsed.contentItemId,
          authorId: user.id,
          anchor: parsed.anchor as Prisma.InputJsonValue,
          comments: {
            create: {
              authorId: user.id,
              body: parsed.body,
            },
          },
        },
      }),
    );

    revalidatePath(`/app/editor/${parsed.contentItemId}`);
    return { status: "success", message: "Comment added." } satisfies ActionState;
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to add comment.",
    } satisfies ActionState;
  }
}

export async function replyToThreadAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  void prevState;
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      return { status: "error", message: "Not authorized" } satisfies ActionState;
    }

    const parsed = commentReplySchema.parse({
      threadId: formData.get("threadId"),
      body: formData.get("body"),
    });

    const thread = await withUserContext(user.id, (tx) =>
      tx.commentThread.findFirst({
        where: { id: parsed.threadId },
        select: { contentItemId: true, contentItem: { select: { workspaceId: true } } },
      }),
    );

    if (!thread || thread.contentItem.workspaceId !== activeMembership.workspaceId) {
      return { status: "error", message: "Thread not found." } satisfies ActionState;
    }

    await withUserContext(user.id, (tx) =>
      tx.comment.create({
        data: {
          threadId: parsed.threadId,
          authorId: user.id,
          body: parsed.body,
        },
      }),
    );

    revalidatePath(`/app/editor/${thread.contentItemId}`);
    return { status: "success", message: "Reply posted." } satisfies ActionState;
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to reply." ,
    } satisfies ActionState;
  }
}

export async function resolveThreadAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  void prevState;
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      return { status: "error", message: "Not authorized" } satisfies ActionState;
    }

    const parsed = resolveSchema.parse({
      threadId: formData.get("threadId"),
      resolved: formData.get("resolved") === "true",
    });

    const thread = await withUserContext(user.id, (tx) =>
      tx.commentThread.findFirst({
        where: { id: parsed.threadId },
        select: { contentItemId: true, contentItem: { select: { workspaceId: true } } },
      }),
    );

    if (!thread || thread.contentItem.workspaceId !== activeMembership.workspaceId) {
      return { status: "error", message: "Thread not found." } satisfies ActionState;
    }

    await withUserContext(user.id, (tx) =>
      tx.commentThread.update({
        where: { id: parsed.threadId },
        data: { resolved: parsed.resolved },
      }),
    );

    revalidatePath(`/app/editor/${thread.contentItemId}`);
    return { status: "success", message: parsed.resolved ? "Thread resolved." : "Thread reopened." } satisfies ActionState;
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to update thread.",
    } satisfies ActionState;
  }
}
