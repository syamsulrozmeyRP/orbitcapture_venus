'use client';

import { startTransition, useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { generatePlanIdeasAction } from "@/actions/ai";
import { convertChatToContentAction } from "@/actions/content-items";
import { initialPlanState, type PlanResponse } from "@/lib/ai-plan";

import { EditorChatHero } from "@/components/editor/editor-chat-hero";
import { EditorChatThread, type ChatCompletion, type ChatMessage } from "@/components/editor/editor-chat-thread";
import { EditorPlanTable, type ContentPlanRow } from "@/components/editor/editor-plan-table";

type PersonaOption = {
  id: string;
  name: string;
  jobTitle?: string | null;
  industry?: string | null;
  goals?: string | null;
  pains?: string | null;
  voice?: string | null;
};

type SubmissionMeta = {
  personaId: string;
  personaName: string;
  brandVoice: string;
  prompt: string;
};

type EditorHomeClientProps = {
  greetingName: string;
  personas: PersonaOption[];
  contentPlans: ContentPlanRow[];
};

const SUGGESTIONS = [
  "Generate an outline for our next security webinar recap.",
  "Turn our latest case study into a LinkedIn thread.",
  "Brainstorm five TikTok hooks about product launches.",
];

export function EditorHomeClient({ greetingName, personas, contentPlans }: EditorHomeClientProps) {
  const router = useRouter();
  const [composerValue, setComposerValue] = useState("");
  const [selectedPersonaId, setSelectedPersonaId] = useState(personas[0]?.id);
  const [selectedVoiceId, setSelectedVoiceId] = useState(personas[0]?.id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [latestCompletion, setLatestCompletion] = useState<ChatCompletion | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState("");
  const [isConverting, startConverting] = useTransition();
  const [convertError, setConvertError] = useState<string | null>(null);

  const pendingRequests = useRef<Record<string, SubmissionMeta>>({});

  const [aiState, sendPrompt, isGenerating] = useActionState(generatePlanIdeasAction, initialPlanState);

  const personaMap = useMemo(() => new Map(personas.map((persona) => [persona.id, persona])), [personas]);

  const voiceOptions = personas.map((persona) => ({
    id: persona.id,
    label: persona.voice ? `${persona.name} • ${persona.voice.slice(0, 28)}${persona.voice.length > 28 ? "…" : ""}` : `${persona.name} default voice`,
    description: persona.voice ?? `${persona.name}'s default tone`,
  }));

  useEffect(() => {
    if (aiState.status === "success" && aiState.requestId) {
      const submission = pendingRequests.current[aiState.requestId];
      if (!submission) return;
      delete pendingRequests.current[aiState.requestId];

      const assistantMessage = formatPlanResponse(aiState);
      setMessages((prev) => [
        ...prev,
        {
          id: `${aiState.requestId}-assistant`,
          role: "assistant",
          content: assistantMessage,
          timestamp: new Date().toISOString(),
          personaName: submission.personaName,
          brandVoice: submission.brandVoice,
        },
      ]);

      setLatestCompletion({
        requestId: aiState.requestId,
        personaId: submission.personaId,
        personaName: submission.personaName,
        brandVoice: submission.brandVoice,
        prompt: submission.prompt,
        headline: aiState.headline ?? submission.prompt,
        outline: aiState.outline,
        ideas: aiState.ideas,
        body: assistantMessage,
      });

      setPendingRequestId((current) => (current === aiState.requestId ? null : current));
      setChatError(null);
    }

    if (aiState.status === "error") {
      if (aiState.requestId) {
        delete pendingRequests.current[aiState.requestId];
        setPendingRequestId((current) => (current === aiState.requestId ? null : current));
      }
      setChatError(aiState.message ?? "Unable to generate plan right now.");
    }
  }, [aiState]);

  const requiresPersonaSetup = personas.length === 0;
  const selectedPersona = selectedPersonaId ? personaMap.get(selectedPersonaId) : undefined;
  const selectedVoicePersona = selectedVoiceId ? personaMap.get(selectedVoiceId) : undefined;
  const voiceSummary = selectedVoicePersona?.voice ?? selectedPersona?.voice ?? "Default workspace voice.";
  const personaSummary = selectedPersona ? buildPersonaSummary(selectedPersona) : "";
  const showChat = messages.length > 0 || Boolean(pendingRequestId);

  const handleSend = () => {
    if (requiresPersonaSetup) {
      setChatError("Create a persona with voice guidance to continue.");
      return;
    }

    if (!selectedPersona || !selectedPersonaId) {
      setChatError("Select a target persona first.");
      return;
    }

    const prompt = composerValue.trim();
    if (prompt.length === 0) {
      setChatError("Ask a question to get started.");
      return;
    }

    const requestId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: `${requestId}-user`,
        role: "user",
        content: prompt,
        timestamp: new Date().toISOString(),
        personaName: selectedPersona.name,
        brandVoice: selectedVoicePersona?.name ?? selectedPersona.name,
      },
    ]);

    pendingRequests.current[requestId] = {
      personaId: selectedPersona.id,
      personaName: selectedPersona.name,
      brandVoice: voiceSummary,
      prompt,
    };

    const formData = new FormData();
    formData.set("requestId", requestId);
    formData.set("personaSummary", personaSummary);
    formData.set("campaignGoal", prompt);
    formData.set(
      "briefing",
      `User request: ${prompt}\n\nAudience: ${personaSummary}\n\nVoice guidelines: ${voiceSummary}`,
    );

    setChatError(null);
    setLatestCompletion(null);
    setPendingRequestId(requestId);
    setLastPrompt(prompt);
    setComposerValue("");
    startTransition(() => {
      sendPrompt(formData);
    });
  };

  const handleSuggestionClick = (value: string) => {
    setComposerValue(value);
    setChatError(null);
  };

  const handleEditLastPrompt = () => {
    if (lastPrompt) {
      setComposerValue(lastPrompt);
      setChatError(null);
    }
  };

  const handleConvert = (completion: ChatCompletion) => {
    setConvertError(null);
    startConverting(async () => {
      const result = await convertChatToContentAction({
        personaId: completion.personaId,
        title: completion.headline ?? completion.prompt,
        prompt: completion.prompt,
        outline: completion.outline ?? undefined,
        body: completion.body,
        ideas: completion.ideas ?? undefined,
      });

      if (result.status === "error" || !result.contentItemId) {
        setConvertError(result.message ?? "Unable to convert conversation right now.");
        return;
      }

      router.push(`/app/editor/${result.contentItemId}`);
    });
  };

  return (
    <div className="space-y-6">
      <EditorChatHero
        greetingName={greetingName}
        personas={personas}
        voiceOptions={voiceOptions}
        composerValue={composerValue}
        onComposerChange={setComposerValue}
        selectedPersonaId={selectedPersonaId}
        onPersonaChange={setSelectedPersonaId}
        selectedVoiceId={selectedVoiceId}
        onVoiceChange={setSelectedVoiceId}
        onSubmit={handleSend}
        disabled={requiresPersonaSetup}
        isLoading={isGenerating}
        error={chatError}
        requiresPersonaSetup={requiresPersonaSetup}
      />

      {showChat ? (
        <EditorChatThread
          messages={messages}
          isLoading={isGenerating && Boolean(pendingRequestId)}
          suggestions={SUGGESTIONS}
          onSuggestionClick={handleSuggestionClick}
          onEditLastPrompt={handleEditLastPrompt}
          latestCompletion={latestCompletion}
          onConvert={handleConvert}
          isConverting={isConverting}
          convertError={convertError}
        />
      ) : (
        <EditorPlanTable rows={contentPlans} personas={personas} />
      )}
    </div>
  );
}

function buildPersonaSummary(persona: PersonaOption) {
  const parts = [
    persona.name,
    persona.jobTitle ? persona.jobTitle : null,
    persona.industry ? persona.industry : null,
  ].filter(Boolean);

  const extra = [
    persona.goals ? `Goals: ${persona.goals}` : null,
    persona.pains ? `Pains: ${persona.pains}` : null,
  ].filter(Boolean);

  return [...parts, ...extra].join(" • ");
}

function formatPlanResponse(response: PlanResponse) {
  const chunks: string[] = [];
  if (response.headline) {
    chunks.push(`Headline:\n${response.headline}`);
  }
  if (response.outline) {
    chunks.push(`Outline:\n${response.outline}`);
  }
  if (response.ideas && response.ideas.length > 0) {
    chunks.push(`Ideas:\n${response.ideas.map((idea) => `• ${idea}`).join("\n")}`);
  }
  return chunks.length > 0 ? chunks.join("\n\n") : "Here is a fresh angle to explore.";
}

