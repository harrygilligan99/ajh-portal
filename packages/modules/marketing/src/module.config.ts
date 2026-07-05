import { defineModule } from "@ajh/config";
import { z } from "zod";

export const manifest = defineModule({
  slug: "marketing",
  name: "Marketing",
  description: "Ad performance reporting — spend, clicks, impressions and leads.",
  version: "0.1.0",
  configSchema: z.object({
    showLeadsChart: z.boolean().default(true),
  }),
  navItems: {
    client: [{ label: "Marketing", href: "/m/marketing" }],
    agency: [{ label: "Ad spend", href: "/admin/m/marketing" }],
  },
});
