import { z } from "zod";

// ── Module system ────────────────────────────────────────────────────────────

export const MODULE_SLUGS = [
  "onboarding",
  "requests",
  "messages",
  "billing",
  "marketing",
  "documents",
  "website",
] as const;

export type ModuleSlug = (typeof MODULE_SLUGS)[number];

export const moduleSlugSchema = z.enum(MODULE_SLUGS);

export interface NavItem {
  label: string;
  href: string;
}

export interface ModuleManifest<TConfig extends z.ZodType = z.ZodType> {
  slug: ModuleSlug;
  name: string;
  description: string;
  version: string;
  /** zod schema for this module's per-tenant configuration */
  configSchema: TConfig;
  navItems: {
    client: NavItem[];
    agency: NavItem[];
  };
}

export function defineModule<TConfig extends z.ZodType>(
  manifest: ModuleManifest<TConfig>,
): ModuleManifest<TConfig> {
  return manifest;
}

/** JSON-serialisable registry entry derived from a manifest. */
export function manifestToRegistryEntry(manifest: ModuleManifest) {
  return {
    slug: manifest.slug,
    name: manifest.name,
    description: manifest.description,
    version: manifest.version,
    navItems: manifest.navItems,
    configSchema: z.toJSONSchema(manifest.configSchema),
  };
}

// ── Tenant config ────────────────────────────────────────────────────────────

export const CLIENT_STATUSES = [
  "lead",
  "onboarding",
  "active",
  "paused",
  "archived",
] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];
export const clientStatusSchema = z.enum(CLIENT_STATUSES);

export const CLIENT_PLANS = ["starter", "standard", "pro"] as const;
export type ClientPlan = (typeof CLIENT_PLANS)[number];
export const clientPlanSchema = z.enum(CLIENT_PLANS);

export const brandingSchema = z.object({
  logo_url: z.url().nullable().default(null),
  primary_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a #rrggbb hex colour")
    .default("#0f172a"),
});
export type Branding = z.infer<typeof brandingSchema>;

export const enabledModulesSchema = z.array(moduleSlugSchema);

// ── Shared field schemas (used by server actions) ────────────────────────────

export const emailSchema = z.email("Enter a valid email address");

export const slugSchema = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only");

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const PROFILE_ROLES = [
  "agency_admin",
  "agency_member",
  "client_owner",
  "client_member",
] as const;
export type ProfileRole = (typeof PROFILE_ROLES)[number];
export const profileRoleSchema = z.enum(PROFILE_ROLES);

export function isAgencyRole(role: ProfileRole): boolean {
  return role === "agency_admin" || role === "agency_member";
}
