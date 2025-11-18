import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FeaturePillar } from "@/lib/landing-content";

type FeatureGridProps = {
  items: FeaturePillar[];
};

export function FeatureGrid({ items }: FeatureGridProps) {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
        {items.map((item) => (
          <Card key={item.title} className="border-dashed">
            <CardHeader className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{item.eyebrow}</span>
              <CardTitle className="flex items-center gap-2 text-xl">
                <item.icon className="h-4 w-4 text-indigo-600" />
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
