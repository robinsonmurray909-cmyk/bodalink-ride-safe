import { defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import listGroupsTool from "./tools/list-groups";

export default defineMcp({
  name: "bodalink-mcp",
  title: "BodaLink MCP",
  version: "0.1.0",
  instructions:
    "Read-only tools for BodaLink. Use `echo` to verify connectivity and `list_groups` to browse public boda boda groups by region.",
  tools: [echoTool, listGroupsTool],
});
