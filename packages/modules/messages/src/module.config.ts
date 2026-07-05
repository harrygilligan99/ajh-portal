import { defineModule } from "@ajh/config";
import { z } from "zod";

export const manifest = defineModule({
  slug: "messages",
  name: "Messages",
  description: "Message the AJH team — one simple thread for everything.",
  version: "0.1.0",
  configSchema: z.object({
    emailNotifications: z.boolean().default(true),
  }),
  navItems: {
    client: [{ label: "Messages", href: "/m/messages" }],
    agency: [{ label: "Messages", href: "/admin/m/messages" }],
  },
});
