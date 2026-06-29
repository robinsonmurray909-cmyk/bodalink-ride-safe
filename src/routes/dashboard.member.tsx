import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PercentBar } from "@/components/PercentBar";
import { store, session, attendanceRate, savingsTotal, savingsProgress, type Member } from "@/lib/bodalink-data";
import { Calendar, Wallet, TrendingUp, Bike } from "lucide-react";

export const Route = createFileRoute("/dashboard/member")({
  ssr: false,
  component: MemberDashboard,
});

function MemberDashboard() {
  const [me, setMe] = useState<Member | null>(null);
  const user = session.get();
  const group = user?.groupId ? store.getGroup(user.groupId) : null;

  useEffect(() => {
    if (!user) return;
    const all = store.getMembers();
    const match = all.find(m => m.phone === user.phone) ?? all[0];
    setMe(match ?? null);
  }, [user]);

  if (!me || !group) return null;

  const rate = attendanceRate(me);
  const total = savingsTotal(me);
  const progress = savingsProgress(me);
  const remaining = me.targetSavings - total;
  const weeksElapsed = me.savings.filter(s => s > 0).length;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-secondary to-secondary/90 text-secondary-foreground border-secondary">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <Bike className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-secondary-foreground/70">Member of</div>
            <div className="font-display text-xl font-bold">{group.name}</div>
            <div className="text-sm text-secondary-foreground/70">Plate {me.plate} · joined {me.joinedAt}</div>
          </div>
          <div className="ml-auto">
            <Badge className="bg-success/20 text-success border-success/30" variant="outline">Active</Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance */}
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Calendar className="h-5 w-5" /></div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Weekly attendance</div>
              <h2 className="font-display text-xl font-bold">Last 12 weeks</h2>
            </div>
          </div>
          <div className="mt-6"><PercentBar value={rate} label="Attendance rate" /></div>
          <div className="mt-6 grid grid-cols-12 gap-1.5">
            {me.attendance.map((v, i) => {
              const bg = v === 1 ? "bg-success" : v === 0.5 ? "bg-warning" : "bg-destructive";
              return <div key={i} className={`h-10 rounded ${bg}`} title={`Week ${i + 1}: ${v === 1 ? "Present" : v === 0.5 ? "Apology" : "Absent"}`} />;
            })}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Present</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> Apology</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> Absent</span>
          </div>
        </Card>

        {/* Savings */}
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Wallet className="h-5 w-5" /></div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Year-end savings</div>
              <h2 className="font-display text-xl font-bold">Closing date: 20 Dec</h2>
            </div>
          </div>
          <div className="mt-6"><PercentBar value={progress} label="Progress to target" /></div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-muted/60 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Saved so far</div>
              <div className="mt-1 font-display text-2xl font-bold tabular-nums">KES {total.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">over {weeksElapsed} weeks</div>
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Remaining</div>
              <div className="mt-1 font-display text-2xl font-bold tabular-nums">KES {Math.max(0, remaining).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">target KES {me.targetSavings.toLocaleString()}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent weeks */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><TrendingUp className="h-5 w-5" /></div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Weekly contributions</div>
            <h2 className="font-display text-xl font-bold">Last 12 weeks</h2>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-12 gap-2 items-end h-32">
          {me.savings.slice(Math.max(0, weeksElapsed - 12), weeksElapsed).map((amt, i) => {
            const max = Math.max(...me.savings) || 1;
            const h = Math.max(8, (amt / max) * 100);
            return (
              <div key={i} className="flex flex-col items-center gap-1 group">
                <div className="w-full rounded-t bg-primary/80 group-hover:bg-primary transition-colors" style={{ height: `${h}%` }} title={`KES ${amt}`} />
                <div className="text-[10px] text-muted-foreground">W{weeksElapsed - 11 + i}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
