import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth, primaryRole } from "@/hooks/use-auth";
import {
  getOfficialOverview, addMember, updateMemberStatus,
  recordWeek, logWelfare, logDevelopment,
} from "@/lib/bodalink.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { UserPlus, ClipboardCheck, HeartPulse, Hammer, Pause, Trash2, Users, Wallet, Calendar, HandCoins } from "lucide-react";
import { toast } from "sonner";
import type { GroupMember } from "@/lib/bodalink-types";

export const Route = createFileRoute("/_authenticated/dashboard/official")({
  component: OfficialDashboard,
});

function todayMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function OfficialDashboard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchOverview = useServerFn(getOfficialOverview);
  const addMemberFn = useServerFn(addMember);
  const updStatus = useServerFn(updateMemberStatus);
  const recordFn = useServerFn(recordWeek);
  const welfareFn = useServerFn(logWelfare);
  const devFn = useServerFn(logDevelopment);

  const { data, isLoading } = useQuery({
    queryKey: ["official-overview", auth.user?.id],
    queryFn: () => fetchOverview(),
    enabled: !!auth.user,
  });

  useEffect(() => {
    const r = primaryRole(auth.roles);
    if (!auth.loading && r && r !== "official") navigate({ to: "/dashboard" });
  }, [auth, navigate]);

  const [openAdd, setOpenAdd] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: "", phone: "", national_id: "", plate: "" });
  const [recordFor, setRecordFor] = useState<GroupMember | null>(null);
  const [record, setRecord] = useState({ attendance: "present" as "present"|"apology"|"absent", savings_kes: "", contribution_kes: "", development_kes: "", week_start: todayMonday() });
  const [openWelfare, setOpenWelfare] = useState(false);
  const [welfare, setWelfare] = useState({ category: "death" as const, title: "", details: "", amount_kes: "", event_date: new Date().toISOString().slice(0,10), beneficiary_member_id: "" });
  const [openDev, setOpenDev] = useState(false);
  const [dev, setDev] = useState({ title: "", description: "", amount_kes: "", log_date: new Date().toISOString().slice(0,10) });

  if (isLoading || !data) return <div className="text-muted-foreground">Loading your group…</div>;
  if (!data.group) {
    return (
      <Card className="p-8 text-center">
        <h2 className="font-display text-xl font-bold">No group linked to your account yet</h2>
        <p className="mt-2 text-muted-foreground">Sign up as a group official and pick the group you lead.</p>
      </Card>
    );
  }

  const group = data.group;
  const members = data.members ?? [];
  const records = data.records ?? [];

  const totals = members.reduce((acc, m) => {
    const mr = records.filter((r: any) => r.member_id === m.id);
    acc.savings += mr.reduce((s: number, r: any) => s + r.savings_kes, 0);
    acc.contrib += mr.reduce((s: number, r: any) => s + r.contribution_kes, 0);
    acc.dev += mr.reduce((s: number, r: any) => s + r.development_kes, 0);
    return acc;
  }, { savings: 0, contrib: 0, dev: 0 });

  const memberAttendance = (mid: string) => {
    const last = records.filter((r: any) => r.member_id === mid).slice(0, 12);
    if (!last.length) return 100;
    const s = last.reduce((acc: number, r: any) => acc + (r.attendance === "present" ? 1 : r.attendance === "apology" ? 0.5 : 0), 0);
    return Math.round((s / last.length) * 100);
  };
  const memberSum = (mid: string, key: "savings_kes"|"contribution_kes"|"development_kes") =>
    records.filter((r: any) => r.member_id === mid).reduce((s: number, r: any) => s + r[key], 0);

  const refresh = () => qc.invalidateQueries({ queryKey: ["official-overview"] });

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await addMemberFn({ data: { ...addForm, group_id: group.id } }); toast.success("Member added"); setOpenAdd(false); setAddForm({ full_name: "", phone: "", national_id: "", plate: "" }); refresh(); }
    catch (err: any) { toast.error(err.message); }
  };
  const submitRecord = async (e: React.FormEvent) => {
    e.preventDefault(); if (!recordFor) return;
    try {
      await recordFn({ data: {
        member_id: recordFor.id, group_id: group.id, week_start: record.week_start,
        attendance: record.attendance,
        savings_kes: parseInt(record.savings_kes || "0", 10),
        contribution_kes: parseInt(record.contribution_kes || "0", 10),
        development_kes: parseInt(record.development_kes || "0", 10),
      }});
      toast.success(`Week recorded for ${recordFor.full_name}`);
      setRecordFor(null); refresh();
    } catch (err: any) { toast.error(err.message); }
  };
  const submitWelfare = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await welfareFn({ data: {
        group_id: group.id, category: welfare.category, title: welfare.title,
        details: welfare.details || null,
        amount_kes: parseInt(welfare.amount_kes || "0", 10),
        event_date: welfare.event_date,
        beneficiary_member_id: welfare.beneficiary_member_id || null,
      }});
      toast.success("Welfare event logged"); setOpenWelfare(false);
      setWelfare({ category: "death", title: "", details: "", amount_kes: "", event_date: new Date().toISOString().slice(0,10), beneficiary_member_id: "" });
      refresh();
    } catch (err: any) { toast.error(err.message); }
  };
  const submitDev = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await devFn({ data: {
        group_id: group.id, title: dev.title, description: dev.description || null,
        amount_kes: parseInt(dev.amount_kes || "0", 10), log_date: dev.log_date,
      }});
      toast.success("Development update posted"); setOpenDev(false);
      setDev({ title: "", description: "", amount_kes: "", log_date: new Date().toISOString().slice(0,10) });
      refresh();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-secondary text-secondary-foreground border-secondary">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-secondary-foreground/70">Your group</div>
            <div className="mt-1 font-display text-2xl font-bold">{group.name}</div>
            <div className="text-sm text-secondary-foreground/70">{group.stage} · {group.region}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Dialog open={openWelfare} onOpenChange={setOpenWelfare}>
              <DialogTrigger asChild><Button variant="outline" className="bg-transparent text-secondary-foreground border-secondary-foreground/30 hover:bg-secondary-foreground/10"><HeartPulse className="h-4 w-4 mr-1" /> Welfare</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Log a welfare event</DialogTitle></DialogHeader>
                <form onSubmit={submitWelfare} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Category</Label>
                      <Select value={welfare.category} onValueChange={(v: any) => setWelfare({ ...welfare, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="death">Death</SelectItem>
                          <SelectItem value="accident">Accident</SelectItem>
                          <SelectItem value="illness">Illness</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label>Event date</Label><Input type="date" value={welfare.event_date} onChange={e => setWelfare({ ...welfare, event_date: e.target.value })} /></div>
                  </div>
                  <div className="space-y-1"><Label>Title</Label><Input required value={welfare.title} onChange={e => setWelfare({ ...welfare, title: e.target.value })} placeholder="e.g. Burial support — John Otieno" /></div>
                  <div className="space-y-1"><Label>Beneficiary (optional)</Label>
                    <Select value={welfare.beneficiary_member_id} onValueChange={(v) => setWelfare({ ...welfare, beneficiary_member_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select a member" /></SelectTrigger>
                      <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Details</Label><Textarea rows={3} value={welfare.details} onChange={e => setWelfare({ ...welfare, details: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Amount (KES)</Label><Input type="number" min="0" value={welfare.amount_kes} onChange={e => setWelfare({ ...welfare, amount_kes: e.target.value })} /></div>
                  <DialogFooter><Button type="submit" className="w-full">Log event</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={openDev} onOpenChange={setOpenDev}>
              <DialogTrigger asChild><Button variant="outline" className="bg-transparent text-secondary-foreground border-secondary-foreground/30 hover:bg-secondary-foreground/10"><Hammer className="h-4 w-4 mr-1" /> Development</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Post a weekly development update</DialogTitle></DialogHeader>
                <form onSubmit={submitDev} className="space-y-3">
                  <div className="space-y-1"><Label>Title</Label><Input required value={dev.title} onChange={e => setDev({ ...dev, title: e.target.value })} placeholder="e.g. Stage shelter roofing — phase 1" /></div>
                  <div className="space-y-1"><Label>Description</Label><Textarea rows={3} value={dev.description} onChange={e => setDev({ ...dev, description: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Amount used (KES)</Label><Input type="number" min="0" value={dev.amount_kes} onChange={e => setDev({ ...dev, amount_kes: e.target.value })} /></div>
                    <div className="space-y-1"><Label>Date</Label><Input type="date" value={dev.log_date} onChange={e => setDev({ ...dev, log_date: e.target.value })} /></div>
                  </div>
                  <DialogFooter><Button type="submit" className="w-full">Post update</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild><Button className="shadow-[var(--shadow-glow)]"><UserPlus className="h-4 w-4 mr-1" /> Add member</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Register a new rider</DialogTitle></DialogHeader>
                <form onSubmit={submitAdd} className="space-y-3">
                  <Input required placeholder="Full name" value={addForm.full_name} onChange={e => setAddForm({ ...addForm, full_name: e.target.value })} />
                  <Input required placeholder="Phone (+254…)" value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} />
                  <Input required placeholder="National ID" value={addForm.national_id} onChange={e => setAddForm({ ...addForm, national_id: e.target.value })} />
                  <Input required placeholder="Motorcycle plate" value={addForm.plate} onChange={e => setAddForm({ ...addForm, plate: e.target.value })} />
                  <DialogFooter><Button type="submit" className="w-full">Register</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Members" value={members.length.toString()} />
        <Stat icon={Calendar} label="Weeks recorded" value={records.length.toString()} />
        <Stat icon={Wallet} label="Group savings" value={`KES ${(totals.savings / 1000).toFixed(0)}K`} />
        <Stat icon={HandCoins} label="Group dev. fund" value={`KES ${(totals.contrib / 1000).toFixed(0)}K`} />
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="welfare">Welfare ({data.welfare?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="dev">Developments ({data.dev?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-3">Rider</th>
                    <th className="text-left px-5 py-3">Plate</th>
                    <th className="text-left px-5 py-3">Attendance</th>
                    <th className="text-left px-5 py-3">Savings</th>
                    <th className="text-left px-5 py-3">Group dev.</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => {
                    const att = memberAttendance(m.id);
                    const col = att >= 80 ? "text-success" : att >= 60 ? "text-warning" : "text-destructive";
                    return (
                      <tr key={m.id} className="border-t border-border">
                        <td className="px-5 py-3"><div className="font-medium">{m.full_name}</div><div className="text-xs text-muted-foreground">{m.phone}</div></td>
                        <td className="px-5 py-3 font-mono text-xs">{m.plate}</td>
                        <td className={`px-5 py-3 font-display font-semibold ${col} tabular-nums`}>{att}%</td>
                        <td className="px-5 py-3 tabular-nums">KES {memberSum(m.id, "savings_kes").toLocaleString()}</td>
                        <td className="px-5 py-3 tabular-nums">KES {memberSum(m.id, "contribution_kes").toLocaleString()}</td>
                        <td className="px-5 py-3">
                          {m.status === "active" && <Badge variant="outline" className="bg-success/15 text-success border-success/20">Active</Badge>}
                          {m.status === "suspended" && <Badge variant="destructive">Suspended</Badge>}
                          {m.status === "removed" && <Badge variant="secondary">Removed</Badge>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => { setRecord({ ...record, week_start: todayMonday() }); setRecordFor(m as GroupMember); }}>
                              <ClipboardCheck className="h-3.5 w-3.5 mr-1" /> Record week
                            </Button>
                            {m.status === "active" ? (
                              <Button size="sm" variant="outline" onClick={async () => { await updStatus({ data: { id: m.id, status: "suspended" } }); toast.success("Suspended"); refresh(); }}><Pause className="h-3.5 w-3.5" /></Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={async () => { await updStatus({ data: { id: m.id, status: "active" } }); toast.success("Reinstated"); refresh(); }}>Reinstate</Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => { await updStatus({ data: { id: m.id, status: "removed" } }); toast.success("Removed"); refresh(); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {members.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">No members yet. Add your first rider.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="welfare" className="mt-4 space-y-3">
          {(data.welfare ?? []).map((w: any) => (
            <Card key={w.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{w.title}</div>
                  {w.details && <p className="text-sm text-muted-foreground mt-1">{w.details}</p>}
                </div>
                <Badge variant="outline" className="capitalize">{w.category}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{w.event_date}</span>
                <span className="font-semibold tabular-nums">KES {w.amount_kes.toLocaleString()}</span>
              </div>
            </Card>
          ))}
          {(data.welfare ?? []).length === 0 && <Card className="p-6 text-center text-muted-foreground">No welfare events yet.</Card>}
        </TabsContent>

        <TabsContent value="dev" className="mt-4 space-y-3">
          {(data.dev ?? []).map((d: any) => (
            <Card key={d.id} className="p-4">
              <div className="font-semibold">{d.title}</div>
              {d.description && <p className="text-sm text-muted-foreground mt-1">{d.description}</p>}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{d.log_date}</span>
                <span className="font-semibold tabular-nums">KES {d.amount_kes.toLocaleString()}</span>
              </div>
            </Card>
          ))}
          {(data.dev ?? []).length === 0 && <Card className="p-6 text-center text-muted-foreground">No development updates yet.</Card>}
        </TabsContent>
      </Tabs>

      <Dialog open={!!recordFor} onOpenChange={(o) => !o && setRecordFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record week — {recordFor?.full_name}</DialogTitle></DialogHeader>
          <form onSubmit={submitRecord} className="space-y-4">
            <div className="space-y-1"><Label>Week (Monday)</Label><Input type="date" value={record.week_start} onChange={e => setRecord({ ...record, week_start: e.target.value })} /></div>
            <div>
              <Label>Attendance</Label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {(["present","apology","absent"] as const).map(v => (
                  <Button key={v} type="button" size="sm" variant={record.attendance === v ? "default" : "outline"} onClick={() => setRecord({ ...record, attendance: v })} className="capitalize">{v}</Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1"><Label className="text-xs">Personal savings</Label><Input type="number" min="0" value={record.savings_kes} onChange={e => setRecord({ ...record, savings_kes: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs text-primary">Group dev.</Label><Input type="number" min="0" value={record.contribution_kes} onChange={e => setRecord({ ...record, contribution_kes: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Weekly levy</Label><Input type="number" min="0" value={record.development_kes} onChange={e => setRecord({ ...record, development_kes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button type="submit" className="w-full">Save week</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
