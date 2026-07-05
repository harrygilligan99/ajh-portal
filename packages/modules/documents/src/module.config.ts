import { defineModule } from "@ajh/config";
import { z } from "zod";

export const manifest = defineModule({
  slug: "documents",
  name: "Documents",
  description: "Your contract, welcome pack and reports in one place.",
  version: "0.1.0",
  configSchema: z.object({}),
  navItems: {
    client: [{ label: "Documents", href: "/m/documents" }],
    agency: [],
  },
});
