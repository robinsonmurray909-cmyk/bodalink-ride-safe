import { auth, defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import listGroupsTool from "./tools/list-groups";
import listMembersByRegionTool from "./tools/list-members";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "bodalink-mcp",
  title: "BodaLink MCP",
  version: "0.2.0",
  instructions:
    "BodaLink tools. `echo` verifies connectivity. `list_groups` browses groups by region. `list_members_by_region` returns every member across all groups (main officials only, requires sign-in).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [echoTool, listGroupsTool, listMembersByRegionTool],
});
