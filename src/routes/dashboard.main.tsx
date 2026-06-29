import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { store, attendanceRate, attendanceLevel, savingsTotal } from "@/lib/bodalink-data";
import { Search, Users, MapPin, Bike, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/dashboard/main")({
  ssr: false,
  component: MainOfficialDashboard,
});

function MainOfficialDashboard() {
  const [q, setQ] = useState("");
  const { members, groups } = store.getAll();

  const filtered = useMemo(() => {
    if (!q.trim()) return members;
    const term = q.toLowerCase();
    return members.filter(m =>
      m.name.toLowerCase().includes(term) ||
      m.phone.includes(term) ||
      m.nationalId.includes(term) ||
      m.plate.toLowerCase().includes(term),
    );
  }, [q, members]);

  const totalSavings = members.reduce((sum, m) => sum + savingsTotal(m), 0);
  const suspended = members.filter(m => m.status === "suspended").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat icon={Users} label="Total riders" value={members.length.toString()} />
        <Stat icon={MapPin} label="Groups" value={groups.length.toString()} />
        <Stat icon={Bike} label="Total savings" value={`KES ${(totalSavings / 1000).toFixed(0)}K`} />
        <Stat icon={ShieldAlert} label="Suspended" value={suspended.toString()} tone="warn" />
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Find a rider</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Search by name, phone, ID number or plate. Useful when an incident is reported anywhere in the region.</p>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Brian Otieno, KAB 234, or 20012345"
          className="mt-4 h-12"
        />
        <div className="mt-2 text-xs text-muted-foreground">{filtered.length} result{filtered.length === 1 ? "" : "s"}</div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Rider</th>
                <th className="text-left px-5 py-3">Plate</th>
                <th className="text-left px-5 py-3">Group</th>
                <th className="text-left px-5 py-3">Region</th>
                <th className="text-left px-5 py-3">Attendance</th>
                <th className="text-left px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(m => {
                const group = groups.find(g => g.id === m.groupId);
                const rate = attendanceRate(m);
                const level = attendanceLevel(rate);
                const color = level === "good" ? "text-success" : level === "medium" ? "text-warning" : "text-destructive";
                return (
                  <tr key={m.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.phone} · ID {m.nationalId}</div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{m.plate}</td>
                    <td className="px-5 py-3">{group?.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{group?.region}</td>
                    <td className={`px-5 py-3 font-display font-semibold ${color} tabular-nums`}>{rate}%</td>
                    <td className="px-5 py-3">
                      {m.status === "active" ? (
                        <Badge className="bg-success/15 text-success border-success/20" variant="outline">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Suspended</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No riders match that search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: string; tone?: "warn" }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone === "warn" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 font-display text-3xl font-bold tabular-nums">{value}</div>
    </Card>
  );
}
