import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { Button } from "@/components/ui/button";

export async function LandingNav() {
  const { userId } = await auth();
  const primaryHref = userId ? "/app/dashboard" : "/sign-up";
  const secondaryHref = userId ? "/app/dashboard" : "/sign-in";

  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">CO</span>
          ContentOS
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          <Link href="#planner" className="hover:text-slate-900">
            Planner
          </Link>
          <Link href="#editor" className="hover:text-slate-900">
            Editor
          </Link>
          <Link href="#approvals" className="hover:text-slate-900">
            Approvals
          </Link>
          <Link href="#distribution" className="hover:text-slate-900">
            Distribution
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={secondaryHref}>{userId ? "Dashboard" : "Sign in"}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={primaryHref}>{userId ? "Enter app" : "Start free"}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
