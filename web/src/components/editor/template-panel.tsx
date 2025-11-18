'use client'

import { useMemo, useState, useTransition } from "react";

import { saveTemplateAction } from "@/actions/templates";
import type { EditorDocument } from "@/components/editor/editor-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Template = {
  id: string;
  name: string;
  description: string | null;
  body: EditorDocument;
};

type TemplatePanelProps = {
  templates: Template[];
  onApply: (body: EditorDocument) => void;
  getDocument: () => Promise<EditorDocument>;
};

export function TemplatePanel({ templates, onApply, getDocument }: TemplatePanelProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, startSaving] = useTransition();

  const bakedTemplates = useMemo(
    () => [
      {
        id: "brief",
        name: "Campaign brief",
        body: {
          blocks: [
            { type: "header", data: { text: "Campaign objective", level: 2 } },
            { type: "paragraph", data: { text: "" } },
            { type: "header", data: { text: "Audience insight", level: 2 } },
            { type: "paragraph", data: { text: "" } },
            { type: "header", data: { text: "Key messages", level: 2 } },
            { type: "list", data: { style: "unordered", items: ["", ""] } },
          ],
        },
      },
      {
        id: "article",
        name: "Thought leadership article",
        body: {
          blocks: [
            { type: "header", data: { text: "Hook", level: 2 } },
            { type: "paragraph", data: { text: "" } },
            { type: "header", data: { text: "Argument", level: 2 } },
            { type: "paragraph", data: { text: "" } },
            { type: "header", data: { text: "Proof", level: 2 } },
            { type: "quote", data: { text: "", caption: "" } },
          ],
        },
      },
    ],
    [],
  );

  const handleSaveTemplate = async () => {
    const data = await getDocument();
    const formData = new FormData();
    formData.set("name", name || "Untitled template");
    formData.set("description", description);
    formData.set("body", JSON.stringify(data));
    startSaving(async () => {
      await saveTemplateAction(formData);
      setName("");
      setDescription("");
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Templates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <p className="text-xs uppercase text-muted-foreground">Quick apply</p>
          <div className="flex flex-wrap gap-2">
            {[...bakedTemplates, ...templates].map((template) => (
              <Button key={template.id} size="sm" variant="secondary" onClick={() => onApply(template.body)}>
                {template.name}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase text-muted-foreground">Save current as template</p>
          <Input placeholder="Template name" value={name} onChange={(event) => setName(event.target.value)} />
          <Input placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          <Button onClick={handleSaveTemplate} disabled={isSaving} className="w-full">
            {isSaving ? "Saving…" : "Save template"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
