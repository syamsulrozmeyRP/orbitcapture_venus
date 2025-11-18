import Link from "next/link";

import { Button } from "@/components/ui/button";

type CtaBannerProps = {
  primaryHref: string;
  primaryLabel: string;
};

export function LandingCtaBanner({ primaryHref, primaryLabel }: CtaBannerProps) {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 px-8 py-12 text-center text-white shadow-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">Ready when you are</p>
        <h2 className="mt-3 text-3xl font-semibold">Spin up a branded workspace in under 2 minutes.</h2>
        <p className="mt-3 text-base text-white/80">
          Bring your team, connect channels, and keep approvals, publishing, and analytics in one control center.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" variant="secondary" className="bg-white text-indigo-700 hover:bg-white/90" asChild>
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Powered by Clerk + PostgreSQL</p>
        </div>
      </div>
    </section>
  );
}
