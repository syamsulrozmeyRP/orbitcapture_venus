import { auth } from "@clerk/nextjs/server";

import { LandingHero } from "@/components/landing/hero";
import { LogosMarquee } from "@/components/landing/logos";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { WorkflowTimeline } from "@/components/landing/workflow";
import { TestimonialsGrid } from "@/components/landing/testimonials";
import { LandingCtaBanner } from "@/components/landing/cta-banner";
import { StatsStrip } from "@/components/landing/stats-strip";
import { LandingNav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/footer";
import {
  featurePillars,
  landingLogos,
  productSections,
  statHighlights,
  testimonials,
  workflowSteps,
} from "@/lib/landing-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { userId } = await auth();
  const primaryCtaHref = userId ? "/app/dashboard" : "/sign-up";
  const primaryCtaLabel = userId ? "Enter workspace" : "Start free workspace";
  const secondaryCtaHref = userId ? "/app/dashboard" : "/sign-in";
  const secondaryCtaLabel = userId ? "Open dashboard" : "I already have an account";

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-white via-indigo-50 to-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_55%)]" />
      <LandingNav />
      <LandingHero
        primaryHref={primaryCtaHref}
        primaryLabel={primaryCtaLabel}
        secondaryHref={secondaryCtaHref}
        secondaryLabel={secondaryCtaLabel}
      />
      <StatsStrip stats={statHighlights} />
      <LogosMarquee logos={landingLogos} />
      <FeatureGrid items={featurePillars} />
      {productSections.map((section, index) => (
        <ProductShowcase
          key={section.title}
          eyebrow={section.eyebrow}
          title={section.title}
          description={section.description}
          highlights={section.highlights}
          accent={`bg-gradient-to-br ${section.accent}`}
          reverse={index % 2 === 1}
        />
      ))}
      <WorkflowTimeline steps={workflowSteps} />
      <TestimonialsGrid testimonials={testimonials} />
      <LandingCtaBanner primaryHref={primaryCtaHref} primaryLabel={primaryCtaLabel} />
      <LandingFooter />
    </main>
  );
}
