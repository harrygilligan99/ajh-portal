import { defineModule } from "@ajh/config";
import { z } from "zod";

export const manifest = defineModule({
  slug: "requests",
  name: "Requests",
  description: "Raise website update requests, track progress and approve previews.",
  version: "0.1.0",
  configSchema: z.object({
    defaultPriority: z.enum(["low", "normal", "urgent"]).default("normal"),
  }),
  navItems: {
    client: [{ label: "Requests", href: "/m/requests" }],
    agency: [{ label: "Requests board", href: "/admin/m/requests" }],
  },
});
