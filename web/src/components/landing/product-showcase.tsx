import { cn } from "@/lib/utils";

type ProductShowcaseProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  accent: string;
  reverse?: boolean;
};

export function ProductShowcase({ eyebrow, title, description, highlights, accent, reverse }: ProductShowcaseProps) {
  return (
    <section className="px-6 py-10">
      <div className={cn("mx-auto flex max-w-6xl flex-col gap-12 rounded-3xl bg-white/80 p-8 shadow-xl shadow-indigo-100/50 ring-1 ring-slate-100", reverse ? "md:flex-row-reverse" : "md:flex-row") }>
        <div className="flex flex-1 flex-col justify-center gap-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{eyebrow}</span>
          <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
          <p className="text-base text-slate-600">{description}</p>
          <ul className="space-y-2 text-sm text-slate-600">
            {highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                {highlight}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className={cn("h-64 w-full rounded-2xl border border-dashed bg-gradient-to-br p-6 text-left text-sm font-medium text-white", accent)}>
            <p className="text-xs uppercase tracking-wide opacity-80">Live preview</p>
            <div className="mt-4 space-y-2">
              <div className="rounded-xl bg-white/20 p-4">
                <p className="text-lg">Campaign score ▸ 92</p>
                <p className="text-sm opacity-80">AI brief + calendar sync</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-lg">Approvals under 24h</p>
                <p className="text-sm opacity-70">Editor + manager lanes stay in lockstep.</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-lg">Channels armed</p>
                <p className="text-sm opacity-70">LinkedIn • Substack • Webflow • Mailchimp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
