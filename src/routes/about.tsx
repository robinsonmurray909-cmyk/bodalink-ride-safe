import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — BodaLink" },
      { name: "description", content: "BodaLink digitises boda boda self-help groups across Kenya." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-20">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">Our story</div>
          <h1 className="mt-3 font-display text-5xl font-bold tracking-tight">Built for Kenya's largest informal sector.</h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Boda boda transport employs millions across Kenya. Yet most riders' welfare groups still rely on notebooks, handwritten attendance, and informal loan tracking — methods that are slow, error-prone, and vulnerable to fraud.
          </p>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            BodaLink modernises that. We give regional officials clean visibility for safety, group leaders the tools to run weekly meetings, and members confidence in every shilling saved.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              { stat: "millions", label: "Riders supported across Kenya" },
              { stat: "0%", label: "Paperwork required to run a meeting" },
              { stat: "100%", label: "Visibility for members on savings & attendance" },
            ].map(b => (
              <div key={b.label} className="rounded-2xl border border-border bg-card p-6">
                <div className="font-display text-3xl font-bold text-primary">{b.stat}</div>
                <div className="mt-2 text-sm text-muted-foreground">{b.label}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
