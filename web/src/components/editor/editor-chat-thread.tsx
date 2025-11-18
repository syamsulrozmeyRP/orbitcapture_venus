'use client';

import { Loader2, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  personaName?: string;
  brandVoice?: string;
};

export type ChatCompletion = {
  requestId: string;
  personaId: string;
  personaName: string;
  brandVoice: string;
  prompt: string;
  headline?: string | null;
  outline?: string | null;
  ideas?: string[];
  body: string;
};

type EditorChatThreadProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  suggestions: string[];
  onSuggestionClick: (value: string) => void;
  onEditLastPrompt: () => void;
  latestCompletion?: ChatCompletion | null;
  onConvert: (completion: ChatCompletion) => void;
  isConverting: boolean;
  convertError?: string | null;
};

export function EditorChatThread({
  messages,
  isLoading,
  suggestions,
  onSuggestionClick,
  onEditLastPrompt,
  latestCompletion,
  onConvert,
  isConverting,
  convertError,
}: EditorChatThreadProps) {
  const formattedMessages =
    messages.length === 0
      ? [
          {
            id: "intro",
            role: "assistant" as const,
            content: "Need a strategy sprint? Ask Orbi anything to get started.",
            timestamp: new Date().toISOString(),
          },
        ]
      : messages;

  return (
    <Card className="rounded-3xl border bg-card/90 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-lg font-semibold">Chat with Orbi</CardTitle>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onEditLastPrompt} className="gap-2 text-xs">
            <RefreshCcw className="h-3.5 w-3.5" />
            Edit last prompt
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {formattedMessages.map((message) => (
            <div
              key={message.id}
              className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-3xl rounded-3xl border px-5 py-4 text-sm shadow-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-foreground",
                )}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  {message.personaName && <Badge variant="outline">{message.personaName}</Badge>}
                  {message.brandVoice && (
                    <Badge variant="secondary" className="bg-secondary/20">
                      {message.brandVoice}
                    </Badge>
                  )}
                  <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Orbi is thinking…
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>

        {latestCompletion && (
          <div className="rounded-2xl border bg-muted/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Happy with this concept?</p>
                <p className="text-xs text-muted-foreground">Convert the current turn into a draft inside the editor.</p>
              </div>
              <Button
                onClick={() => onConvert(latestCompletion)}
                disabled={isConverting}
                className="rounded-full px-6"
              >
                {isConverting ? "Preparing draft…" : "Convert this to blog"}
              </Button>
            </div>
            {convertError && <p className="mt-2 text-sm text-destructive">{convertError}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

