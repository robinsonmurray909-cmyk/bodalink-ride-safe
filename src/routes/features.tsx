import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Shield, Users, Wallet, Calendar, TrendingUp, Search, UserPlus, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — BodaLink" },
      { name: "description", content: "Attendance tracking, savings management, member search and more for boda boda groups." },
    ],
  }),
  component: Features,
});

const FEATURES = [
  { icon: Search, title: "Cross-region member search", desc: "Main officials find any rider by name, ID or registration plate within seconds." },
  { icon: UserPlus, title: "Add & manage members", desc: "Group officials onboard new riders with full KYC and welcome them into the group." },
  { icon: AlertTriangle, title: "Suspend or remove", desc: "Discipline cases handled cleanly. Status is always visible to officials." },
  { icon: Calendar, title: "Weekly attendance", desc: "Members see their last 12 weeks color-coded — red, yellow, green." },
  { icon: Wallet, title: "Savings progress", desc: "Track weekly contributions toward the annual closing date payout." },
  { icon: TrendingUp, title: "Group dashboards", desc: "Chairmen monitor turnout, savings totals and member health at a glance." },
  { icon: Shield, title: "Safety oversight", desc: "Reduce insecurity in the boda boda sector with regional accountability." },
  { icon: Users, title: "Role-based access", desc: "Main officials, group officials and members each see only what they need." },
];

function Features() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Features</div>
            <h1 className="mt-3 font-display text-5xl font-bold tracking-tight">Everything a boda boda group needs.</h1>
            <p className="mt-4 text-lg text-muted-foreground">One platform, three roles, dozens of small tools that replace days of paperwork.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-[var(--shadow-elegant)] transition-all">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
