import { endOfDay, format, startOfDay, subDays } from "date-fns";
import {
  AnalyticsIntegrationStatus,
  AnalyticsProvider,
  type AnalyticsSnapshot as PrismaAnalyticsSnapshot,
  type ChannelMetric as PrismaChannelMetric,
  type CompetitorSnapshot as PrismaCompetitorSnapshot,
  DistributionChannel,
} from "@prisma/client";

import { withUserContext } from "@/lib/rls";

const PROVIDER_LABELS: Record<AnalyticsProvider, string> = {
  [AnalyticsProvider.GOOGLE_SEARCH_CONSOLE]: "Google Search Console",
  [AnalyticsProvider.GA4]: "Google Analytics 4",
  [AnalyticsProvider.MICROSOFT_WEBMASTER]: "Microsoft Webmaster",
};

type ProviderSeedConfig = {
  provider: AnalyticsProvider;
  baseImpressions: number;
  clickRate: number;
  avgPosition: number;
  conversionRate: number;
  engagement: number;
  scopes: string[];
};

const PROVIDER_SEED_CONFIG: ProviderSeedConfig[] = [
  {
    provider: AnalyticsProvider.GOOGLE_SEARCH_CONSOLE,
    baseImpressions: 52000,
    clickRate: 0.13,
    avgPosition: 8.2,
    conversionRate: 0.018,
    engagement: 72,
    scopes: ["search.console.read"] as string[],
  },
  {
    provider: AnalyticsProvider.GA4,
    baseImpressions: 34000,
    clickRate: 0.09,
    avgPosition: 4.2,
    conversionRate: 0.027,
    engagement: 66,
    scopes: ["analytics.read"] as string[],
  },
  {
    provider: AnalyticsProvider.MICROSOFT_WEBMASTER,
    baseImpressions: 18000,
    clickRate: 0.07,
    avgPosition: 5.7,
    conversionRate: 0.015,
    engagement: 61,
    scopes: ["bing.webmaster.read"] as string[],
  },
];

type SnapshotMetricPayload = {
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
  conversions: number;
  engagementRate: number;
};

export type TrendPoint = {
  label: string;
  value: number;
};

export type ProviderState = {
  provider: AnalyticsProvider;
  label: string;
  status: AnalyticsIntegrationStatus;
  lastSyncedAt: Date | null;
  scopes: string[];
};

export type ChannelMetricSummary = {
  id: string;
  label: string;
  channel: DistributionChannel | null;
  ctr?: number | null;
  conversions?: number | null;
  engagementRate?: number | null;
  avgTimeOnPage?: number | null;
  revenue?: number | null;
  trend: number[];
};

export type CompetitorInsight = {
  id: string;
  competitorName: string;
  shareOfVoice: number;
  avgPosition?: number | null;
  gapScore: number;
  summary?: string | null;
  recommendations: string[];
  capturedAt: Date;
};

export type AnalyticsOverview = {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  engagementRate: number;
  avgPosition: number;
  lastSyncedAt: Date | null;
};

export type AnalyticsDashboardData = {
  overview: AnalyticsOverview;
  trend: TrendPoint[];
  providerStates: ProviderState[];
  channelMetrics: ChannelMetricSummary[];
  competitorInsights: CompetitorInsight[];
  suggestedActions: string[];
};

export async function loadAnalyticsDashboard(userId: string, workspaceId: string): Promise<AnalyticsDashboardData> {
  await ensureAnalyticsSeed(userId, workspaceId);

  return withUserContext(userId, async (tx) => {
    const [integrations, snapshots, channelMetrics, competitors] = await Promise.all([
      tx.analyticsIntegration.findMany({ where: { workspaceId }, orderBy: { provider: "asc" } }),
      tx.analyticsSnapshot.findMany({ where: { workspaceId }, orderBy: { rangeEnd: "desc" }, take: 30 }),
      tx.channelMetric.findMany({ where: { workspaceId }, orderBy: { periodEnd: "desc" }, take: 6 }),
      tx.competitorSnapshot.findMany({ where: { workspaceId }, orderBy: { capturedAt: "desc" }, take: 4 }),
    ]);

    const providerStates: ProviderState[] = integrations.map((integration) => ({
      provider: integration.provider,
      label: PROVIDER_LABELS[integration.provider],
      status: integration.status,
      lastSyncedAt: integration.lastSyncedAt,
      scopes: integration.scopes,
    }));

    const lastSyncedAt = providerStates.reduce<Date | null>((latest, provider) => {
      if (!provider.lastSyncedAt) return latest;
      if (!latest) return provider.lastSyncedAt;
      return provider.lastSyncedAt > latest ? provider.lastSyncedAt : latest;
    }, null);

    const overview = aggregateSnapshots(snapshots, lastSyncedAt);
    const trend = buildTrendSeries(snapshots);
    const channelSummaries = channelMetrics.map(mapChannelMetric);
    const competitorInsights = competitors.map(mapCompetitorSnapshot);
    const suggestedActions = competitorInsights.flatMap((insight) => insight.recommendations).slice(0, 4);

    return {
      overview,
      trend,
      providerStates,
      channelMetrics: channelSummaries,
      competitorInsights,
      suggestedActions,
    } satisfies AnalyticsDashboardData;
  });
}

export async function syncAnalyticsProviders(userId: string, workspaceId: string) {
  await ensureAnalyticsSeed(userId, workspaceId);

  return withUserContext(userId, async (tx) => {
    const integrations = await tx.analyticsIntegration.findMany({ where: { workspaceId } });
    const periodStart = startOfDay(new Date());
    const periodEnd = endOfDay(new Date());

    for (const integration of integrations) {
      const config = getProviderConfig(integration.provider);
      const multiplier = 0.95 + Math.random() * 0.1;
      const metrics = buildSnapshotMetrics(config, multiplier);

      await tx.analyticsSnapshot.create({
        data: {
          workspaceId,
          integrationId: integration.id,
          provider: integration.provider,
          rangeStart: periodStart,
          rangeEnd: periodEnd,
          metrics,
          channels: buildChannelBreakdown(metrics.impressions),
        },
      });

      await tx.analyticsIntegration.update({
        where: { id: integration.id },
        data: {
          status: AnalyticsIntegrationStatus.CONNECTED,
          lastSyncedAt: new Date(),
        },
      });
    }

    await tx.channelMetric.create({
      data: {
        workspaceId,
        channel: DistributionChannel.LINKEDIN,
        label: `LinkedIn sync · ${format(periodStart, "MMM d")}`,
        ctr: parseFloat((3 + Math.random() * 2).toFixed(2)),
        conversions: Math.round(28 + Math.random() * 32),
        engagementRate: parseFloat((6 + Math.random() * 3).toFixed(2)),
        avgTimeOnPage: Math.round(120 + Math.random() * 40),
        revenue: parseFloat((8000 + Math.random() * 4500).toFixed(0)),
        periodStart,
        periodEnd,
        metrics: { trend: buildTrendArray(6, 28, 52) },
      },
    });

    await tx.competitorSnapshot.create({
      data: {
        workspaceId,
        competitorName: "PulseNine",
        shareOfVoice: parseFloat((25 + Math.random() * 5).toFixed(2)),
        avgPosition: parseFloat((5 + Math.random()).toFixed(2)),
        gapScore: Math.round(70 + Math.random() * 15),
        summary: "Fresh crawl detected new long-form pillar content and aggressive backlink wins.",
        recommendations: [
          "Publish a supporting cluster targeting pipeline readiness keywords.",
          "Schedule a Core Web Vitals tune-up to close CWV regression gaps.",
          "Launch a co-marketing offer to recapture newsletter share.",
        ],
      },
    });
  });
}

function aggregateSnapshots(snapshots: PrismaAnalyticsSnapshot[], lastSyncedAt: Date | null): AnalyticsOverview {
  if (!snapshots.length) {
    return {
      impressions: 0,
      clicks: 0,
      ctr: 0,
      conversions: 0,
      engagementRate: 0,
      avgPosition: 0,
      lastSyncedAt,
    };
  }

  const totals = snapshots.reduce(
    (acc, snapshot) => {
      const metrics = parseSnapshotMetrics(snapshot);
      acc.impressions += metrics.impressions;
      acc.clicks += metrics.clicks;
      acc.conversions += metrics.conversions;
      acc.engagementRate += metrics.engagementRate;
      acc.avgPosition += metrics.avgPosition;
      acc.count += 1;
      return acc;
    },
    { impressions: 0, clicks: 0, conversions: 0, engagementRate: 0, avgPosition: 0, count: 0 },
  );

  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const engagement = totals.count ? totals.engagementRate / totals.count : 0;
  const avgPosition = totals.count ? totals.avgPosition / totals.count : 0;

  return {
    impressions: totals.impressions,
    clicks: totals.clicks,
    ctr: parseFloat(ctr.toFixed(2)),
    conversions: totals.conversions,
    engagementRate: parseFloat(engagement.toFixed(2)),
    avgPosition: parseFloat(avgPosition.toFixed(2)),
    lastSyncedAt,
  } satisfies AnalyticsOverview;
}

function buildTrendSeries(snapshots: PrismaAnalyticsSnapshot[]): TrendPoint[] {
  const grouped = new Map<string, { date: Date; clicks: number }>();

  snapshots.forEach((snapshot) => {
    const metrics = parseSnapshotMetrics(snapshot);
    const key = snapshot.rangeEnd.toISOString().slice(0, 10);
    const existing = grouped.get(key) ?? { date: snapshot.rangeEnd, clicks: 0 };
    existing.clicks += metrics.clicks;
    grouped.set(key, existing);
  });

  return Array.from(grouped.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-12)
    .map((entry) => ({
      label: format(entry.date, "MMM d"),
      value: entry.clicks,
    }));
}

function mapChannelMetric(metric: PrismaChannelMetric): ChannelMetricSummary {
  const payload = (metric.metrics as { trend?: number[] } | null) ?? {};
  return {
    id: metric.id,
    label: metric.label,
    channel: metric.channel,
    ctr: metric.ctr,
    conversions: metric.conversions,
    engagementRate: metric.engagementRate,
    avgTimeOnPage: metric.avgTimeOnPage,
    revenue: metric.revenue,
    trend: payload.trend ?? [],
  } satisfies ChannelMetricSummary;
}

function mapCompetitorSnapshot(snapshot: PrismaCompetitorSnapshot): CompetitorInsight {
  const recommendations = (snapshot.recommendations as string[] | null) ?? [];

  return {
    id: snapshot.id,
    competitorName: snapshot.competitorName,
    shareOfVoice: snapshot.shareOfVoice,
    avgPosition: snapshot.avgPosition,
    gapScore: snapshot.gapScore,
    summary: snapshot.summary,
    recommendations,
    capturedAt: snapshot.capturedAt,
  } satisfies CompetitorInsight;
}

function parseSnapshotMetrics(snapshot: PrismaAnalyticsSnapshot): SnapshotMetricPayload {
  const payload = snapshot.metrics as Partial<SnapshotMetricPayload> | null;
  return {
    impressions: payload?.impressions ?? 0,
    clicks: payload?.clicks ?? 0,
    ctr: payload?.ctr ?? 0,
    avgPosition: payload?.avgPosition ?? 0,
    conversions: payload?.conversions ?? 0,
    engagementRate: payload?.engagementRate ?? 0,
  } satisfies SnapshotMetricPayload;
}

function getProviderConfig(provider: AnalyticsProvider): ProviderSeedConfig {
  const config = PROVIDER_SEED_CONFIG.find((entry) => entry.provider === provider);
  if (!config) {
    throw new Error(`Missing analytics provider config for ${provider}`);
  }
  return config;
}

function buildSnapshotMetrics(config: ProviderSeedConfig, multiplier = 1): SnapshotMetricPayload {
  const impressions = Math.round(config.baseImpressions * multiplier);
  const clicks = Math.round(impressions * config.clickRate * (0.9 + Math.random() * 0.2));
  const ctr = impressions ? (clicks / impressions) * 100 : 0;
  const conversions = Math.round(clicks * config.conversionRate);
  const engagementRate = Math.min(100, config.engagement * (0.95 + Math.random() * 0.1));

  return {
    impressions,
    clicks,
    ctr: parseFloat(ctr.toFixed(2)),
    avgPosition: parseFloat((config.avgPosition * (0.95 + Math.random() * 0.1)).toFixed(2)),
    conversions,
    engagementRate: parseFloat(engagementRate.toFixed(2)),
  } satisfies SnapshotMetricPayload;
}

function buildChannelBreakdown(impressions: number) {
  return {
    organic: Math.round(impressions * 0.55),
    paid: Math.round(impressions * 0.3),
    referral: Math.round(impressions * 0.15),
  } satisfies Record<string, number>;
}

function buildTrendArray(points: number, min: number, max: number) {
  return Array.from({ length: points }, (_, index) => {
    const variance = Math.sin(index) * 3;
    return Math.round(min + (max - min) * (index / Math.max(points - 1, 1)) + variance);
  });
}

async function ensureAnalyticsSeed(userId: string, workspaceId: string) {
  return withUserContext(userId, async (tx) => {
    const existing = await tx.analyticsIntegration.count({ where: { workspaceId } });
    if (existing > 0) return;

    for (const config of PROVIDER_SEED_CONFIG) {
      const integration = await tx.analyticsIntegration.create({
        data: {
          workspaceId,
          provider: config.provider,
          status: AnalyticsIntegrationStatus.CONNECTED,
          scopes: config.scopes,
          metadata: { property: `${config.provider.toLowerCase()}-${workspaceId}` },
          lastSyncedAt: subDays(new Date(), 1),
        },
      });

      const snapshots = Array.from({ length: 14 }).map((_, index) => {
        const day = subDays(new Date(), index);
        const rangeStart = startOfDay(day);
        const rangeEnd = endOfDay(day);
        const decay = Math.max(0.6, 1 - index * 0.03);
        const metrics = buildSnapshotMetrics(config, decay);
        return {
          workspaceId,
          integrationId: integration.id,
          provider: config.provider,
          rangeStart,
          rangeEnd,
          metrics,
          channels: buildChannelBreakdown(metrics.impressions),
        };
      });

      await tx.analyticsSnapshot.createMany({ data: snapshots });
    }

    const periodEnd = endOfDay(new Date());
    const periodStart = subDays(periodEnd, 7);

    await tx.channelMetric.createMany({
      data: [
        {
          workspaceId,
          channel: DistributionChannel.LINKEDIN,
          label: "LinkedIn campaigns",
          ctr: 4.6,
          conversions: 42,
          engagementRate: 7.4,
          avgTimeOnPage: 138,
          revenue: 12400,
          periodStart,
          periodEnd,
          metrics: { trend: buildTrendArray(8, 26, 48) },
        },
        {
          workspaceId,
          channel: DistributionChannel.MAILCHIMP,
          label: "Newsletter streams",
          ctr: 3.1,
          conversions: 31,
          engagementRate: 18.4,
          avgTimeOnPage: 92,
          revenue: 8600,
          periodStart,
          periodEnd,
          metrics: { trend: buildTrendArray(8, 32, 54) },
        },
        {
          workspaceId,
          channel: DistributionChannel.WEBFLOW,
          label: "Organic landing pages",
          ctr: 5.8,
          conversions: 67,
          engagementRate: 12.1,
          avgTimeOnPage: 184,
          revenue: 15200,
          periodStart,
          periodEnd,
          metrics: { trend: buildTrendArray(8, 44, 72) },
        },
      ],
    });

    await tx.competitorSnapshot.createMany({
      data: [
        {
          workspaceId,
          competitorName: "OrbitSoft",
          shareOfVoice: 28.4,
          avgPosition: 6.2,
          gapScore: 78,
          summary: "Dominating branded discoverability and top-of-funnel SERPs.",
          recommendations: [
            "Ship FAQ schema to reclaim hero snippets.",
            "Invest in long-tail comparisons vs OrbitSoft.",
            "Launch episodic thought-leadership livestream.",
          ],
        },
        {
          workspaceId,
          competitorName: "NovaContent",
          shareOfVoice: 21.1,
          avgPosition: 5.4,
          gapScore: 65,
          summary: "Outperforming on newsletter engagement and partner webinars.",
          recommendations: [
            "Pilot win-back automation for newsletter churn.",
            "Bundle guest-authored stories with social boosts.",
            "Deploy benchmarking report to anchor PR push.",
          ],
        },
      ],
    });
  });
}
