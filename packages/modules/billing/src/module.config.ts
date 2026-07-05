import { defineModule } from "@ajh/config";
import { z } from "zod";

export const manifest = defineModule({
  slug: "billing",
  name: "Billing",
  description: "Invoices, your current plan and secure card management.",
  version: "0.1.0",
  configSchema: z.object({
    showUpgradeCta: z.boolean().default(true),
  }),
  navItems: {
    client: [{ label: "Billing", href: "/m/billing" }],
    agency: [],
  },
});
