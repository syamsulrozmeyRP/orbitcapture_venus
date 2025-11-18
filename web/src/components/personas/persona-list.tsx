'use client'

import { useActionState, useState } from "react";

import { upsertPersonaAction, deletePersonaAction } from "@/actions/personas";
import { initialActionState } from "@/lib/action-state";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Persona = {
  id: string;
  name: string;
  jobTitle?: string | null;
  industry?: string | null;
  pains?: string | null;
  goals?: string | null;
  voice?: string | null;
  audienceTags: string[];
};

type Props = {
  personas: Persona[];
};

export function PersonaList({ personas }: Props) {
  const [state, action, pending] = useActionState(upsertPersonaAction, initialActionState);
  const [editing, setEditing] = useState<Persona | null>(null);

  const handleEdit = (persona: Persona) => {
    setEditing(persona);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Persona library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {personas.length === 0 && <p className="text-sm text-muted-foreground">No personas yet.</p>}
          {personas.map((persona) => (
            <div key={persona.id} className="rounded-xl border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{persona.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {persona.jobTitle ?? ""} {persona.industry ? `• ${persona.industry}` : ""}
                  </p>
                  {persona.goals && <p className="text-xs text-muted-foreground">Goals: {persona.goals}</p>}
                </div>
                <form action={deletePersonaAction}>
                  <input type="hidden" name="personaId" value={persona.id} />
                  <Button size="sm" type="submit" variant="ghost">
                    Remove
                  </Button>
                </form>
              </div>
              {persona.audienceTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {persona.audienceTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <Button variant="link" size="sm" className="px-0 text-xs" onClick={() => handleEdit(persona)}>
                Edit persona
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editing ? `Update ${editing.name}` : "New persona"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-3">
            <input type="hidden" name="personaId" value={editing?.id ?? ""} />
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={editing?.name} required />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="jobTitle">Role</Label>
                <Input id="jobTitle" name="jobTitle" defaultValue={editing?.jobTitle ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" name="industry" defaultValue={editing?.industry ?? ""} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goals">Goals</Label>
              <Textarea id="goals" name="goals" rows={2} defaultValue={editing?.goals ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pains">Pain points</Label>
              <Textarea id="pains" name="pains" rows={2} defaultValue={editing?.pains ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="voice">Voice & tone</Label>
              <Textarea id="voice" name="voice" rows={2} defaultValue={editing?.voice ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">Audience tags (comma separated)</Label>
              <Input id="tags" name="tags" defaultValue={editing?.audienceTags.join(", ") ?? ""} />
            </div>
            {state.message && state.status === "error" && (
              <p className="text-xs text-destructive">{state.message}</p>
            )}
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save persona"}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditing(null);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
