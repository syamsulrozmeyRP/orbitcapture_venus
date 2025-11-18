'use client'

import { useActionState } from "react";

import { generateEditorSuggestionsAction } from "@/actions/ai";
import { initialPlanState } from "@/lib/ai-plan";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AiSidebarProps = {
  personaSummary?: string;
};

export function AiSidebar({ personaSummary }: AiSidebarProps) {
  const [state, action, pending] = useActionState(generateEditorSuggestionsAction, initialPlanState);

  const ideas = state.ideas ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI suggestions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form action={action} className="space-y-3">
          <input type="hidden" name="personaSummary" value={personaSummary ?? ""} />
          <div className="space-y-1.5">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea id="excerpt" name="excerpt" rows={4} placeholder="Paste a paragraph to analyze" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="focus">Focus</Label>
            <Select name="focus" defaultValue="seo">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seo">SEO keywords</SelectItem>
                <SelectItem value="tone">Tone & voice</SelectItem>
                <SelectItem value="persona">Persona alignment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {state.message && state.status === "error" && (
            <p className="text-xs text-destructive">{state.message}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Analyzing…" : "Generate tips"}
          </Button>
        </form>
        {state.status === "success" && (
          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            {state.headline && <p className="font-semibold">{state.headline}</p>}
            {state.outline && <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{state.outline}</p>}
            {ideas.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                {ideas.map((idea) => (
                  <li key={idea}>{idea}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
