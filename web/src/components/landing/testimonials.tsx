import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Testimonial = {
  quote: string;
  author: string;
  role: string;
  company: string;
};

type TestimonialsGridProps = {
  testimonials: Testimonial[];
};

export function TestimonialsGrid({ testimonials }: TestimonialsGridProps) {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Testimonials</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Teams close loops 3× faster on ContentOS</h2>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <Card key={item.author} className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">{item.author}</CardTitle>
                <p className="text-sm text-slate-500">{item.role} · {item.company}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">“{item.quote}”</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
