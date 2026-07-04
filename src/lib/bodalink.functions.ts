import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============ Member (signed-in rider) ============

export const getMyOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: memberRow } = await supabase
      .from("group_members")
      .select("*, groups(*)")
      .eq("user_id", userId)
      .maybeSingle();
    if (!memberRow) return { member: null, group: null, records: [], welfare: [], dev: [], contributions: [], adjustments: [], official: null };

    const groupId = memberRow.group_id;
    const [{ data: records }, { data: welfare }, { data: dev }, { data: officialUser }, { data: contributions }, { data: adjustments }] = await Promise.all([
      supabase.from("weekly_records").select("*").eq("member_id", memberRow.id).order("week_start", { ascending: false }).limit(52),
      supabase.from("welfare_events").select("*").eq("group_id", groupId).order("event_date", { ascending: false }).limit(20),
      supabase.from("development_logs").select("*").eq("group_id", groupId).order("log_date", { ascending: false }).limit(20),
      supabase.from("profiles").select("full_name, phone").eq("id", (memberRow as any).groups.official_id ?? "").maybeSingle(),
      supabase.from("welfare_contributions").select("*").eq("member_id", memberRow.id).order("created_at", { ascending: false }),
      supabase.from("savings_adjustments").select("*").eq("member_id", memberRow.id).order("created_at", { ascending: false }),
    ]);
    return {
      member: memberRow,
      group: (memberRow as any).groups,
      records: records ?? [],
      welfare: welfare ?? [],
      dev: dev ?? [],
      contributions: contributions ?? [],
      adjustments: adjustments ?? [],
      official: officialUser ?? null,
    };
  });

// ============ Group official ============

export const getOfficialOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: group } = await supabase.from("groups").select("*").eq("official_id", userId).maybeSingle();
    if (!group) return { group: null, members: [], welfare: [], dev: [], records: [], contributions: [], adjustments: [], totals: null };
    const [{ data: members }, { data: welfare }, { data: dev }, { data: records }, { data: contributions }, { data: adjustments }] = await Promise.all([
      supabase.from("group_members").select("*").eq("group_id", group.id).order("full_name"),
      supabase.from("welfare_events").select("*").eq("group_id", group.id).order("event_date", { ascending: false }).limit(50),
      supabase.from("development_logs").select("*").eq("group_id", group.id).order("log_date", { ascending: false }).limit(50),
      supabase.from("weekly_records").select("*").eq("group_id", group.id).order("week_start", { ascending: false }).limit(500),
      supabase.from("welfare_contributions").select("*").eq("group_id", group.id).order("created_at", { ascending: false }).limit(200),
      supabase.from("savings_adjustments").select("*").eq("group_id", group.id).order("created_at", { ascending: false }).limit(500),
    ]);

    const recs = records ?? [];
    const adjs = adjustments ?? [];
    const wf = welfare ?? [];
    const wcApproved = (contributions ?? []).filter(c => c.status === "approved");
    const totals = {
      members: (members ?? []).filter(m => m.status === "active").length,
      weekly_records: recs.length,
      // Group dev is mandatory & non-refundable — from weekly records only, NOT welfare contributions
      group_dev_fund: recs.reduce((s, r) => s + (r.contribution_kes || 0), 0),
      welfare_collected_from_savings: wcApproved.filter(c => c.source === "savings").reduce((s, c) => s + c.amount_kes, 0),
      dev_levy: recs.reduce((s, r) => s + (r.development_kes || 0), 0),
      welfare_paid: wf.reduce((s, w) => s + (w.amount_kes || 0), 0),
      welfare_collected: wf.reduce((s, w) => s + (w.collected_kes || 0), 0),
      pending_contributions: (contributions ?? []).filter(c => c.status === "pending").length,
    };
    return { group, members: members ?? [], welfare: wf, dev: dev ?? [], records: recs, contributions: contributions ?? [], adjustments: adjs, totals };
  });

export const addMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    group_id: z.string().uuid(),
    full_name: z.string().min(2).max(100),
    phone: z.string().min(7).max(20),
    national_id: z.string().min(4).max(20),
    plate: z.string().min(3).max(20),
    target_savings: z.number().int().min(0).optional(),
    target_contributions: z.number().int().min(0).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase.from("group_members").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateMemberStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["active", "suspended", "removed"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("group_members").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const recordWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    member_id: z.string().uuid(),
    group_id: z.string().uuid(),
    week_start: z.string(),
    attendance: z.enum(["present", "apology", "absent"]),
    savings_kes: z.number().int().min(0).default(0),
    contribution_kes: z.number().int().min(0).default(0),
    development_kes: z.number().int().min(0).default(0),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("weekly_records")
      .upsert({ ...data, recorded_by: context.userId }, { onConflict: "member_id,week_start" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const logWelfare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    group_id: z.string().uuid(),
    beneficiary_member_id: z.string().uuid().optional().nullable(),
    category: z.enum(["death", "accident", "illness", "other"]),
    title: z.string().min(2).max(200),
    details: z.string().max(2000).optional().nullable(),
    amount_kes: z.number().int().min(0).default(0),
    event_date: z.string(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("welfare_events")
      .insert({ ...data, recorded_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const logDevelopment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    group_id: z.string().uuid(),
    title: z.string().min(2).max(200),
    description: z.string().max(2000).optional().nullable(),
    amount_kes: z.number().int().min(0).default(0),
    log_date: z.string(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("development_logs")
      .insert({ ...data, recorded_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ Welfare payment flow ============

export const requestWelfarePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    welfare_event_id: z.string().uuid(),
    amount_kes: z.number().int().min(1),
    source: z.enum(["savings", "mpesa", "card", "bank", "paypal", "cash"]),
    notes: z.string().max(500).optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Find the member row for this user
    const { data: member } = await supabase.from("group_members").select("id, group_id").eq("user_id", userId).maybeSingle();
    if (!member) throw new Error("You are not registered in a group");
    const { data: event } = await supabase.from("welfare_events").select("group_id").eq("id", data.welfare_event_id).maybeSingle();
    if (!event) throw new Error("Welfare case not found");
    if (event.group_id !== member.group_id) throw new Error("Not your group's welfare case");

    const { error } = await supabase.from("welfare_contributions").insert({
      welfare_event_id: data.welfare_event_id,
      member_id: member.id,
      group_id: member.group_id,
      amount_kes: data.amount_kes,
      source: data.source,
      status: "pending",
      notes: data.notes ?? null,
      requested_by: userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const approveWelfarePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    contribution_id: z.string().uuid(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: c } = await supabase.from("welfare_contributions")
      .select("*, welfare_events(collected_kes, amount_kes, title)")
      .eq("id", data.contribution_id).maybeSingle();
    if (!c) throw new Error("Contribution not found");
    if (c.status !== "pending") throw new Error("Already processed");

    // If source is savings, insert a negative savings_adjustment
    if (c.source === "savings") {
      const { error: aErr } = await supabase.from("savings_adjustments").insert({
        member_id: c.member_id,
        group_id: c.group_id,
        amount_kes: -Math.abs(c.amount_kes),
        reason: `Welfare payment: ${(c as any).welfare_events?.title ?? "case"}`,
        welfare_contribution_id: c.id,
        recorded_by: userId,
      });
      if (aErr) throw new Error(aErr.message);
    }

    // Mark contribution approved
    const { error: uErr } = await supabase.from("welfare_contributions")
      .update({ status: "approved", approved_by: userId, approved_at: new Date().toISOString() })
      .eq("id", c.id);
    if (uErr) throw new Error(uErr.message);

    // Bump welfare_event collected_kes
    const newCollected = ((c as any).welfare_events?.collected_kes ?? 0) + c.amount_kes;
    await supabase.from("welfare_events").update({ collected_kes: newCollected }).eq("id", c.welfare_event_id);

    return { ok: true };
  });

export const rejectWelfarePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    contribution_id: z.string().uuid(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("welfare_contributions")
      .update({ status: "rejected", approved_by: context.userId, approved_at: new Date().toISOString() })
      .eq("id", data.contribution_id).eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const recordExternalWelfarePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    welfare_event_id: z.string().uuid(),
    member_id: z.string().uuid(),
    amount_kes: z.number().int().min(1),
    source: z.enum(["mpesa", "card", "bank", "paypal", "cash"]),
    notes: z.string().max(500).optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: member } = await supabase.from("group_members").select("group_id").eq("id", data.member_id).maybeSingle();
    if (!member) throw new Error("Member not found");
    const { data: inserted, error } = await supabase.from("welfare_contributions").insert({
      welfare_event_id: data.welfare_event_id,
      member_id: data.member_id,
      group_id: member.group_id,
      amount_kes: data.amount_kes,
      source: data.source,
      status: "approved",
      notes: data.notes ?? null,
      requested_by: userId,
      approved_by: userId,
      approved_at: new Date().toISOString(),
    }).select("id").single();
    if (error) throw new Error(error.message);

    const { data: ev } = await supabase.from("welfare_events").select("collected_kes").eq("id", data.welfare_event_id).maybeSingle();
    await supabase.from("welfare_events").update({ collected_kes: (ev?.collected_kes ?? 0) + data.amount_kes }).eq("id", data.welfare_event_id);
    void inserted;
    return { ok: true };
  });

// ============ Main official (regional oversight) ============

export const getMainOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isMain } = await supabase.rpc("has_role", { _user_id: userId, _role: "main" });
    if (!isMain) throw new Error("Forbidden");
    const [{ data: groups }, { data: members }, { data: records }, { data: welfare }, { data: contributions }, { data: adjustments }] = await Promise.all([
      supabase.from("groups").select("*").order("region"),
      supabase.from("group_members").select("*").order("full_name"),
      supabase.from("weekly_records").select("group_id, savings_kes, contribution_kes, development_kes"),
      supabase.from("welfare_events").select("group_id, amount_kes, collected_kes"),
      supabase.from("welfare_contributions").select("group_id, amount_kes, status"),
      supabase.from("savings_adjustments").select("group_id, amount_kes"),
    ]);
    const recs = records ?? [];
    const adjs = adjustments ?? [];
    const wf = welfare ?? [];
    const wcApproved = (contributions ?? []).filter(c => c.status === "approved");
    const totals = {
      members: (members ?? []).filter(m => m.status === "active").length,
      weekly_records: recs.length,
      savings: recs.reduce((s, r) => s + (r.savings_kes || 0), 0) + adjs.reduce((s, a) => s + (a.amount_kes || 0), 0),
      group_dev_fund: recs.reduce((s, r) => s + (r.contribution_kes || 0), 0) + wcApproved.reduce((s, c) => s + (c.amount_kes || 0), 0),
      dev_levy: recs.reduce((s, r) => s + (r.development_kes || 0), 0),
      welfare_paid: wf.reduce((s, w) => s + (w.amount_kes || 0), 0),
    };
    return { groups: groups ?? [], members: members ?? [], records: recs, welfare: wf, contributions: contributions ?? [], adjustments: adjs, totals };
  });

// ============ Sign-up support ============

export const claimGroupAsOfficial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ group_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: group } = await supabaseAdmin.from("groups").select("official_id").eq("id", data.group_id).maybeSingle();
    if (!group) throw new Error("Group not found");
    if (group.official_id && group.official_id !== userId) {
      throw new Error("This group already has a registered official");
    }
    const { error: gErr } = await supabaseAdmin.from("groups").update({ official_id: userId }).eq("id", data.group_id);
    if (gErr) throw new Error(gErr.message);
    await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "official" }, { onConflict: "user_id,role" });
    return { ok: true };
  });

export const registerAsMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    group_id: z.string().uuid(),
    full_name: z.string().min(2),
    phone: z.string().min(7),
    national_id: z.string().min(4),
    plate: z.string().min(3),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const existing = await supabaseAdmin.from("group_members").select("id").eq("user_id", userId).maybeSingle();
    if (existing.data) throw new Error("You are already registered in a group");
    const { error } = await supabaseAdmin.from("group_members").insert({ ...data, user_id: userId });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "member" }, { onConflict: "user_id,role" });
    void supabase;
    return { ok: true };
  });

export const claimMainOfficial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ invite_code: z.string().min(4) }).parse(d))
  .handler(async ({ data, context }) => {
    const expected = process.env.MAIN_OFFICIAL_INVITE_CODE || "BODALINK-MAIN-2026";
    if (data.invite_code !== expected) throw new Error("Invalid invite code");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").upsert({ user_id: context.userId, role: "main" }, { onConflict: "user_id,role" });
    return { ok: true };
  });
