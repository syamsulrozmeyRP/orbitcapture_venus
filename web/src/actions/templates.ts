"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma } from "@prisma/client";

import { getWorkspaceContext } from "@/lib/workspace";
import { withUserContext } from "@/lib/rls";
import { ActionState } from "@/lib/action-state";

const templateSchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().max(200).optional(),
  body: z.string(),
});

const deleteSchema = z.object({
  templateId: z.string().cuid(),
});

export async function saveTemplateAction(formData: FormData) {
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      return { status: "error", message: "Not authorized" } satisfies ActionState;
    }

    const parsed = templateSchema.parse({
      name: formData.get("name"),
      description: formData.get("description") ?? undefined,
      body: formData.get("body"),
    });

    const body = (typeof parsed.body === "string"
      ? (JSON.parse(parsed.body) as Prisma.InputJsonValue)
      : (parsed.body as Prisma.InputJsonValue));

    await withUserContext(user.id, (tx) =>
      tx.contentTemplate.create({
        data: {
          workspaceId: activeMembership.workspaceId,
          name: parsed.name,
          description: parsed.description,
          body,
        },
      }),
    );

    revalidatePath("/app/editor");
    return { status: "success", message: "Template saved." } satisfies ActionState;
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to save template.",
    } satisfies ActionState;
  }
}

export async function deleteTemplateAction(formData: FormData) {
  const { user, activeMembership } = await getWorkspaceContext();
  if (!user || !activeMembership) {
    throw new Error("Not authorized");
  }

  const parsed = deleteSchema.parse({ templateId: formData.get("templateId") });

  await withUserContext(user.id, (tx) =>
    tx.contentTemplate.delete({
      where: { id: parsed.templateId, workspaceId: activeMembership.workspaceId },
    }),
  );

  revalidatePath("/app/editor");
}
