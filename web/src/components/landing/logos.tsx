type LogosMarqueeProps = {
  logos: string[];
};

export function LogosMarquee({ logos }: LogosMarqueeProps) {
  return (
    <section className="px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-slate-500">
        {logos.map((logo) => (
          <span key={logo} className="font-semibold tracking-wide text-slate-400">
            {logo}
          </span>
        ))}
      </div>
    </section>
  );
}
