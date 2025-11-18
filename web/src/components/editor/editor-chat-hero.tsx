'use client';

import Link from "next/link";
import { Sparkles, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type PersonaOption = {
  id: string;
  name: string;
};

type VoiceOption = {
  id: string;
  label: string;
  description?: string | null;
};

type EditorChatHeroProps = {
  greetingName: string;
  personas: PersonaOption[];
  voiceOptions: VoiceOption[];
  composerValue: string;
  onComposerChange: (value: string) => void;
  selectedPersonaId?: string;
  onPersonaChange: (value: string) => void;
  selectedVoiceId?: string;
  onVoiceChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string | null;
  requiresPersonaSetup: boolean;
};

export function EditorChatHero({
  greetingName,
  personas,
  voiceOptions,
  composerValue,
  onComposerChange,
  selectedPersonaId,
  onPersonaChange,
  selectedVoiceId,
  onVoiceChange,
  onSubmit,
  disabled,
  isLoading,
  error,
  requiresPersonaSetup,
}: EditorChatHeroProps) {
  const canSubmit = !requiresPersonaSetup && !disabled && composerValue.trim().length > 0;

  return (
    <Card className="rounded-3xl border bg-card shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl font-semibold">Welcome {greetingName}, what do you want to work on?</CardTitle>
        <CardDescription>Ask Orbi anything and we&apos;ll stitch together the right voice, audience, and plan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="orbiPrompt" className="text-sm font-medium">
            Ask Orbi anything
          </Label>
          <Textarea
            id="orbiPrompt"
            rows={4}
            placeholder='Ex: "Help me create a blog post about ISO 27001."'
            value={composerValue}
            onChange={(event) => onComposerChange(event.target.value)}
            disabled={disabled || requiresPersonaSetup}
            className="rounded-2xl border-2 bg-background/60 text-base"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-2xl border bg-muted/40 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs uppercase text-muted-foreground">Brand voice</Label>
              <Select
                value={selectedVoiceId ?? ""}
                onValueChange={onVoiceChange}
                disabled={disabled || requiresPersonaSetup || voiceOptions.length === 0}
              >
                <SelectTrigger className="h-9 rounded-xl bg-background text-sm">
                  <SelectValue placeholder="Select brand voice" />
                </SelectTrigger>
                <SelectContent>
                  {voiceOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-2xl border bg-muted/40 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 text-secondary-foreground">
              <UsersRound className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs uppercase text-muted-foreground">Audience</Label>
              <Select value={selectedPersonaId ?? ""} onValueChange={onPersonaChange} disabled={disabled || requiresPersonaSetup}>
                <SelectTrigger className="h-9 rounded-xl bg-background text-sm">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  {personas.map((persona) => (
                    <SelectItem key={persona.id} value={persona.id}>
                      {persona.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {requiresPersonaSetup && (
          <p className="text-sm text-muted-foreground">
            Add a persona with brand voice details to start chatting.
            <Button variant="link" className="pl-2" asChild>
              <Link href="/app/personas">Create persona</Link>
            </Button>
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            className="rounded-2xl px-8"
            disabled={!canSubmit || isLoading}
            onClick={onSubmit}
          >
            {isLoading ? "Thinking…" : "Start writing content"}
          </Button>
          <p className="text-xs text-muted-foreground">We route prompts through OpenRouter with your workspace credits.</p>
        </div>
      </CardContent>
    </Card>
  );
}

