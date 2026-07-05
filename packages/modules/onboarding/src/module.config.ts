import { defineModule } from "@ajh/config";
import { z } from "zod";

export const manifest = defineModule({
  slug: "onboarding",
  name: "Onboarding",
  description: "Get set up with AJH: business details, brand assets, account access and your contract.",
  version: "0.1.0",
  configSchema: z.object({
    nudgeAfterDays: z.number().int().min(1).max(14).default(3),
  }),
  navItems: {
    client: [{ label: "Onboarding", href: "/m/onboarding" }],
    agency: [],
  },
});
