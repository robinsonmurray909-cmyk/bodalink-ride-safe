import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Shield, Users, Bike } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { claimGroupAsOfficial, registerAsMember, claimMainOfficial } from "@/lib/bodalink.functions";
import { toast } from "sonner";
import type { Role, Group } from "@/lib/bodalink-types";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — BodaLink" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userRes.user.id);
      if ((roles ?? []).length > 0) navigate({ to: "/dashboard" });
    })();
  }, [navigate]);


  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 bg-muted/30">
        <section className="mx-auto max-w-2xl px-4 sm:px-6 py-14">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-brand-green">Verified access</div>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Welcome to BodaLink</h1>
            <p className="mt-3 text-muted-foreground">Members, group officials and main officials each get their own secure dashboard.</p>
          </div>

          <Card className="mt-10 p-6 md:p-8">
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-6"><SignInForm /></TabsContent>
              <TabsContent value="signup" className="mt-6"><SignUpFlow /></TabsContent>
            </Tabs>
          </Card>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Karibu tena!");
    navigate({ to: "/dashboard" });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}

function SignUpFlow() {
  const [role, setRole] = useState<Role | null>(null);

  if (!role) {
    const opts: { role: Role; title: string; desc: string; icon: typeof Shield }[] = [
      { role: "member", title: "Member (Rider)", desc: "You are a boda boda rider in a group.", icon: Bike },
      { role: "official", title: "Group Official", desc: "Chairman / treasurer / secretary of a group.", icon: Users },
      { role: "main", title: "Main Official", desc: "Regional oversight. Requires an invite code.", icon: Shield },
    ];
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Pick the role that matches you. Each role gets a different dashboard and access scope.</p>
        {opts.map(o => (
          <button key={o.role} type="button" onClick={() => setRole(o.role)} className="w-full text-left flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-muted transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-green/15 text-brand-green"><o.icon className="h-5 w-5" /></div>
            <div>
              <div className="font-semibold">{o.title}</div>
              <div className="text-xs text-muted-foreground">{o.desc}</div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return <SignUpForm role={role} onBack={() => setRole(null)} />;
}

function SignUpForm({ role, onBack }: { role: Role; onBack: () => void }) {
  const navigate = useNavigate();
  const claimGroup = useServerFn(claimGroupAsOfficial);
  const regMember = useServerFn(registerAsMember);
  const claimMain = useServerFn(claimMainOfficial);

  const { data: groups } = useQuery({
    queryKey: ["groups-public"],
    queryFn: async () => {
      const { data } = await supabase.from("groups").select("*").order("region");
      return (data ?? []) as Group[];
    },
    enabled: role !== "main",
  });

  const [form, setForm] = useState({
    full_name: "", email: "", password: "", phone: "",
    group_id: "", national_id: "", plate: "",
    invite_code: "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setBusy(true);
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    const { data: signUp, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: redirectTo,
        data: { full_name: form.full_name, phone: form.phone },
      },
    });
    if (error) { setBusy(false); toast.error(error.message); return; }

    // If email confirmation is on, there's no active session yet → ask user to verify.
    if (!signUp.session) {
      setBusy(false);
      toast.success("Account created. Check your email to verify, then sign in.");
      return;
    }

    try {
      if (role === "official") {
        await claimGroup({ data: { group_id: form.group_id } });
      } else if (role === "member") {
        await regMember({ data: {
          group_id: form.group_id, full_name: form.full_name,
          phone: form.phone, national_id: form.national_id, plate: form.plate,
        }});
      } else if (role === "main") {
        await claimMain({ data: { invite_code: form.invite_code } });
      }
      toast.success("Account ready!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Could not finalize sign-up");
    } finally {
      setBusy(false);
    }
  };

  const grouped = useMemo(() => {
    const byRegion: Record<string, Group[]> = {};
    (groups ?? []).forEach(g => { (byRegion[g.region] = byRegion[g.region] || []).push(g); });
    return byRegion;
  }, [groups]);

  return (
    <form onSubmit={submit} className="space-y-4">
      <button type="button" onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">← Change role</button>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Full name</Label>
          <Input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+2547…" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Password</Label>
          <Input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        </div>

        {(role === "member" || role === "official") && (
          <div className="space-y-2 sm:col-span-2">
            <Label>{role === "official" ? "Group you lead" : "Your group"}</Label>
            <Select value={form.group_id} onValueChange={(v) => setForm({ ...form, group_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select a group" /></SelectTrigger>
              <SelectContent>
                {Object.entries(grouped).map(([region, gs]) => (
                  <div key={region}>
                    <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">{region}</div>
                    {gs.map(g => <SelectItem key={g.id} value={g.id}>{g.name} · {g.stage}</SelectItem>)}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {role === "member" && (
          <>
            <div className="space-y-2">
              <Label>National ID</Label>
              <Input required value={form.national_id} onChange={e => setForm({ ...form, national_id: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Motorcycle plate</Label>
              <Input required value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} placeholder="KAB 234X" />
            </div>
          </>
        )}

        {role === "main" && (
          <div className="space-y-2 sm:col-span-2">
            <Label>Invite code</Label>
            <Input required value={form.invite_code} onChange={e => setForm({ ...form, invite_code: e.target.value })} placeholder="Issued by BodaLink admin" />
            <p className="text-xs text-muted-foreground">Demo code: <span className="font-mono">BODALINK-MAIN-2026</span></p>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
    </form>
  );
}
