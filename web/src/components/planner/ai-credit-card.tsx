import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = {
  used: number;
  limit: number;
};

export function AiCreditCard({ used, limit }: Props) {
  const percentage = Math.min(100, Math.round((used / limit) * 100));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI credit usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm font-medium">
            <p>{used.toLocaleString()} tokens used</p>
            <p className="text-muted-foreground">{limit.toLocaleString()} monthly</p>
          </div>
          <div className="mt-2 h-3 rounded-full bg-muted">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <Separator />
        <p className="text-xs text-muted-foreground">
          Credits reset at the start of each month. Upgrade in Billing to unlock more OpenRouter generations.
        </p>
      </CardContent>
    </Card>
  );
}
