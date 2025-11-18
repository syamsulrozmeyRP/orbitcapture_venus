"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { TaskStatus } from "@prisma/client";

import { getWorkspaceContext } from "@/lib/workspace";
import { withUserContext } from "@/lib/rls";
import { ActionState, initialActionState } from "@/lib/action-state";

const createTaskSchema = z.object({
  contentItemId: z.string().cuid(),
  title: z.string().min(3).max(140),
  description: z.string().max(1000).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().cuid().optional(),
});

const updateStatusSchema = z.object({
  taskId: z.string().cuid(),
  status: z.nativeEnum(TaskStatus),
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

  return { status: "error", message: error instanceof Error ? error.message : "Unable to update task." };
}

export async function createTaskAction(prevState: ActionState = initialActionState, formData: FormData) {
  void prevState;
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      return { status: "error", message: "Select a workspace first." } satisfies ActionState;
    }

    const parsed = createTaskSchema.parse({
      contentItemId: formData.get("contentItemId"),
      title: formData.get("taskTitle"),
      description: formData.get("taskDescription") ?? undefined,
      dueDate: formData.get("taskDueDate") ?? undefined,
      assigneeId: formData.get("assigneeId") ?? undefined,
    });

    await withUserContext(user.id, (tx) =>
      tx.contentTask.create({
        data: {
          workspaceId: activeMembership.workspaceId,
          contentItemId: parsed.contentItemId,
          title: parsed.title,
          description: parsed.description,
          dueDate: parseDate(parsed.dueDate),
          assigneeId: parsed.assigneeId || null,
        },
      }),
    );

    revalidatePath("/app/planner");
    return { status: "success", message: "Task created." } satisfies ActionState;
  } catch (error) {
    return handleError(error);
  }
}

export async function updateTaskStatusAction(previous: ActionState, formData: FormData) {
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      return { status: "error", message: "Select a workspace first." } satisfies ActionState;
    }

    const parsed = updateStatusSchema.parse({
      taskId: formData.get("taskId"),
      status: formData.get("status"),
    });

    await withUserContext(user.id, (tx) =>
      tx.contentTask.update({
        where: { id: parsed.taskId, workspaceId: activeMembership.workspaceId },
        data: { status: parsed.status },
      }),
    );

    revalidatePath("/app/planner");
    return { status: "success", message: "Task updated." } satisfies ActionState;
  } catch (error) {
    return handleError(error);
  }
}
