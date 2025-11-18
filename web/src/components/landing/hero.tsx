import Link from "next/link";

import { Button } from "@/components/ui/button";

type LandingHeroProps = {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

export function LandingHero({ primaryHref, primaryLabel, secondaryHref, secondaryLabel }: LandingHeroProps) {
  return (
    <section className="relative isolate overflow-hidden px-6 pb-16 pt-24 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-indigo-200/60 blur-3xl" />
        <div className="absolute -right-8 top-32 h-72 w-72 rounded-full bg-purple-200/50 blur-3xl" />
      </div>
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 shadow-sm">
          AI-powered orchestration for marketing teams
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
          Plan, create, approve, and publish across every channel from one collaborative hub.
        </h1>
        <p className="text-lg text-slate-600">
          ContentOS unifies ideation, drafting, approvals, and distribution with AI copilots, workspace branding, and granular permissions so your team ships on-message content in hours, not weeks.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <Button size="lg" variant="ghost" asChild>
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">No credit card • 14-day workspace</p>
      </div>
    </section>
  );
}
