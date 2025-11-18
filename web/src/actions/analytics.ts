"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { syncAnalyticsProviders } from "@/lib/analytics";
import { getWorkspaceContext } from "@/lib/workspace";
import { withUserContext } from "@/lib/rls";
import { initialOptimizationInsightState, OptimizationInsightState } from "@/lib/analytics-insights";

const insightSchema = z.object({
  focusMetric: z.string().min(2).max(40),
  baseline: z.string().min(1).max(50),
  narrative: z.string().min(20).max(800),
  audience: z.string().max(120).optional(),
});

export async function refreshAnalyticsDataAction() {
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) return;

    await syncAnalyticsProviders(user.id, activeMembership.workspaceId);
    revalidatePath("/app/analytics");
  } catch (error) {
    console.error("refreshAnalyticsDataAction", error);
  }
}

export async function generateOptimizationInsightsAction(
  prevState: OptimizationInsightState = initialOptimizationInsightState,
  formData: FormData,
): Promise<OptimizationInsightState> {
  void prevState;
  try {
    const { user, activeMembership } = await getWorkspaceContext();
    if (!user || !activeMembership) {
      return { status: "error", message: "Select a workspace first." } satisfies OptimizationInsightState;
    }

    const parsed = insightSchema.parse({
      focusMetric: formData.get("focusMetric"),
      baseline: formData.get("baseline"),
      narrative: formData.get("narrative"),
      audience: formData.get("audience") ?? undefined,
    });

    if (!process.env.OPENROUTER_API_KEY) {
      return {
        status: "error",
        message: "OPENROUTER_API_KEY is missing.",
      } satisfies OptimizationInsightState;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://contentos.local",
        "X-Title": "ContentOS Analytics Copilot",
      },
      body: JSON.stringify({
        model: "openrouter/anthropic/claude-3.5-sonnet",
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content:
              "You are an analytics strategist. Return 3-5 bullet recommendations with metric impact callouts and experiment ideas.",
          },
          {
            role: "user",
            content: `Metric: ${parsed.focusMetric}\nBaseline: ${parsed.baseline}\nAudience: ${parsed.audience ?? "Multi-channel"}\nContext: ${parsed.narrative}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate optimization insights.");
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const suggestionText = payload.choices?.[0]?.message?.content ?? "";
    const suggestions = parseSuggestions(suggestionText);

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
      suggestions,
      message: suggestions.length ? undefined : "No insights returned, try again",
    } satisfies OptimizationInsightState;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: error.flatten().fieldErrors,
      } satisfies OptimizationInsightState;
    }

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to generate insights.",
      suggestions: prevState.suggestions,
    } satisfies OptimizationInsightState;
  }
}

function parseSuggestions(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n|\*/)
    .map((entry) => entry.replace(/^[\d\-\.\s]+/, "").trim())
    .filter((entry) => entry.length > 8)
    .slice(0, 5);
}
