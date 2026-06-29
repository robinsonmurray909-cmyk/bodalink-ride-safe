import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Users, Bike } from "lucide-react";
import { session, SEED_USERS, type Role } from "@/lib/bodalink-data";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — BodaLink" }] }),
  component: Login,
});

const ROLES: { role: Role; title: string; desc: string; icon: typeof Shield; account: string }[] = [
  { role: "main", title: "Main Official", desc: "Regional oversight across all groups in the region. Search any rider, view their group, support safety operations.", icon: Shield, account: "u_main" },
  { role: "official", title: "Group Official", desc: "Chairman, treasurer or secretary of a single group. Manage members, attendance and savings.", icon: Users, account: "u_official_1" },
  { role: "member", title: "Member", desc: "Boda boda rider. View your own attendance percentage and savings progress through the year.", icon: Bike, account: "u_member" },
];

function Login() {
  const navigate = useNavigate();

  const handleLogin = (userId: string, role: Role) => {
    const user = SEED_USERS.find(u => u.id === userId);
    if (!user) return;
    session.set(user);
    toast.success(`Karibu, ${user.name.split(" ")[0]}!`);
    navigate({ to: role === "main" ? "/dashboard/main" : role === "official" ? "/dashboard/official" : "/dashboard/member" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 bg-muted/30">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Demo sign in</div>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight">Pick your role</h1>
            <p className="mt-3 text-muted-foreground">Each role unlocks a different dashboard. No password needed for the demo.</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {ROLES.map(r => (
              <Card key={r.role} className="p-7 flex flex-col hover:shadow-[var(--shadow-elegant)] hover:-translate-y-1 transition-all border-border">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <r.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">{r.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground flex-1">{r.desc}</p>
                <Button onClick={() => handleLogin(r.account, r.role)} className="mt-6 shadow-[var(--shadow-glow)]">
                  Sign in as {r.title}
                </Button>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
