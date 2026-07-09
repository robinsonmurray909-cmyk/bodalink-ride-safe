import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_members_by_region",
  title: "List members by region (main officials)",
  description:
    "Return every BodaLink member across all groups, optionally filtered by region. Restricted to authenticated users holding the `main` role.",
  inputSchema: {
    region: z.string().optional().describe("Optional region name to filter by (exact match)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ region }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return { content: [{ type: "text", text: "Backend not configured" }], isError: true };
    }
    const client = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Enforce main-official role server-side
    const { data: isMain, error: roleErr } = await client.rpc("has_role", {
      _user_id: ctx.getUserId(),
      _role: "main",
    });
    if (roleErr) return { content: [{ type: "text", text: roleErr.message }], isError: true };
    if (!isMain) {
      return {
        content: [{ type: "text", text: "Forbidden: main-official role required." }],
        isError: true,
      };
    }

    let groupsQ = client.from("groups").select("id,name,region,stage");
    if (region) groupsQ = groupsQ.eq("region", region);
    const { data: groups, error: gErr } = await groupsQ;
    if (gErr) return { content: [{ type: "text", text: gErr.message }], isError: true };

    const groupIds = (groups ?? []).map((g) => g.id);
    if (groupIds.length === 0) {
      return {
        content: [{ type: "text", text: JSON.stringify([]) }],
        structuredContent: { members: [] },
      };
    }

    const { data: members, error: mErr } = await client
      .from("group_members")
      .select("id,group_id,full_name,phone,national_id,plate,status")
      .in("group_id", groupIds)
      .order("full_name");
    if (mErr) return { content: [{ type: "text", text: mErr.message }], isError: true };

    const groupById = new Map((groups ?? []).map((g) => [g.id, g]));
    const enriched = (members ?? []).map((m) => {
      const g = groupById.get(m.group_id);
      return {
        ...m,
        group_name: g?.name ?? null,
        region: g?.region ?? null,
        stage: g?.stage ?? null,
      };
    });

    return {
      content: [{ type: "text", text: JSON.stringify(enriched) }],
      structuredContent: { members: enriched, count: enriched.length },
    };
  },
});
