import { notFound } from "next/navigation";

import { Prisma } from "@prisma/client";

import { getWorkspaceContext } from "@/lib/workspace";
import { withUserContext } from "@/lib/rls";
import { EditorClient } from "@/components/editor/editor-client";
import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state";
import type { EditorDocument } from "@/components/editor/editor-canvas";

type ThreadAnchor = {
  text?: string;
  createdAt?: number;
} | null;

function toEditorDocument(value: Prisma.JsonValue | null): EditorDocument | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const candidate = value as { blocks?: unknown };
    if (Array.isArray(candidate.blocks)) {
      return value as unknown as EditorDocument;
    }
  }
  return null;
}

function toThreadAnchor(value: Prisma.JsonValue | null): ThreadAnchor {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as { text?: unknown; createdAt?: unknown };
    return {
      text: typeof record.text === "string" ? record.text : undefined,
      createdAt: typeof record.createdAt === "number" ? record.createdAt : undefined,
    };
  }
  return null;
}

type Params = {
  contentId: string;
};

export default async function EditorDetailPage({ params }: { params: Params }) {
  const { user, activeMembership } = await getWorkspaceContext();
  if (!user) {
    return null;
  }

  if (!activeMembership) {
    return (
      <div className="space-y-6">
        <WorkspaceEmptyState />
      </div>
    );
  }

  const contentItem = await withUserContext(user.id, (tx) =>
    tx.contentItem.findFirst({
      where: { id: params.contentId, workspaceId: activeMembership.workspaceId },
      include: {
        persona: true,
        versions: {
          include: { createdBy: true },
          orderBy: { createdAt: "desc" },
        },
        commentThreads: {
          include: {
            author: true,
            comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  );

  if (!contentItem) {
    notFound();
  }

  const templates = await withUserContext(user.id, (tx) =>
    tx.contentTemplate.findMany({
      where: { workspaceId: activeMembership.workspaceId },
      orderBy: { createdAt: "desc" },
    }),
  );

  const documentData = toEditorDocument(contentItem.body as Prisma.JsonValue | null);
  const personaSummary = contentItem.persona
    ? `${contentItem.persona.name} (${contentItem.persona.jobTitle ?? ""})`
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Editor</p>
          <h1 className="text-2xl font-semibold">{contentItem.title}</h1>
        </div>
      </div>
      <EditorClient
        contentItemId={contentItem.id}
        personaSummary={personaSummary}
        lastUpdatedAt={contentItem.updatedAt.toISOString()}
        initialDocument={documentData}
        versions={contentItem.versions.map((version) => ({
          id: version.id,
          summary: version.summary,
          createdAt: version.createdAt.toISOString(),
          createdBy: {
            firstName: version.createdBy.firstName,
            lastName: version.createdBy.lastName,
            email: version.createdBy.email,
          },
        }))}
        threads={contentItem.commentThreads.map((thread) => ({
          id: thread.id,
          anchor: toThreadAnchor(thread.anchor as Prisma.JsonValue | null),
          resolved: thread.resolved,
          createdAt: thread.createdAt.toISOString(),
          author: {
            firstName: thread.author.firstName,
            lastName: thread.author.lastName,
            email: thread.author.email,
            imageUrl: thread.author.imageUrl,
          },
          comments: thread.comments.map((comment) => ({
            id: comment.id,
            body: comment.body,
            createdAt: comment.createdAt.toISOString(),
            author: {
              firstName: comment.author.firstName,
              lastName: comment.author.lastName,
              email: comment.author.email,
              imageUrl: comment.author.imageUrl,
            },
          })),
        }))}
        templates={templates.map((template) => ({
          id: template.id,
          name: template.name,
          description: template.description,
          body: toEditorDocument(template.body as Prisma.JsonValue | null) ?? { blocks: [] },
        }))}
      />
    </div>
  );
}
