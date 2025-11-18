import Link from "next/link";

const footerLinks = [
  {
    title: "Product",
    items: [
      { label: "Planner", href: "/app/planner" },
      { label: "Editor", href: "/app/editor" },
      { label: "Approvals", href: "/app/approvals" },
      { label: "Workspaces", href: "/app/workspaces" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Docs", href: "#" },
      { label: "Templates", href: "#" },
      { label: "API", href: "#" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "Contact", href: "mailto:hello@contentos.dev" },
      { label: "Press", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="mt-16 border-t border-slate-100 bg-white/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 md:flex-row md:justify-between">
        <div className="max-w-sm space-y-3">
          <p className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">CO</span>
            ContentOS
          </p>
          <p className="text-sm text-slate-500">
            Marketing operations platform for teams shipping content across every channel.
          </p>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} ContentOS. All rights reserved.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm text-slate-600 md:grid-cols-3">
          {footerLinks.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{group.title}</p>
              <ul className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="hover:text-slate-900">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
