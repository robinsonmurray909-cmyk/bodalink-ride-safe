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
    if (!memberRow) return { member: null, group: null, records: [], welfare: [], dev: [], officials: [] };

    const groupId = memberRow.group_id;
    const [{ data: records }, { data: welfare }, { data: dev }, { data: officialUser }] = await Promise.all([
      supabase.from("weekly_records").select("*").eq("member_id", memberRow.id).order("week_start", { ascending: false }).limit(52),
      supabase.from("welfare_events").select("*").eq("group_id", groupId).order("event_date", { ascending: false }).limit(20),
      supabase.from("development_logs").select("*").eq("group_id", groupId).order("log_date", { ascending: false }).limit(20),
      supabase.from("profiles").select("full_name, phone").eq("id", (memberRow as any).groups.official_id ?? "").maybeSingle(),
    ]);
    return {
      member: memberRow,
      group: (memberRow as any).groups,
      records: records ?? [],
      welfare: welfare ?? [],
      dev: dev ?? [],
      official: officialUser ?? null,
    };
  });

// ============ Group official ============

export const getOfficialOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: group } = await supabase.from("groups").select("*").eq("official_id", userId).maybeSingle();
    if (!group) return { group: null, members: [], welfare: [], dev: [], records: [] };
    const [{ data: members }, { data: welfare }, { data: dev }, { data: records }] = await Promise.all([
      supabase.from("group_members").select("*").eq("group_id", group.id).order("full_name"),
      supabase.from("welfare_events").select("*").eq("group_id", group.id).order("event_date", { ascending: false }).limit(50),
      supabase.from("development_logs").select("*").eq("group_id", group.id).order("log_date", { ascending: false }).limit(50),
      supabase.from("weekly_records").select("*").eq("group_id", group.id).order("week_start", { ascending: false }).limit(500),
    ]);
    return { group, members: members ?? [], welfare: welfare ?? [], dev: dev ?? [], records: records ?? [] };
  });

export const addMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    group_id: z.string().uuid(),
    full_name: z.string().min(2).max(100),
    phone: z.string().min(7).max(20),
    national_id: z.string().min(4).max(20),
    plate: z.string().min(3).max(20),
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

// ============ Main official (regional oversight) ============

export const getMainOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isMain } = await supabase.rpc("has_role", { _user_id: userId, _role: "main" });
    if (!isMain) throw new Error("Forbidden");
    const [{ data: groups }, { data: members }] = await Promise.all([
      supabase.from("groups").select("*").order("region"),
      supabase.from("group_members").select("*").order("full_name"),
    ]);
    return { groups: groups ?? [], members: members ?? [] };
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
    // Insert the member row tied to this user
    const existing = await supabaseAdmin.from("group_members").select("id").eq("user_id", userId).maybeSingle();
    if (existing.data) throw new Error("You are already registered in a group");
    const { error } = await supabaseAdmin.from("group_members").insert({ ...data, user_id: userId });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "member" }, { onConflict: "user_id,role" });
    // also keep supabase reference quiet
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
