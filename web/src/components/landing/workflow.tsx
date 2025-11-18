type WorkflowTimelineProps = {
  steps: { title: string; description: string }[];
};

export function WorkflowTimeline({ steps }: WorkflowTimelineProps) {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Workflow snapshot</p>
        <h2 className="mt-3 text-center text-3xl font-semibold text-slate-900">From idea to publish in one flow</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-5">
          {steps.map((step, index) => (
            <div key={step.title} className="relative text-center">
              {index < steps.length - 1 && (
                <span className="absolute inset-y-1/2 left-full hidden h-px w-full bg-gradient-to-r from-indigo-200 to-transparent md:block" aria-hidden />
              )}
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-indigo-200 bg-white text-sm font-semibold text-indigo-700">
                {index + 1}
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900">{step.title}</p>
              <p className="mt-1 text-xs text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
