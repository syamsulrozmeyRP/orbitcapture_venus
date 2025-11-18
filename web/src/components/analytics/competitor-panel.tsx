import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CompetitorInsight } from "@/lib/analytics";

type Props = {
  insights: CompetitorInsight[];
};

export function CompetitorPanel({ insights }: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Competitor radar</CardTitle>
          <p className="text-sm text-muted-foreground">Share of voice, avg rank, and optimization gaps.</p>
        </div>
        <Badge className="bg-primary/10 text-primary">Updated hourly</Badge>
      </CardHeader>
      <CardContent>
        {insights.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>SOV</TableHead>
                <TableHead>Avg position</TableHead>
                <TableHead>Gap score</TableHead>
                <TableHead className="hidden lg:table-cell">Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insights.map((insight) => (
                <TableRow key={insight.id}>
                  <TableCell className="font-medium">{insight.competitorName}</TableCell>
                  <TableCell>{insight.shareOfVoice.toFixed(1)}%</TableCell>
                  <TableCell>{insight.avgPosition?.toFixed(1) ?? "—"}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      {insight.gapScore}
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {insight.summary ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No competitor data captured yet.</p>
        )}
        {insights.length > 0 && (
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recommended plays</p>
            <ul className="list-disc space-y-1 pl-4">
              {insights
                .flatMap((insight) => insight.recommendations)
                .slice(0, 4)
                .map((recommendation) => (
                  <li key={recommendation}>{recommendation}</li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
