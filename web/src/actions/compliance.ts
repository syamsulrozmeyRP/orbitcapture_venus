"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ComplianceEventType, PrivacyRequestStatus, PrivacyRequestType, type Prisma } from "@prisma/client";

import { getWorkspaceContext } from "@/lib/workspace";
import { withUserContext } from "@/lib/rls";
import { ActionState, initialActionState } from "@/lib/action-state";

const privacyRequestSchema = z.object({
  requesterEmail: z.string().email(),
  type: z.nativeEnum(PrivacyRequestType),
  reason: z.string().max(500).optional(),
});

const consentPreferenceSchema = z.object({
  personEmail: z.string().email(),
  preference: z.enum(["emailMarketing", "analytics", "ads"] as const),
  value: z.enum(["true", "false"] as const),
});

type ConsentPreferenceFlags = {
  emailMarketing: boolean;
  analytics: boolean;
  ads: boolean;
};

export async function submitPrivacyRequestAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      return { status: "error", message: "Select a workspace first." } satisfies ActionState;
    }

    const parsed = privacyRequestSchema.parse({
      requesterEmail: formData.get("requesterEmail"),
      type: formData.get("type"),
      reason: formData.get("reason") ?? undefined,
    });

    await withUserContext(user.id, async (tx) => {
      const request = await tx.privacyRequest.create({
        data: {
          workspaceId: activeMembership.workspaceId,
          requesterEmail: parsed.requesterEmail,
          type: parsed.type,
          status: PrivacyRequestStatus.RECEIVED,
          reason: parsed.reason,
        },
      });

      await tx.complianceEvent.create({
        data: {
          workspaceId: activeMembership.workspaceId,
          type: parsed.type === PrivacyRequestType.EXPORT ? ComplianceEventType.DATA_EXPORT : ComplianceEventType.DATA_ERASURE,
          description: parsed.reason ?? undefined,
          actorEmail: parsed.requesterEmail,
          privacyRequestId: request.id,
        },
      });
    });

    revalidatePath("/app/analytics");
    return {
      status: "success",
      message: "Request logged.",
    } satisfies ActionState;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: "error",
        message: "Please check the inputs.",
        fieldErrors: error.flatten().fieldErrors,
      } satisfies ActionState;
    }

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to record request.",
    } satisfies ActionState;
  }
}

export async function updateConsentPreferenceAction(formData: FormData) {
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      throw new Error("Select a workspace first.");
    }

    const parsed = consentPreferenceSchema.parse({
      personEmail: formData.get("personEmail"),
      preference: formData.get("preference"),
      value: formData.get("value"),
    });

    await withUserContext(user.id, async (tx) => {
      const existing = await tx.consentPreference.findUnique({
        where: {
          workspaceId_personEmail: {
            workspaceId: activeMembership.workspaceId,
            personEmail: parsed.personEmail,
          },
        },
      });

      const current = existing ? parsePreferences(existing.preferences) : { emailMarketing: false, analytics: false, ads: false };
      const nextValue = parsed.value === "true";
      current[parsed.preference] = nextValue;

      await tx.consentPreference.upsert({
        where: {
          workspaceId_personEmail: {
            workspaceId: activeMembership.workspaceId,
            personEmail: parsed.personEmail,
          },
        },
        create: {
          workspaceId: activeMembership.workspaceId,
          personEmail: parsed.personEmail,
          preferences: current,
          source: "manual",
        },
        update: {
          preferences: current,
          source: "manual",
        },
      });

      await tx.complianceEvent.create({
        data: {
          workspaceId: activeMembership.workspaceId,
          type: ComplianceEventType.CONSENT_CAPTURED,
          description: `${parsed.personEmail} toggled ${parsed.preference} to ${nextValue ? "opt-in" : "opt-out"}.`,
          actorEmail: parsed.personEmail,
        },
      });
    });

    revalidatePath("/app/analytics");
  } catch (error) {
    console.error("updateConsentPreferenceAction", error);
  }
}

function parsePreferences(preferences: Prisma.JsonValue | null): ConsentPreferenceFlags {
  const payload = preferences as Partial<ConsentPreferenceFlags> | null;
  return {
    emailMarketing: payload?.emailMarketing ?? false,
    analytics: payload?.analytics ?? false,
    ads: payload?.ads ?? false,
  } satisfies ConsentPreferenceFlags;
}
