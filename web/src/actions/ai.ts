"use server";

import { z } from "zod";

import { getWorkspaceContext } from "@/lib/workspace";
import { withUserContext } from "@/lib/rls";
import { PlanResponse } from "@/lib/ai-plan";

const planSchema = z.object({
  personaSummary: z.string().optional(),
  channel: z.string().optional(),
  campaignGoal: z.string().max(200).optional(),
  briefing: z.string().min(10).max(2000),
});

const editorSuggestSchema = z.object({
  personaSummary: z.string().optional(),
  excerpt: z.string().min(20),
  focus: z.enum(["seo", "tone", "persona"]).default("seo"),
});

function parseAiText(content?: string | null) {
  if (!content) return { headline: undefined, outline: undefined, ideas: undefined };

  const segments = content.split(/(?:Headline:|Outline:|Ideas:)/i).map((segment) => segment.trim());
  const normalized = content.replace(/\s+/g, " ").trim();

  return {
    headline: segments.length > 1 ? segments[1] : normalized.split("\n")[0],
    outline: segments.length > 2 ? segments[2] : normalized,
    ideas:
      content
        .split(/\n|-/)
        .map((item) => item.trim())
        .filter((line) => line.length > 5)
        .slice(0, 5) || undefined,
  };
}

export async function generatePlanIdeasAction(_: PlanResponse, formData: FormData): Promise<PlanResponse> {
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      return { status: "error", message: "Select a workspace to generate AI ideas." };
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return { status: "error", message: "OPENROUTER_API_KEY is not configured." };
    }

    const parsed = planSchema.parse({
      personaSummary: formData.get("personaSummary") ?? undefined,
      channel: formData.get("channel") ?? undefined,
      campaignGoal: formData.get("campaignGoal") ?? undefined,
      briefing: formData.get("briefing"),
    });

    const messages = [
      {
        role: "system",
        content:
          "You are ContentOS, an AI strategist assisting marketing teams with multi-channel plans. Provide a snappy headline, bullet outline, and 3-5 campaign ideas.",
      },
      {
        role: "user",
        content: `Channel: ${parsed.channel ?? "Multi"}\nPersona: ${parsed.personaSummary ?? "General marketing lead"}\nGoal: ${parsed.campaignGoal ?? "Drive engagement"}\nBriefing: ${parsed.briefing}`,
      },
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://contentos.local",
        "X-Title": "ContentOS Planner",
      },
      body: JSON.stringify({
        model: "openrouter/anthropic/claude-3.5-sonnet",
        messages,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate AI plan.");
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const choiceText = payload.choices?.[0]?.message?.content ?? "";
    const { headline, outline, ideas } = parseAiText(choiceText);

    if (payload.usage) {
      await withUserContext(user.id, (tx) =>
        tx.aiUsage.create({
          data: {
            workspaceId: activeMembership.workspaceId,
            model: "claude-3.5-sonnet",
            promptTokens: payload.usage?.prompt_tokens ?? 0,
            completionTokens: payload.usage?.completion_tokens ?? 0,
          },
        }),
      );
    }

    return {
      status: "success",
      headline,
      outline,
      ideas,
    } satisfies PlanResponse;
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to generate plan.",
    } satisfies PlanResponse;
  }
}

export async function generateEditorSuggestionsAction(_: PlanResponse, formData: FormData): Promise<PlanResponse> {
  try {
    const parsed = editorSuggestSchema.parse({
      personaSummary: formData.get("personaSummary") ?? undefined,
      excerpt: formData.get("excerpt"),
      focus: (formData.get("focus") as "seo" | "tone" | "persona") ?? "seo",
    });

    if (!process.env.OPENROUTER_API_KEY) {
      return { status: "error", message: "OPENROUTER_API_KEY missing." };
    }

    const prompt = `Focus: ${parsed.focus}
Persona: ${parsed.personaSummary ?? "General audience"}
Excerpt:
${parsed.excerpt}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://contentos.local",
        "X-Title": "ContentOS Editor Copilot",
      },
      body: JSON.stringify({
        model: "openrouter/openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "Return punchy SEO + persona optimization tips" },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch AI suggestions.");
    }

    const payload = await response.json();
    const choiceText = payload.choices?.[0]?.message?.content ?? "";
    const { headline, outline, ideas } = parseAiText(choiceText);

    return {
      status: "success",
      headline,
      outline,
      ideas,
    } satisfies PlanResponse;
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to fetch suggestions.",
    } satisfies PlanResponse;
  }
}
