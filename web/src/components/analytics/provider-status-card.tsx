import { RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProviderState } from "@/lib/analytics";

type Props = {
  providerStates: ProviderState[];
  syncAction?: () => Promise<void>;
};

const STATUS_STYLES: Record<string, string> = {
  CONNECTED: "bg-emerald-100 text-emerald-700",
  DISCONNECTED: "bg-amber-100 text-amber-700",
  ERROR: "bg-red-100 text-red-700",
};

export function ProviderStatusCard({ providerStates, syncAction }: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Source health</CardTitle>
          <p className="text-sm text-muted-foreground">OAuth scopes auto-refresh every 6 hours.</p>
        </div>
        {syncAction && (
          <form action={syncAction}>
            <Button type="submit" variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Sync sources
            </Button>
          </form>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {providerStates.length === 0 && <p className="text-sm text-muted-foreground">No integrations connected.</p>}
        {providerStates.map((provider) => (
          <div key={provider.provider} className="rounded-xl border border-dashed p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{provider.label}</p>
                <p className="text-xs text-muted-foreground">Scopes: {provider.scopes.join(", ")}</p>
              </div>
              <Badge className={STATUS_STYLES[provider.status] ?? "bg-slate-100 text-slate-700"}>{provider.status}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Last sync {provider.lastSyncedAt ? provider.lastSyncedAt.toLocaleString() : "never"}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
