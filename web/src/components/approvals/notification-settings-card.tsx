'use client'

import { useActionState } from "react";

import type { NotificationSettingsPayload } from "@/lib/approvals";
import { updateNotificationSettingsAction } from "@/actions/approvals";
import { initialActionState } from "@/lib/action-state";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  settings: NotificationSettingsPayload;
};

export function NotificationSettingsCard({ settings }: Props) {
  const [state, formAction, pending] = useActionState(updateNotificationSettingsAction, initialActionState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notifications</CardTitle>
        <CardDescription>Email and Slack alerts for approval workflow.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2 rounded-lg border p-3">
            <Label className="text-sm font-semibold">Email alerts</Label>
            <label className="flex items-center gap-2 text-sm">
              <input name="emailEditorAlerts" type="checkbox" defaultChecked={settings.email.editorAlerts} className="h-4 w-4 rounded border border-input accent-primary" />
              Notify editor reviewers when drafts are submitted
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="emailManagerAlerts" type="checkbox" defaultChecked={settings.email.managerAlerts} className="h-4 w-4 rounded border border-input accent-primary" />
              Notify manager reviewers when editor sign-off is complete
            </label>
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <Label className="text-sm font-semibold">Slack webhooks</Label>
            <div className="space-y-1">
              <Label htmlFor="slackWebhookUrl" className="text-xs text-muted-foreground">
                Incoming webhook URL
              </Label>
              <Input
                id="slackWebhookUrl"
                name="slackWebhookUrl"
                placeholder="https://hooks.slack.com/..."
                defaultValue={settings.slack.webhookUrl}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slackMentionRole" className="text-xs text-muted-foreground">
                Mention (e.g. here, channel, marketing)
              </Label>
              <Input
                id="slackMentionRole"
                name="slackMentionRole"
                placeholder="here"
                defaultValue={settings.slack.mentionRole}
              />
            </div>
          </div>

          {state.status === "error" && state.message && <p className="text-xs text-destructive">{state.message}</p>}
          {state.status === "success" && state.message && <p className="text-xs text-emerald-600">{state.message}</p>}

          <Button type="submit" size="sm" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Save preferences"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
