import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

export default defineTool({
  name: "list_groups",
  title: "List BodaLink groups",
  description: "Return all public BodaLink boda boda groups with their region and stage.",
  inputSchema: {
    region: z.string().optional().describe("Optional region name to filter by."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ region }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return { content: [{ type: "text", text: "Backend not configured" }], isError: true };
    }
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    let q = client.from("groups").select("id,name,region,stage").order("region");
    if (region) q = q.eq("region", region);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { groups: data ?? [] },
    };
  },
});
