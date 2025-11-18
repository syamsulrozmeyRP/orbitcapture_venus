'use client'

import { useActionState, useMemo, useState } from "react";
import { format } from "date-fns";

import { DistributionChannel, DistributionStatus } from "@prisma/client";

import type { DistributionConnection, DistributionJobSummary } from "@/lib/approvals";
import { upsertDistributionProfileAction } from "@/actions/distribution";
import { initialActionState } from "@/lib/action-state";
import { CHANNEL_DEFINITIONS } from "@/lib/channel-definitions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  connections: DistributionConnection[];
  upcomingJobs: DistributionJobSummary[];
};

const statusColors: Record<DistributionStatus, string> = {
  DRAFT: "bg-muted text-foreground",
  READY: "bg-muted text-foreground",
  QUEUED: "bg-amber-100 text-amber-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  SENDING: "bg-slate-100 text-slate-700",
  SENT: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-rose-100 text-rose-700",
};

export function DistributionCenter({ connections, upcomingJobs }: Props) {
  const [channel, setChannel] = useState<DistributionChannel>(connections[0]?.channel ?? DistributionChannel.WEBFLOW);
  const [state, formAction, pending] = useActionState(upsertDistributionProfileAction, initialActionState);

  const activeConnection = useMemo(() => connections.find((item) => item.channel === channel), [connections, channel]);
  const profileConfig = activeConnection?.profile?.config;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Channel connections</CardTitle>
          <CardDescription>Store OAuth tokens or API keys for each distribution target.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {connections.map((connection) => (
              <button
                key={connection.channel}
                type="button"
                onClick={() => setChannel(connection.channel)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${channel === connection.channel ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
              >
                {connection.label}
              </button>
            ))}
          </div>
          {activeConnection && (
            <form action={formAction} className="space-y-3">
              <input type="hidden" name="channel" value={activeConnection.channel} />
              <div>
                <Label htmlFor="connectionLabel" className="text-xs text-muted-foreground">
                  Display name
                </Label>
              <Input id="connectionLabel" name="label" placeholder="Webflow Production" defaultValue={activeConnection.profile?.label ?? ""} />
              </div>
              <div>
                <Label htmlFor="accessToken" className="text-xs text-muted-foreground">
                  API key / token
                </Label>
                <Input id="accessToken" name="accessToken" placeholder="Secret token" defaultValue={profileConfig?.accessToken ?? ""} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="externalId" className="text-xs text-muted-foreground">
                    External ID / site slug
                  </Label>
                  <Input id="externalId" name="externalId" placeholder="site-id" defaultValue={profileConfig?.externalId ?? ""} />
                </div>
                <div>
                  <Label htmlFor="spaceId" className="text-xs text-muted-foreground">
                    Space / audience ID
                  </Label>
                  <Input id="spaceId" name="spaceId" placeholder="audience-id" defaultValue={profileConfig?.spaceId ?? ""} />
                </div>
              </div>
              {state.status === "error" && state.message && <p className="text-xs text-destructive">{state.message}</p>}
              {state.status === "success" && state.message && <p className="text-xs text-emerald-600">{state.message}</p>}
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Saving…" : "Save connection"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming publishes</CardTitle>
          <CardDescription>Queued jobs across every platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingJobs.length === 0 && <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>}
          {upcomingJobs.map((job) => {
            const channelMeta = CHANNEL_DEFINITIONS[job.channel];
            return (
              <div key={job.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{job.content.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {channelMeta.label} · {job.scheduledFor ? format(new Date(job.scheduledFor), "MMM d, h:mma") : "Queueing"}
                    </p>
                  </div>
                  <Badge className={statusColors[job.status]}>{job.status.toLowerCase()}</Badge>
                </div>
                {job.headline && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{job.headline}</p>}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
