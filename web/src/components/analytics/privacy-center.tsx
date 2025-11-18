'use client'

import { useActionState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";

import { submitPrivacyRequestAction, updateConsentPreferenceAction } from "@/actions/compliance";
import { initialActionState } from "@/lib/action-state";
import type { ComplianceCenterData } from "@/lib/compliance";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  data: ComplianceCenterData;
};

type ConsentKey = "emailMarketing" | "analytics" | "ads";

export function PrivacyCenter({ data }: Props) {
  const [exportState, exportAction, exportPending] = useActionState(submitPrivacyRequestAction, initialActionState);
  const [deleteState, deleteAction, deletePending] = useActionState(submitPrivacyRequestAction, initialActionState);
  const [isUpdatingConsent, startUpdate] = useTransition();

  const toggleConsent = (email: string, key: ConsentKey, currentValue: boolean) => {
    const formData = new FormData();
    formData.set("personEmail", email);
    formData.set("preference", key);
    formData.set("value", (!currentValue).toString());
    startUpdate(async () => {
      await updateConsentPreferenceAction(formData);
    });
  };

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Compliance</p>
        <h2 className="text-xl font-semibold">GDPR/CCPA privacy center</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Open requests" value={data.stats.openRequests.toString()} helper="Awaiting SLA" />
        <StatCard label="Completed (30d)" value={data.stats.completedThisMonth.toString()} helper="Processed" />
        <StatCard label="Consented profiles" value={data.stats.consentedProfiles.toString()} helper="Preference center" />
        <StatCard label="Audit events" value={data.stats.auditsLast30.toString()} helper="Last 30 days" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Log export request</CardTitle>
            <p className="text-sm text-muted-foreground">Tracks Article 20 data portability workflows.</p>
          </CardHeader>
          <CardContent>
            <form action={exportAction} className="space-y-3">
              <input type="hidden" name="type" value="EXPORT" />
              <div className="space-y-1.5">
                <Label htmlFor="exportEmail">Requester email</Label>
                <Input id="exportEmail" name="requesterEmail" type="email" required placeholder="dpo@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exportReason">Notes</Label>
                <Textarea id="exportReason" name="reason" rows={3} placeholder="Include ticket ID or scope" />
              </div>
              {exportState.message && <p className="text-xs text-muted-foreground">{exportState.message}</p>}
              <Button type="submit" disabled={exportPending} className="w-full">
                {exportPending ? "Logging…" : "Record export"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Log deletion request</CardTitle>
            <p className="text-sm text-muted-foreground">Automates Article 17 right-to-erasure tracking.</p>
          </CardHeader>
          <CardContent>
            <form action={deleteAction} className="space-y-3">
              <input type="hidden" name="type" value="DELETE" />
              <div className="space-y-1.5">
                <Label htmlFor="deleteEmail">Requester email</Label>
                <Input id="deleteEmail" name="requesterEmail" type="email" required placeholder="privacy@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deleteReason">Notes</Label>
                <Textarea id="deleteReason" name="reason" rows={3} placeholder="Details, SLA, identifiers" />
              </div>
              {deleteState.message && <p className="text-xs text-muted-foreground">{deleteState.message}</p>}
              <Button type="submit" disabled={deletePending} className="w-full" variant="destructive">
                {deletePending ? "Logging…" : "Record deletion"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consent registry</CardTitle>
            <p className="text-sm text-muted-foreground">Toggle channels to capture granular consent.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {data.consents.length ? (
              data.consents.map((consent) => (
                <div key={consent.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{consent.personEmail}</p>
                    <Badge variant="outline">{formatDistanceToNow(consent.updatedAt, { addSuffix: true })}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {(["emailMarketing", "analytics", "ads"] as ConsentKey[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        disabled={isUpdatingConsent}
                        onClick={() => toggleConsent(consent.personEmail, key, consent[key])}
                        className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition ${
                          consent[key]
                            ? "border-primary/50 bg-primary/5 text-foreground"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        <span className="font-medium capitalize">{key.replace("emailMarketing", "email")}</span>
                        <span>{consent[key] ? "Opt-in" : "Opt-out"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No consent profiles synced yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent requests</CardTitle>
          </CardHeader>
          <CardContent>
            {data.requests.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.requesterEmail}</TableCell>
                      <TableCell>{request.type}</TableCell>
                      <TableCell>
                        <Badge className={requestStatusClass(request.status)}>{request.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {request.createdAt.toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No privacy requests yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audit trail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.events.length ? (
              data.events.map((event) => (
                <div key={event.id} className="rounded-lg border border-dashed p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{event.type.replace("_", " ")}</p>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(event.createdAt, { addSuffix: true })}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {event.description ?? "—"} {event.actorEmail ? `• ${event.actorEmail}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No audit events recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function requestStatusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-700";
    case "FAILED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
