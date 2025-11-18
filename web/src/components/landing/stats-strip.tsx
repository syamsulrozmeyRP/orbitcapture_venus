type StatHighlight = {
  label: string;
  value: string;
};

type StatsStripProps = {
  stats: StatHighlight[];
};

export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <section className="px-6 pb-8">
      <div className="mx-auto grid max-w-5xl gap-4 rounded-2xl bg-white/80 p-6 text-center shadow-lg shadow-indigo-100/40 ring-1 ring-slate-100 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
