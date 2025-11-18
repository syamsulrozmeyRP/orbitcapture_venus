import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsOverview, TrendPoint } from "@/lib/analytics";

type Props = {
  overview: AnalyticsOverview;
  trend: TrendPoint[];
};

export function AnalyticsOverviewPanel({ overview, trend }: Props) {
  const cards = [
    { label: "Impressions", value: formatNumber(overview.impressions), helper: "Rolling 30 days" },
    { label: "Clicks", value: formatNumber(overview.clicks), helper: "All channels" },
    { label: "CTR", value: `${overview.ctr.toFixed(2)}%`, helper: "Avg search" },
    { label: "Conversions", value: formatNumber(overview.conversions), helper: "Attributed" },
    { label: "Engagement", value: `${overview.engagementRate.toFixed(1)}%`, helper: "Weighted" },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Analytics</p>
          <h1 className="text-2xl font-semibold text-foreground">Performance intelligence</h1>
        </div>
        {overview.lastSyncedAt && (
          <p className="text-sm text-muted-foreground">
            Last synced {overview.lastSyncedAt.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label} className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Click momentum</CardTitle>
        </CardHeader>
        <CardContent>
          {trend.length ? (
            <AnalyticsTrendChart data={trend} />
          ) : (
            <p className="text-sm text-muted-foreground">Sync your integrations to populate trend lines.</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function AnalyticsTrendChart({ data }: { data: TrendPoint[] }) {
  const width = 700;
  const height = 180;
  const maxValue = Math.max(...data.map((point) => point.value), 1);
  const points = data.map((point, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * width;
    const y = height - (point.value / maxValue) * (height - 20) - 10;
    return { x, y };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");

  return (
    <div className="space-y-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full rounded-lg bg-muted/40">
        <defs>
          <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path}`} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
        <path
          d={`${path} L${points.at(-1)?.x ?? 0},${height} L${points[0]?.x ?? 0},${height} Z`}
          fill="url(#analyticsGradient)"
          opacity={0.4}
        />
      </svg>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {data.map((point) => (
          <div key={point.label} className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {point.label}: {formatNumber(point.value)} clicks
          </div>
        ))}
      </div>
    </div>
  );
}

function formatNumber(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}
