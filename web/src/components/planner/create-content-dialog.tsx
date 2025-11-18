'use client'

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";

import { createContentItemAction } from "@/actions/content-items";
import { generatePlanIdeasAction } from "@/actions/ai";
import { initialActionState } from "@/lib/action-state";
import { initialPlanState, PlanResponse } from "@/lib/ai-plan";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PersonaOption = {
  id: string;
  name: string;
  jobTitle?: string | null;
  industry?: string | null;
  pains?: string | null;
  goals?: string | null;
};

type Props = {
  personas: PersonaOption[];
};

export function CreateContentDialog({ personas }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isSubmitting] = useActionState(createContentItemAction, initialActionState);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | undefined>();
  const [headline, setHeadline] = useState("");
  const [outline, setOutline] = useState("");
  const [aiState, setAiState] = useState<PlanResponse>(initialPlanState);
  const [isGenerating, startGenerating] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      requestAnimationFrame(() => {
        setOpen(false);
        setHeadline("");
        setOutline("");
        setAiState(initialPlanState);
      });
    }
  }, [state.status]);

  const personaSummary = useMemo(() => {
    const persona = personas.find((p) => p.id === selectedPersonaId);
    if (!persona) return "";
    return `${persona.name} • ${persona.jobTitle ?? ""} • Goals: ${persona.goals ?? "n/a"} • Pains: ${persona.pains ?? "n/a"}`;
  }, [personas, selectedPersonaId]);

  const runAi = (form: HTMLFormElement) => {
    const formData = new FormData();
    const rawDescription = form.elements.namedItem("description") as HTMLTextAreaElement | null;
    const channelInput = form.elements.namedItem("channel") as HTMLInputElement | null;
    const goalInput = form.elements.namedItem("title") as HTMLInputElement | null;

    formData.set("briefing", rawDescription?.value ?? "");
    formData.set("channel", channelInput?.value ?? "");
    formData.set("campaignGoal", goalInput?.value ?? "");
    formData.set("personaSummary", personaSummary);

    startGenerating(async () => {
      const result = await generatePlanIdeasAction(initialPlanState, formData);
      setAiState(result);
      if (result.headline) setHeadline(result.headline);
      if (result.outline) setOutline(result.outline);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add content</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Plan new content</DialogTitle>
          <DialogDescription>Link the brief to a persona and instantly generate headlines or outlines.</DialogDescription>
        </DialogHeader>
        <form
          action={(formData) => {
            formData.set("aiHeadline", headline);
            formData.set("aiOutline", outline);
            formAction(formData);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Launch playbook" required />
            {state.fieldErrors?.title && <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="channel">Primary channel</Label>
              <Input id="channel" name="channel" placeholder="LinkedIn" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Scheduled for</Label>
              <Input id="scheduledAt" name="scheduledAt" type="datetime-local" min={format(new Date(), "yyyy-MM-dd'T'HH:mm")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Persona</Label>
            <Select
              name="personaId"
              value={selectedPersonaId}
              onValueChange={(value) => setSelectedPersonaId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target persona" />
              </SelectTrigger>
              <SelectContent>
                {personas.map((persona) => (
                  <SelectItem key={persona.id} value={persona.id}>
                    {persona.name} {persona.industry ? `· ${persona.industry}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Briefing</Label>
            <Textarea id="description" name="description" rows={4} placeholder="Key talking points, CTA, references" />
          </div>

          <input type="hidden" name="personaSummary" value={personaSummary} />

          <div className="rounded-xl border bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">AI headline & outline</p>
                <p className="text-xs text-muted-foreground">Uses OpenRouter credits for this workspace.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isGenerating}
                onClick={(event) => runAi(event.currentTarget.form!)}
              >
                {isGenerating ? "Generating…" : "Generate"}
              </Button>
            </div>
            {aiState.message && aiState.status === "error" && (
              <p className="mt-2 text-xs text-destructive">{aiState.message}</p>
            )}
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="aiHeadline">Headline</Label>
                <Textarea
                  id="aiHeadline"
                  name="aiHeadline"
                  rows={2}
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aiOutline">Outline</Label>
                <Textarea
                  id="aiOutline"
                  name="aiOutline"
                  rows={4}
                  value={outline}
                  onChange={(event) => setOutline(event.target.value)}
                />
              </div>
            </div>
          </div>

          {state.message && state.status !== "success" && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
