import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHANNEL_DEFINITIONS } from "@/lib/channel-definitions";
import type { ChannelMetricSummary } from "@/lib/analytics";

type Props = {
  metrics: ChannelMetricSummary[];
};

export function ChannelPerformanceGrid({ metrics }: Props) {
  if (!metrics.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Channel performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No channel metrics available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.id} className="border-dashed">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{metric.label}</CardTitle>
              {metric.channel && (
                <Badge className={CHANNEL_DEFINITIONS[metric.channel]?.accentClass}>
                  {CHANNEL_DEFINITIONS[metric.channel]?.label ?? metric.channel}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Last synced window • {metric.trend.length} pts</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">CTR</p>
                <p className="text-base font-semibold">{metric.ctr ? `${metric.ctr.toFixed(1)}%` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conversions</p>
                <p className="text-base font-semibold">{metric.conversions?.toLocaleString() ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Engagement</p>
                <p className="text-base font-semibold">{metric.engagementRate ? `${metric.engagementRate.toFixed(1)}%` : "—"}</p>
              </div>
            </div>
            <ChannelSparkline data={metric.trend} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Avg time on page</span>
              <span>{metric.avgTimeOnPage ? `${metric.avgTimeOnPage}s` : "—"}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChannelSparkline({ data }: { data: number[] }) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground">No trend data.</p>;
  }

  const width = 260;
  const height = 80;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const normalized = data.map((value, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * width;
    const range = max - min || 1;
    const y = height - ((value - min) / range) * (height - 10) - 5;
    return { x, y };
  });

  const line = normalized
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full">
      <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
