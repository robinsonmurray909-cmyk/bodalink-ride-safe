import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth, primaryRole } from "@/hooks/use-auth";
import { getMyOverview, requestWelfarePayment } from "@/lib/bodalink.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PercentBar } from "@/components/PercentBar";
import { attendancePct, attendanceLevel, safePct, type PaymentSource, type WelfareEvent } from "@/lib/bodalink-types";
import { Calendar, Wallet, HandCoins, HeartPulse, Hammer, Phone, MapPin, CreditCard } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/member")({
  component: MemberDashboard,
});

function MemberDashboard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchOverview = useServerFn(getMyOverview);
  const payFn = useServerFn(requestWelfarePayment);

  const { data, isLoading } = useQuery({
    queryKey: ["member-overview", auth.user?.id],
    queryFn: () => fetchOverview(),
    enabled: !!auth.user,
  });

  useEffect(() => {
    if (!auth.loading && primaryRole(auth.roles) && primaryRole(auth.roles) !== "member") {
      navigate({ to: "/dashboard" });
    }
  }, [auth, navigate]);

  const [payFor, setPayFor] = useState<WelfareEvent | null>(null);
  const [payForm, setPayForm] = useState({ amount_kes: "", source: "savings" as PaymentSource, notes: "" });

  if (isLoading || !data) return <div className="text-muted-foreground">Loading your group…</div>;
  if (!data.member) {
    return (
      <Card className="p-8 text-center">
        <h2 className="font-display text-xl font-bold">You're not registered to a group yet</h2>
        <p className="mt-2 text-muted-foreground">Ask your group official to add you, or complete your member sign-up.</p>
      </Card>
    );
  }

  const records = (data.records ?? []) as any[];
  const adjustments = (data.adjustments ?? []) as any[];
  const contributions = (data.contributions ?? []) as any[];
  const recent = records.slice(0, 12);
  const att = attendancePct(recent);
  const lvl = attendanceLevel(att);

  const savingsGross = records.reduce((s, r) => s + (r.savings_kes || 0), 0);
  const savingsAdj = adjustments.reduce((s, a) => s + (a.amount_kes || 0), 0);
  const savings = savingsGross + savingsAdj;
  // Group dev is mandatory & non-refundable — comes only from weekly records, NOT welfare contributions
  const contributions_total = records.reduce((s, r) => s + (r.contribution_kes || 0), 0);
  const welfare_contributed_total = contributions.filter(c => c.status === "approved").reduce((s, c) => s + c.amount_kes, 0);
  const development = records.reduce((s, r) => s + (r.development_kes || 0), 0);
  const sPct = safePct(savings, data.member.target_savings);
  const cPct = safePct(contributions_total, data.member.target_contributions);

  const submitPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payFor) return;
    try {
      await payFn({ data: {
        welfare_event_id: payFor.id,
        amount_kes: parseInt(payForm.amount_kes || "0", 10),
        source: payForm.source,
        notes: payForm.notes || null,
      }});
      toast.success(payForm.source === "savings"
        ? "Request sent to official — they will deduct from your savings."
        : "Payment recorded. Complete the transfer and the official will confirm.");
      setPayFor(null);
      setPayForm({ amount_kes: "", source: "savings", notes: "" });
      qc.invalidateQueries({ queryKey: ["member-overview"] });
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-secondary text-secondary-foreground border-secondary">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-secondary-foreground/70">Your group</div>
            <div className="mt-1 font-display text-2xl font-bold">{data.group?.name}</div>
            <div className="text-sm text-secondary-foreground/70 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {data.group?.stage} · {data.group?.region}</div>
          </div>
          {data.official && (
            <div className="text-sm">
              <div className="text-xs uppercase tracking-widest text-secondary-foreground/70">Group official</div>
              <div className="font-semibold">{data.official.full_name}</div>
              {data.official.phone && <a href={`tel:${data.official.phone}`} className="inline-flex items-center gap-1 text-secondary-foreground/80 hover:underline"><Phone className="h-3.5 w-3.5" /> {data.official.phone}</a>}
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between"><div className="text-xs uppercase tracking-wider text-muted-foreground">Attendance (12wk)</div><Calendar className="h-4 w-4 text-brand-green" /></div>
          <div className={`mt-2 font-display text-3xl font-bold ${lvl === "good" ? "text-success" : lvl === "medium" ? "text-warning" : "text-destructive"}`}>{att}%</div>
          <PercentBar value={att} className="mt-3" />
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><div className="text-xs uppercase tracking-wider text-muted-foreground">Personal savings</div><Wallet className="h-4 w-4 text-brand-green" /></div>
          <div className="mt-2 font-display text-3xl font-bold tabular-nums">KES {savings.toLocaleString()}</div>
          <PercentBar value={sPct} className="mt-3" />
          <div className="mt-1 text-xs text-muted-foreground">Target KES {data.member.target_savings.toLocaleString()}{savingsAdj !== 0 && ` · Adjustments KES ${savingsAdj.toLocaleString()}`}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><div className="text-xs uppercase tracking-wider text-primary font-semibold">Group dev. (mandatory)</div><HandCoins className="h-4 w-4 text-brand-green" /></div>
          <div className="mt-2 font-display text-3xl font-bold tabular-nums">KES {contributions_total.toLocaleString()}</div>
          <PercentBar value={cPct} className="mt-3" />
          <div className="mt-1 text-xs text-muted-foreground">Target KES {data.member.target_contributions.toLocaleString()} · weekly dev. levy YTD: KES {development.toLocaleString()}</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-display font-bold flex items-center gap-2"><HeartPulse className="h-4 w-4 text-destructive" /> Welfare cases</h3>
          <p className="text-xs text-muted-foreground">Tap Pay to contribute from your savings or via M-Pesa/card/bank.</p>
          <div className="mt-4 space-y-3">
            {(data.welfare ?? []).length === 0 && <div className="text-sm text-muted-foreground">No welfare events recorded.</div>}
            {(data.welfare ?? []).map((w: any) => {
              const collected = w.collected_kes || 0;
              const target = w.amount_kes || 0;
              const progress = safePct(collected, target);
              return (
                <div key={w.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{w.title}</div>
                    <Badge variant="outline" className="capitalize">{w.category}</Badge>
                  </div>
                  {w.details && <p className="mt-1 text-sm text-muted-foreground">{w.details}</p>}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{w.event_date}</span>
                    <span className="font-semibold">KES {collected.toLocaleString()} / {target.toLocaleString()}</span>
                  </div>
                  {target > 0 && <PercentBar value={progress} className="mt-2" />}
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" onClick={() => { setPayFor(w); setPayForm({ amount_kes: "", source: "savings", notes: "" }); }}>
                      <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-bold flex items-center gap-2"><Hammer className="h-4 w-4 text-brand-green" /> Group developments</h3>
          <p className="text-xs text-muted-foreground">Weekly progress on what the group is building together.</p>
          <div className="mt-4 space-y-3">
            {(data.dev ?? []).length === 0 && <div className="text-sm text-muted-foreground">No development updates yet.</div>}
            {(data.dev ?? []).map((d: any) => (
              <div key={d.id} className="border border-border rounded-lg p-3">
                <div className="font-semibold">{d.title}</div>
                {d.description && <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{d.log_date}</span>
                  <span className="font-semibold">KES {d.amount_kes.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {contributions.length > 0 && (
        <Card className="p-6">
          <h3 className="font-display font-bold">Your welfare payments</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Source</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-left py-2 pl-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map(c => (
                  <tr key={c.id} className="border-b border-border/60">
                    <td className="py-2">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="py-2 capitalize">{c.source}</td>
                    <td className="py-2 text-right tabular-nums">KES {c.amount_kes.toLocaleString()}</td>
                    <td className="py-2 pl-3">
                      {c.status === "pending" && <Badge variant="outline">Pending</Badge>}
                      {c.status === "approved" && <Badge variant="outline" className="bg-success/15 text-success border-success/20">Approved</Badge>}
                      {c.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-display font-bold">Your weekly records</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left py-2">Week</th>
                <th className="text-left py-2">Attendance</th>
                <th className="text-right py-2">Savings</th>
                <th className="text-right py-2">Group dev.</th>
                <th className="text-right py-2">Weekly levy</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No records yet</td></tr>}
              {records.map(r => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="py-2">{r.week_start}</td>
                  <td className="py-2 capitalize">{r.attendance}</td>
                  <td className="py-2 text-right tabular-nums">KES {r.savings_kes.toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums">KES {r.contribution_kes.toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums">KES {r.development_kes.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!payFor} onOpenChange={(v) => { if (!v) setPayFor(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Contribute to: {payFor?.title}</DialogTitle></DialogHeader>
          <form onSubmit={submitPay} className="space-y-3">
            <div className="space-y-1">
              <Label>Payment source</Label>
              <Select value={payForm.source} onValueChange={(v: PaymentSource) => setPayForm({ ...payForm, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Deduct from my savings (KES {savings.toLocaleString()} available)</SelectItem>
                  <SelectItem value="mpesa">M-Pesa (record now, official confirms)</SelectItem>
                  <SelectItem value="card">Card (record now, official confirms)</SelectItem>
                  <SelectItem value="bank">Bank transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
              {payForm.source !== "savings" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ask your group official for the {payForm.source} details. Real gateway integration is coming — for now this is logged as a request.
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Amount (KES)</Label>
              <Input type="number" min="1" required value={payForm.amount_kes} onChange={e => setPayForm({ ...payForm, amount_kes: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea rows={2} value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} placeholder="M-Pesa reference, etc." />
            </div>
            <DialogFooter><Button type="submit" className="w-full">Submit payment</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
