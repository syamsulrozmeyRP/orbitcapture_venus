'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, CheckCircle2, LayoutDashboard, PenTool, Settings2, Users, Users2 } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Analytics", href: "/app/analytics", icon: BarChart3 },
  { label: "Planner", href: "/app/planner", icon: CalendarDays },
  { label: "Editor", href: "/app/editor", icon: PenTool },
  { label: "Approvals", href: "/app/approvals", icon: CheckCircle2 },
  { label: "Personas", href: "/app/personas", icon: Users2 },
  { label: "Workspaces", href: "/app/workspaces", icon: Settings2 },
  { label: "Members", href: "/app/workspaces#members", icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar/80 px-4 py-6 text-sm text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-2 px-2 text-lg font-semibold">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          CO
        </div>
        ContentOS
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const targetPath = item.href.split("#")[0];
          const isActive = pathname?.startsWith(targetPath ?? item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="px-2 text-xs text-muted-foreground">Powered by Next.js 16 + Editor.js</p>
    </aside>
  );
}
