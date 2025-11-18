"use server";

import { MembershipStatus, WorkspaceRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { ActionState } from "@/lib/action-state";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { WORKSPACE_COOKIE } from "@/lib/constants";
import { slugify } from "@/lib/slugify";
import { withUserContext } from "@/lib/rls";

const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(280).optional(),
  brandColor: z
    .string()
    .regex(/^(#?)([0-9a-fA-F]{6})$/, { message: "Use a valid hex color." })
    .transform((value) => (value.startsWith("#") ? value : `#${value}`))
    .optional(),
});

const inviteSchema = z.object({
  workspaceId: z.string().cuid(),
  email: z.string().email(),
  role: z.nativeEnum(WorkspaceRole),
});

const roleMutationSchema = z.object({
  workspaceId: z.string().cuid(),
  memberId: z.string().cuid(),
  role: z.nativeEnum(WorkspaceRole),
});

const removeMemberSchema = z.object({
  workspaceId: z.string().cuid(),
  memberId: z.string().cuid(),
});

function buildErrorState(error: unknown): ActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: error.flatten().fieldErrors,
    };
  }

  const message =
    error instanceof Error ? error.message : "Something went wrong. Please try again.";

  return { status: "error", message };
}

export async function createWorkspaceAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getOrCreateCurrentUser();

    if (!user) {
      return { status: "error", message: "You must be signed in." };
    }

    const parsed = createWorkspaceSchema.parse({
      name: formData.get("name"),
      description: formData.get("description") ?? undefined,
      brandColor: formData.get("brandColor") ?? "#4F46E5",
    });

    const workspace = await withUserContext(user.id, async (tx) => {
      const baseSlug = slugify(parsed.name);
      let slug = baseSlug;
      let attempt = 1;

      // ensure slug uniqueness per tenant
      while (await tx.workspace.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${attempt++}`;
      }

      return tx.workspace.create({
        data: {
          name: parsed.name,
          description: parsed.description,
          slug,
          theme: {
            brandColor: parsed.brandColor ?? "#4F46E5",
          },
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: WorkspaceRole.ADMIN,
              status: MembershipStatus.ACTIVE,
            },
          },
        },
      });
    });

    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE, workspace.id, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });

    revalidatePath("/app");
    revalidatePath("/app/workspaces");

    return {
      status: "success",
      message: `${workspace.name} workspace created successfully.`,
    };
  } catch (error) {
    return buildErrorState(error);
  }
}

export async function switchWorkspaceAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getOrCreateCurrentUser();
    if (!user) {
      return { status: "error", message: "You must be signed in." };
    }

    const workspaceId = formData.get("workspaceId");
    if (typeof workspaceId !== "string") {
      return { status: "error", message: "Select a valid workspace." };
    }

    const membership = await withUserContext(user.id, (tx) =>
      tx.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: user.id,
          status: MembershipStatus.ACTIVE,
        },
      }),
    );

    if (!membership) {
      return { status: "error", message: "You do not have access to that workspace." };
    }

    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });

    revalidatePath("/app");
    revalidatePath("/app/workspaces");

    return {
      status: "success",
      message: "Workspace switched.",
    };
  } catch (error) {
    return buildErrorState(error);
  }
}

export async function inviteMemberAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getOrCreateCurrentUser();
    if (!user) return { status: "error", message: "You must be signed in." };

    const parsed = inviteSchema.parse({
      workspaceId: formData.get("workspaceId"),
      email: formData.get("email"),
      role: formData.get("role"),
    });

    const membership = await withUserContext(user.id, (tx) =>
      tx.workspaceMember.findFirst({
        where: { workspaceId: parsed.workspaceId, userId: user.id },
      }),
    );

    if (!membership || membership.role !== WorkspaceRole.ADMIN) {
      return { status: "error", message: "Only admins can invite members." };
    }

    await withUserContext(user.id, (tx) =>
      tx.workspaceInvite.create({
        data: {
          workspaceId: parsed.workspaceId,
          email: parsed.email.toLowerCase(),
          role: parsed.role,
          token: randomUUID(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 72),
          invitedById: user.id,
        },
      }),
    );

    revalidatePath("/app/workspaces");

    return { status: "success", message: "Invitation recorded." };
  } catch (error) {
    return buildErrorState(error);
  }
}

export async function updateMemberRoleAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getOrCreateCurrentUser();
    if (!user) return { status: "error", message: "You must be signed in." };

    const parsed = roleMutationSchema.parse({
      workspaceId: formData.get("workspaceId"),
      memberId: formData.get("memberId"),
      role: formData.get("role"),
    });

    const requester = await withUserContext(user.id, (tx) =>
      tx.workspaceMember.findFirst({
        where: { workspaceId: parsed.workspaceId, userId: user.id },
      }),
    );

    if (!requester || requester.role !== WorkspaceRole.ADMIN) {
      return { status: "error", message: "Only admins can update roles." };
    }

    if (parsed.memberId === requester.id) {
      return { status: "error", message: "You cannot change your own role here." };
    }

    await withUserContext(user.id, (tx) =>
      tx.workspaceMember.update({
        where: { id: parsed.memberId },
        data: { role: parsed.role },
      }),
    );

    revalidatePath("/app/workspaces");

    return { status: "success", message: "Member role updated." };
  } catch (error) {
    return buildErrorState(error);
  }
}

export async function removeMemberAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getOrCreateCurrentUser();
    if (!user) return { status: "error", message: "You must be signed in." };

    const parsed = removeMemberSchema.parse({
      workspaceId: formData.get("workspaceId"),
      memberId: formData.get("memberId"),
    });

    const requester = await withUserContext(user.id, (tx) =>
      tx.workspaceMember.findFirst({
        where: { workspaceId: parsed.workspaceId, userId: user.id },
      }),
    );

    if (!requester || requester.role !== WorkspaceRole.ADMIN) {
      return { status: "error", message: "Only admins can remove members." };
    }

    if (parsed.memberId === requester.id) {
      return { status: "error", message: "Transfer ownership before removing yourself." };
    }

    await withUserContext(user.id, (tx) => tx.workspaceMember.delete({ where: { id: parsed.memberId } }));

    revalidatePath("/app/workspaces");

    return { status: "success", message: "Member removed." };
  } catch (error) {
    return buildErrorState(error);
  }
}
