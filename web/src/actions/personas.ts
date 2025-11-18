"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getWorkspaceContext } from "@/lib/workspace";
import { withUserContext } from "@/lib/rls";
import { ActionState, initialActionState } from "@/lib/action-state";

const personaSchema = z.object({
  personaId: z.string().cuid().optional(),
  name: z.string().min(2).max(80),
  jobTitle: z.string().max(120).optional(),
  industry: z.string().max(120).optional(),
  pains: z.string().max(2000).optional(),
  goals: z.string().max(2000).optional(),
  voice: z.string().max(500).optional(),
  tags: z.string().optional(),
});

const deleteSchema = z.object({
  personaId: z.string().cuid(),
});

function extractTags(tags?: string | null) {
  if (!tags) return [] as string[];
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
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
    message: error instanceof Error ? error.message : "Unable to update persona.",
  };
}

export async function upsertPersonaAction(prevState: ActionState = initialActionState, formData: FormData) {
  void prevState;
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      return { status: "error", message: "Select a workspace first." } satisfies ActionState;
    }

    const parsed = personaSchema.parse({
      personaId: formData.get("personaId") ?? undefined,
      name: formData.get("name"),
      jobTitle: formData.get("jobTitle") ?? undefined,
      industry: formData.get("industry") ?? undefined,
      pains: formData.get("pains") ?? undefined,
      goals: formData.get("goals") ?? undefined,
      voice: formData.get("voice") ?? undefined,
      tags: formData.get("tags") ?? undefined,
    });

    const audienceTags = extractTags(parsed.tags);

    await withUserContext(user.id, (tx) =>
      parsed.personaId
        ? tx.persona.update({
            where: { id: parsed.personaId, workspaceId: activeMembership.workspaceId },
            data: {
              name: parsed.name,
              jobTitle: parsed.jobTitle,
              industry: parsed.industry,
              pains: parsed.pains,
              goals: parsed.goals,
              voice: parsed.voice,
              audienceTags,
            },
          })
        : tx.persona.create({
            data: {
              workspaceId: activeMembership.workspaceId,
              createdById: user.id,
              name: parsed.name,
              jobTitle: parsed.jobTitle,
              industry: parsed.industry,
              pains: parsed.pains,
              goals: parsed.goals,
              voice: parsed.voice,
              audienceTags,
            },
          }),
    );

    revalidatePath("/app/personas");
    revalidatePath("/app/planner");

    return {
      status: "success",
      message: parsed.personaId ? "Persona updated." : "Persona created.",
    } satisfies ActionState;
  } catch (error) {
    return handleError(error);
  }
}

export async function deletePersonaAction(formData: FormData) {
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      throw new Error("Select a workspace first.");
    }

    const parsed = deleteSchema.parse({ personaId: formData.get("personaId") });

    await withUserContext(user.id, (tx) =>
      tx.persona.delete({
        where: { id: parsed.personaId, workspaceId: activeMembership.workspaceId },
      }),
    );

    revalidatePath("/app/personas");
    revalidatePath("/app/planner");
  } catch (error) {
    console.error("deletePersonaAction", error);
  }
}
