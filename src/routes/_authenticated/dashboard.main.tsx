import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth, primaryRole } from "@/hooks/use-auth";
import { getMainOverview } from "@/lib/bodalink.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, MapPin, Shield, Wallet, HandCoins, HeartPulse, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/main")({
  component: MainDashboard,
});

function MainDashboard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const fetchOverview = useServerFn(getMainOverview);
  const { data, isLoading, error } = useQuery({
    queryKey: ["main-overview", auth.user?.id],
    queryFn: () => fetchOverview(),
    enabled: !!auth.user && auth.roles.includes("main"),
  });
  const [q, setQ] = useState("");

  useEffect(() => {
    const r = primaryRole(auth.roles);
    if (!auth.loading && r && r !== "main") navigate({ to: "/dashboard" });
  }, [auth, navigate]);

  const groupsById = useMemo(() => {
    const map: Record<string, any> = {};
    (data?.groups ?? []).forEach((g: any) => map[g.id] = g);
    return map;
  }, [data]);

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return (data?.members ?? []).filter((m: any) =>
      m.full_name.toLowerCase().includes(needle)
      || m.national_id.toLowerCase().includes(needle)
      || m.plate.toLowerCase().includes(needle)
      || m.phone.includes(needle),
    ).slice(0, 50);
  }, [data, q]);

  if (isLoading) return <div className="text-muted-foreground">Loading regional data…</div>;
  if (error) return <Card className="p-6 text-destructive">{(error as Error).message}</Card>;

  const groups = data?.groups ?? [];
  const members = data?.members ?? [];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-secondary text-secondary-foreground border-secondary">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6" />
          <div>
            <div className="text-xs uppercase tracking-widest text-secondary-foreground/70">Main Official</div>
            <div className="font-display text-2xl font-bold">Regional oversight — all groups</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Total active members" value={(data?.totals?.members ?? members.length).toString()} />
        <Stat icon={MapPin} label="Active groups" value={groups.length.toString()} />
        <Stat icon={Shield} label="Regions" value={new Set(groups.map((g: any) => g.region)).size.toString()} />
        <Stat icon={Calendar} label="Weekly records" value={(data?.totals?.weekly_records ?? 0).toString()} />
        <Stat icon={Wallet} label="Total savings" value={`KES ${(data?.totals?.savings ?? 0).toLocaleString()}`} />
        <Stat icon={HandCoins} label="Group dev. fund" value={`KES ${(data?.totals?.group_dev_fund ?? 0).toLocaleString()}`} />
        <Stat icon={HeartPulse} label="Welfare paid out" value={`KES ${(data?.totals?.welfare_paid ?? 0).toLocaleString()}`} />
        <Stat icon={Shield} label="Weekly dev. levy" value={`KES ${(data?.totals?.dev_levy ?? 0).toLocaleString()}`} />
      </div>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold">All groups — breakdown</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left py-2">Group</th>
                <th className="text-left py-2">Region</th>
                <th className="text-right py-2">Members</th>
                <th className="text-right py-2">Savings</th>
                <th className="text-right py-2">Dev. fund</th>
                <th className="text-right py-2">Welfare paid</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g: any) => {
                const gm = members.filter((m: any) => m.group_id === g.id && m.status === "active");
                const gr = (data?.records ?? []).filter((r: any) => r.group_id === g.id);
                const gAdj = (data?.adjustments ?? []).filter((a: any) => a.group_id === g.id);
                const gWc = (data?.contributions ?? []).filter((c: any) => c.group_id === g.id && c.status === "approved");
                const gWf = (data?.welfare ?? []).filter((w: any) => w.group_id === g.id);
                const sav = gr.reduce((s: number, r: any) => s + (r.savings_kes || 0), 0) + gAdj.reduce((s: number, a: any) => s + (a.amount_kes || 0), 0);
                const fund = gr.reduce((s: number, r: any) => s + (r.contribution_kes || 0), 0) + gWc.reduce((s: number, c: any) => s + c.amount_kes, 0);
                const wpaid = gWf.reduce((s: number, w: any) => s + (w.amount_kes || 0), 0);
                return (
                  <tr key={g.id} className="border-b border-border/60">
                    <td className="py-2 font-medium">{g.name}</td>
                    <td className="py-2 text-muted-foreground">{g.region}</td>
                    <td className="py-2 text-right tabular-nums">{gm.length}</td>
                    <td className="py-2 text-right tabular-nums">KES {sav.toLocaleString()}</td>
                    <td className="py-2 text-right tabular-nums">KES {fund.toLocaleString()}</td>
                    <td className="py-2 text-right tabular-nums">KES {wpaid.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold">Search any rider</h2>
        <p className="text-xs text-muted-foreground">Find by name, national ID, plate or phone. Use this when investigating a safety incident.</p>
        <div className="mt-3 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. KAB 234X, 22345678, Brian Otieno" className="pl-9" />
        </div>
        {q && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left py-2">Rider</th>
                  <th className="text-left py-2">National ID</th>
                  <th className="text-left py-2">Plate</th>
                  <th className="text-left py-2">Group</th>
                  <th className="text-left py-2">Region</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {matches.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">No matches.</td></tr>}
                {matches.map((m: any) => {
                  const g = groupsById[m.group_id];
                  return (
                    <tr key={m.id} className="border-b border-border/60">
                      <td className="py-2"><div className="font-medium">{m.full_name}</div><div className="text-xs text-muted-foreground">{m.phone}</div></td>
                      <td className="py-2 font-mono text-xs">{m.national_id}</td>
                      <td className="py-2 font-mono text-xs">{m.plate}</td>
                      <td className="py-2">{g?.name ?? "—"}</td>
                      <td className="py-2">{g?.region ?? "—"}</td>
                      <td className="py-2">
                        {m.status === "active" && <Badge variant="outline" className="bg-success/15 text-success border-success/20">Active</Badge>}
                        {m.status === "suspended" && <Badge variant="destructive">Suspended</Badge>}
                        {m.status === "removed" && <Badge variant="secondary">Removed</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold">All groups</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {groups.map((g: any) => {
            const count = members.filter((m: any) => m.group_id === g.id).length;
            return (
              <div key={g.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between"><div className="font-semibold">{g.name}</div><Badge variant="outline">{count} members</Badge></div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {g.stage} · {g.region}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green"><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-2 font-display text-3xl font-bold tabular-nums">{value}</div>
    </Card>
  );
}
