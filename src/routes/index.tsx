import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Shield, Users, Wallet, Calendar, TrendingUp, MapPin } from "lucide-react";
import hero from "@/assets/hero-bodaboda.jpg";
import portrait from "@/assets/rider-portrait.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BodaLink — Smart management for boda boda groups in Kenya" },
      { name: "description", content: "Digitise attendance, savings, contributions and member welfare for boda boda self-help groups across Kenya." },
      { property: "og:title", content: "BodaLink — Riders United" },
      { property: "og:description", content: "Multi-tenant platform for boda boda self-help groups." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={hero} alt="" width={1600} height={1100} className="h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(115deg, oklch(0.18 0.06 260 / 0.92) 0%, oklch(0.22 0.07 260 / 0.78) 45%, oklch(0.18 0.06 260 / 0.35) 100%)" }} />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl text-secondary-foreground">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Trusted across Nairobi, Kisumu, Mombasa & Nakuru
            </div>
            <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight text-white">
              Riders United.<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-orange)" }}>
                Records Digitised.
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-xl">
              BodaLink replaces notebooks and receipt books with one secure platform — manage members, track weekly savings, monitor attendance, and keep every group accountable.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth"><Button size="lg" className="text-base px-7 shadow-[var(--shadow-glow)]">Sign in to your group</Button></Link>
              <Link to="/features"><Button size="lg" variant="outline" className="text-base px-7 border-white/40 bg-white/5 text-white hover:bg-white/15">Explore features</Button></Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-8 text-sm text-white/70">
              <div><div className="font-display text-3xl font-bold text-white">46+</div>Active members</div>
              <div><div className="font-display text-3xl font-bold text-white">4</div>Groups onboarded</div>
              <div><div className="font-display text-3xl font-bold text-white">KES 1.4M</div>Tracked savings</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Why BodaLink</div>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight">Built for the rider. Designed for the chairman.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three roles, one platform. From the regional safety officer to the youngest member — everyone gets exactly what they need.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { icon: Shield, title: "Main Officials", desc: "Regional oversight. Search any rider by name, ID or plate to instantly trace their group — critical when incidents happen." },
              { icon: Users, title: "Group Officials", desc: "Chairmen, secretaries and treasurers add members, suspend offenders, and run weekly meetings without paperwork." },
              { icon: Wallet, title: "Members", desc: "Riders see their own attendance and savings progress with clear red/yellow/green signals — no surprises at year-end." },
            ].map((f) => (
              <div key={f.title} className="group relative rounded-2xl border border-border bg-card p-7 transition-all hover:shadow-[var(--shadow-elegant)] hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPLIT */}
      <section className="bg-muted/40 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Built around real groups</div>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight">Every kilometer of trust, tracked.</h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Weekly contributions, year-end payouts, attendance apologies, member suspensions — BodaLink follows the rhythms boda boda groups already use, just without the lost notebook.
            </p>
            <div className="mt-8 space-y-4">
              {[
                { icon: Calendar, title: "Weekly attendance", desc: "Color-coded so members know exactly where they stand." },
                { icon: TrendingUp, title: "Year-long savings", desc: "Live progress towards the December closing date." },
                { icon: MapPin, title: "Regional visibility", desc: "Main officials see every rider across every stage." },
              ].map(item => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-primary/20 blur-3xl" />
            <img src={portrait} alt="A Kenyan boda boda rider in safety gear" width={900} height={1100} loading="lazy" className="relative rounded-3xl shadow-[var(--shadow-elegant)] object-cover w-full" />
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-card p-4 shadow-[var(--shadow-elegant)] border border-border">
              <div className="text-xs text-muted-foreground">This week's attendance</div>
              <div className="font-display text-3xl font-bold text-success">92%</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Ready to ditch the notebook?</h2>
          <p className="mt-4 text-lg text-muted-foreground">Sign in with a demo account and explore each role.</p>
          <div className="mt-8">
            <Link to="/auth"><Button size="lg" className="text-base px-8 shadow-[var(--shadow-glow)]">Enter the platform</Button></Link>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
