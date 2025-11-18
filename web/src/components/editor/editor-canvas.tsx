'use client'

import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import EditorJS, { type OutputData } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Checklist from "@editorjs/checklist";
import Quote from "@editorjs/quote";
import Table from "@editorjs/table";
import Code from "@editorjs/code";

import { saveEditorStateAction } from "@/actions/editor";

type EditorCanvasProps = {
  contentItemId: string;
  personaSummary?: string;
  lastUpdatedAt: string;
  initialDocument?: EditorDocument | null;
  onSelectionChange?: (anchor: { text: string; createdAt: number } | null) => void;
};

export type EditorDocument = OutputData;

export type EditorCanvasHandle = {
  loadDocument: (data: EditorDocument) => void;
  getDocument: () => Promise<EditorDocument>;
};

const AUTOSAVE_MS = 2000;

export const EditorCanvas = forwardRef<EditorCanvasHandle, EditorCanvasProps>(function EditorCanvas(
  { contentItemId, personaSummary, lastUpdatedAt, initialDocument, onSelectionChange },
  ref,
) {
  const holderId = useId().replace(/:/g, "");
  const initialData = useMemo<EditorDocument>(() => initialDocument ?? { blocks: [] }, [initialDocument]);
  const editorRef = useRef<EditorJS | null>(null);
  const autosaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [draftRestored, setDraftRestored] = useState(false);

  useImperativeHandle(ref, () => ({
    loadDocument: (data) => {
      if (!editorRef.current) return;
      editorRef.current.isReady.then(() => editorRef.current?.render(data));
    },
    getDocument: async () => {
      if (!editorRef.current) return { blocks: [] } satisfies EditorDocument;
      return (editorRef.current.save() as Promise<EditorDocument>);
    },
  }));

  const scheduleAutosave = useCallback(
    (data: EditorDocument) => {
      if (autosaveTimeout.current) {
        clearTimeout(autosaveTimeout.current);
      }
      autosaveTimeout.current = setTimeout(async () => {
        setStatus("saving");
        await saveEditorStateAction(contentItemId, data);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            `contentos:draft:${contentItemId}`,
            JSON.stringify({ updatedAt: Date.now(), data }),
          );
        }
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1500);
      }, AUTOSAVE_MS);
    },
    [contentItemId],
  );

  useEffect(() => {
    if (editorRef.current) return;

    const instance = new EditorJS({
      holder: holderId,
      autofocus: true,
      data: initialData,
      placeholder: `Write for ${personaSummary ?? "your audience"}…`,
      tools: {
        header: Header,
        list: List,
        checklist: Checklist,
        quote: Quote,
        table: Table,
        code: Code,
      },
      onChange: async () => {
        if (!editorRef.current) return;
        const data = await editorRef.current.save();
        scheduleAutosave(data);
      },
    });

    instance.isReady.then(async () => {
      if (typeof window === "undefined") return;
      const draftKey = `contentos:draft:${contentItemId}`;
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.updatedAt && parsed.updatedAt > new Date(lastUpdatedAt).getTime()) {
        await instance.render(parsed.data);
        setDraftRestored(true);
      }
    });

    editorRef.current = instance;
    return () => {
      instance.isReady.then(() => instance.destroy());
      editorRef.current = null;
    };
  }, [contentItemId, holderId, initialData, lastUpdatedAt, personaSummary, scheduleAutosave]);

  useEffect(() => {
    if (!onSelectionChange) return;
    const handler = () => {
      if (typeof window === "undefined") return;
      const selection = window.getSelection();
      const text = selection?.toString()?.trim();
      if (!text) {
        onSelectionChange(null);
        return;
      }
      onSelectionChange({ text, createdAt: Date.now() });
    };
    if (typeof window !== "undefined") {
      window.addEventListener("mouseup", handler);
      window.addEventListener("keyup", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("mouseup", handler);
        window.removeEventListener("keyup", handler);
      }
    };
  }, [onSelectionChange]);

  const mood =
    status === "saving" ? "Saving…" : status === "saved" ? "Saved" : draftRestored ? "Recovered local draft" : "Synced";

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 text-sm">
        <div className="text-muted-foreground">{mood}</div>
      </div>
      <div id={holderId} className="prose prose-slate max-w-none px-4 py-6 dark:prose-invert" />
    </div>
  );
});
