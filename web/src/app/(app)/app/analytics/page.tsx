import { redirect } from "next/navigation";

import { AnalyticsOverviewPanel } from "@/components/analytics/analytics-overview";
import { ChannelPerformanceGrid } from "@/components/analytics/channel-matrix";
import { CompetitorPanel } from "@/components/analytics/competitor-panel";
import { OptimizationPanel } from "@/components/analytics/optimization-panel";
import { PrivacyCenter } from "@/components/analytics/privacy-center";
import { ProviderStatusCard } from "@/components/analytics/provider-status-card";
import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state";
import { refreshAnalyticsDataAction } from "@/actions/analytics";
import { loadAnalyticsDashboard } from "@/lib/analytics";
import { loadComplianceCenter } from "@/lib/compliance";
import { getWorkspaceContext } from "@/lib/workspace";

export default async function AnalyticsPage() {
  const { user, activeMembership } = await getWorkspaceContext();

  if (!user) {
    redirect("/sign-in");
  }

  if (!activeMembership) {
    return <WorkspaceEmptyState />;
  }

  const [analyticsData, complianceData] = await Promise.all([
    loadAnalyticsDashboard(user.id, activeMembership.workspaceId),
    loadComplianceCenter(user.id, activeMembership.workspaceId),
  ]);

  return (
    <div className="space-y-6">
      <AnalyticsOverviewPanel overview={analyticsData.overview} trend={analyticsData.trend} />

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="space-y-3 rounded-2xl border bg-white/60 p-4">
          <div>
            <p className="text-sm text-muted-foreground">Channel performance</p>
            <p className="text-base font-semibold">KPI coverage across owned + paid</p>
          </div>
          <ChannelPerformanceGrid metrics={analyticsData.channelMetrics} />
        </section>
        <ProviderStatusCard providerStates={analyticsData.providerStates} syncAction={refreshAnalyticsDataAction} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <CompetitorPanel insights={analyticsData.competitorInsights} />
        <OptimizationPanel defaultInsights={analyticsData.suggestedActions} />
      </div>

      <PrivacyCenter data={complianceData} />
    </div>
  );
}
