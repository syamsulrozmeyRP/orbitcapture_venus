'use client'

import { useRef, useState } from "react";

import { EditorCanvas, type EditorCanvasHandle, type EditorDocument } from "@/components/editor/editor-canvas";
import { CommentPanel, type EditorThread } from "@/components/editor/comment-panel";
import { VersionHistory } from "@/components/editor/version-history";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import { TemplatePanel } from "@/components/editor/template-panel";

type VersionWithAuthor = {
  id: string;
  summary: string | null;
  createdAt: string;
  createdBy: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
};

type TemplateItem = {
  id: string;
  name: string;
  description: string | null;
  body: EditorDocument;
};

type EditorClientProps = {
  contentItemId: string;
  personaSummary?: string;
  lastUpdatedAt: string;
  initialDocument: EditorDocument | null;
  versions: VersionWithAuthor[];
  threads: EditorThread[];
  templates: TemplateItem[];
};

export function EditorClient({
  contentItemId,
  personaSummary,
  lastUpdatedAt,
  initialDocument,
  versions,
  threads,
  templates,
}: EditorClientProps) {
  const editorRef = useRef<EditorCanvasHandle>(null);
  const [selectionAnchor, setSelectionAnchor] = useState<{ text: string; createdAt: number } | null>(null);

  const handleApplyTemplate = (body: EditorDocument) => {
    editorRef.current?.loadDocument(body);
  };

  const getCurrentDocument = async (): Promise<EditorDocument> => {
    if (!editorRef.current) return { blocks: [] } as EditorDocument;
    return editorRef.current.getDocument();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <EditorCanvas
          ref={editorRef}
          contentItemId={contentItemId}
          personaSummary={personaSummary}
          lastUpdatedAt={lastUpdatedAt}
          initialDocument={initialDocument}
          onSelectionChange={setSelectionAnchor}
        />
        <CommentPanel contentItemId={contentItemId} threads={threads} anchor={selectionAnchor} />
      </div>
      <div className="space-y-4">
        <AiSidebar personaSummary={personaSummary} />
        <VersionHistory contentItemId={contentItemId} versions={versions} />
        <TemplatePanel templates={templates} onApply={handleApplyTemplate} getDocument={getCurrentDocument} />
      </div>
    </div>
  );
}
