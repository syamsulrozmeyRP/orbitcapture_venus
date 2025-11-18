import { ShieldCheck, Clock4, CheckCircle2, AlertTriangle } from "lucide-react";

import type { ApprovalSummaryMetrics } from "@/lib/approvals";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  summary: ApprovalSummaryMetrics;
};

const metricConfig = [
  {
    key: "pendingEditor" as const,
    label: "Awaiting Editor",
    description: "Need first-pass approval",
    icon: Clock4,
    accent: "text-amber-600",
  },
  {
    key: "pendingManager" as const,
    label: "Awaiting Manager",
    description: "Ready for final decision",
    icon: ShieldCheck,
    accent: "text-blue-600",
  },
  {
    key: "approvedAwaitingPublish" as const,
    label: "Approved",
    description: "Ready for scheduling",
    icon: CheckCircle2,
    accent: "text-emerald-600",
  },
  {
    key: "rejected" as const,
    label: "Needs revision",
    description: "Sent back with edits",
    icon: AlertTriangle,
    accent: "text-rose-600",
  },
] as const;

export function ApprovalSummaryCards({ summary }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metricConfig.map((config) => {
        const Icon = config.icon;
        const value = summary[config.key];
        return (
          <Card key={config.key} className="border-dashed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{config.label}</CardTitle>
              <Icon className={`h-4 w-4 ${config.accent}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{value}</div>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
