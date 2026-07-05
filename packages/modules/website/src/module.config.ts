import { defineModule } from "@ajh/config";
import { z } from "zod";

export const manifest = defineModule({
  slug: "website",
  name: "Website",
  description: "Your website's uptime, domain and hosting at a glance.",
  version: "0.1.0",
  configSchema: z.object({
    pingPath: z.string().default("/"),
  }),
  navItems: {
    client: [{ label: "Website", href: "/m/website" }],
    agency: [],
  },
});
