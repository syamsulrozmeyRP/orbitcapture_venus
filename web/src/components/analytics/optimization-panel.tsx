'use client'

import { useActionState } from "react";

import { generateOptimizationInsightsAction } from "@/actions/analytics";
import { initialOptimizationInsightState } from "@/lib/analytics-insights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  defaultInsights: string[];
};

export function OptimizationPanel({ defaultInsights }: Props) {
  const [state, action, pending] = useActionState(generateOptimizationInsightsAction, initialOptimizationInsightState);
  const insights = state.suggestions?.length ? state.suggestions : defaultInsights;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">AI optimization lab</CardTitle>
        <p className="text-sm text-muted-foreground">Summarize the campaign context and let Claude surface next experiments.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={action} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="focusMetric">Focus metric</Label>
              <Input id="focusMetric" name="focusMetric" defaultValue="CTR" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="baseline">Baseline</Label>
              <Input id="baseline" name="baseline" defaultValue="3.9% (last 30d)" required />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="audience">Priority audience</Label>
              <Input id="audience" name="audience" placeholder="Pipeline-ready PMMs" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="narrative">Performance context</Label>
            <Textarea
              id="narrative"
              name="narrative"
              placeholder="Warm paid social traffic but low activation, organic hero pages carrying conversions, email bench needs another win..."
              rows={4}
              required
            />
          </div>
          {state.message && <p className="text-sm text-muted-foreground">{state.message}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Generating…" : "Generate insights"}
          </Button>
        </form>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recommendations</p>
          {insights.length ? (
            <ul className="list-disc space-y-2 pl-4 text-sm">
              {insights.map((insight) => (
                <li key={insight}>{insight}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Submit context to receive tailored experiments.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
