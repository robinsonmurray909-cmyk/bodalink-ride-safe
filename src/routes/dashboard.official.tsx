import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { store, session, attendanceRate, attendanceLevel, savingsTotal, type Member } from "@/lib/bodalink-data";
import { UserPlus, Pause, Trash2, Users, Wallet, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/official")({
  ssr: false,
  component: OfficialDashboard,
});

function OfficialDashboard() {
  const [user] = useState(() => session.get());
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", nationalId: "", plate: "" });
  const group = user?.groupId ? store.getGroup(user.groupId) : null;

  const refresh = () => { if (user?.groupId) setMembers(store.getMembersByGroup(user.groupId)); };
  useEffect(refresh, [user]);

  if (!user || !group) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    store.addMember({ ...form, groupId: group.id });
    toast.success(`${form.name} added to ${group.name}`);
    setForm({ name: "", phone: "", nationalId: "", plate: "" });
    setOpen(false);
    refresh();
  };

  const updateStatus = (id: string, status: Member["status"], label: string) => {
    store.updateMemberStatus(id, status);
    toast.success(`Member ${label}`);
    refresh();
  };

  const avgAttendance = members.length ? Math.round(members.reduce((s, m) => s + attendanceRate(m), 0) / members.length) : 0;
  const totalSavings = members.reduce((s, m) => s + savingsTotal(m), 0);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-secondary text-secondary-foreground border-secondary">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-secondary-foreground/70">Your group</div>
            <div className="mt-1 font-display text-2xl font-bold">{group.name}</div>
            <div className="text-sm text-secondary-foreground/70">{group.stage} · {group.region}</div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-[var(--shadow-glow)]"><UserPlus className="h-4 w-4 mr-2" /> Add member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Register a new rider</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-3">
                <Input required placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <Input required placeholder="Phone (+254...)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <Input required placeholder="National ID" value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} />
                <Input required placeholder="Motorcycle plate (e.g. KAB 234X)" value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} />
                <DialogFooter><Button type="submit" className="w-full">Register member</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Users} label="Members" value={members.length.toString()} />
        <Stat icon={Calendar} label="Avg attendance" value={`${avgAttendance}%`} />
        <Stat icon={Wallet} label="Group savings" value={`KES ${(totalSavings / 1000).toFixed(0)}K`} />
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold">Members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Rider</th>
                <th className="text-left px-5 py-3">Plate</th>
                <th className="text-left px-5 py-3">Attendance</th>
                <th className="text-left px-5 py-3">Savings (YTD)</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => {
                const rate = attendanceRate(m);
                const lvl = attendanceLevel(rate);
                const col = lvl === "good" ? "text-success" : lvl === "medium" ? "text-warning" : "text-destructive";
                return (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-5 py-3">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.phone}</div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{m.plate}</td>
                    <td className={`px-5 py-3 font-display font-semibold ${col} tabular-nums`}>{rate}%</td>
                    <td className="px-5 py-3 tabular-nums">KES {savingsTotal(m).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      {m.status === "active" && <Badge className="bg-success/15 text-success border-success/20" variant="outline">Active</Badge>}
                      {m.status === "suspended" && <Badge variant="destructive">Suspended</Badge>}
                      {m.status === "removed" && <Badge variant="secondary">Removed</Badge>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        {m.status === "active" ? (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(m.id, "suspended", "suspended")}>
                            <Pause className="h-3.5 w-3.5 mr-1" /> Suspend
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(m.id, "active", "reinstated")}>Reinstate</Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => updateStatus(m.id, "removed", "removed")}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-2 font-display text-3xl font-bold tabular-nums">{value}</div>
    </Card>
  );
}
