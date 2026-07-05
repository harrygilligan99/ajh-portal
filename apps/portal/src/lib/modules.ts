import type { ComponentType } from "react";
import {
  enabledModulesSchema,
  type ModuleManifest,
  type ModuleSlug,
  type NavItem,
} from "@ajh/config";
import type { ClientRow } from "@ajh/db";
import * as billing from "@ajh/module-billing";
import * as documents from "@ajh/module-documents";
import * as marketing from "@ajh/module-marketing";
import * as messages from "@ajh/module-messages";
import * as onboarding from "@ajh/module-onboarding";
import * as requests from "@ajh/module-requests";
import * as website from "@ajh/module-website";

export interface LoadedModule {
  manifest: ModuleManifest;
  ClientRoot: ComponentType;
  AgencyRoot: ComponentType;
}

/** The full catalogue, in client-facing display order. */
export const ALL_MODULES: LoadedModule[] = [
  onboarding,
  requests,
  messages,
  billing,
  marketing,
  documents,
  website,
].map((m) => ({ manifest: m.manifest, ClientRoot: m.ClientRoot, AgencyRoot: m.AgencyRoot }));

export function getModule(slug: string): LoadedModule | null {
  return ALL_MODULES.find((m) => m.manifest.slug === slug) ?? null;
}

/** Parse a client's enabled_modules jsonb; unknown slugs are dropped. */
export function enabledModuleSlugs(client: ClientRow): ModuleSlug[] {
  const parsed = enabledModulesSchema.safeParse(client.enabled_modules);
  return parsed.success ? parsed.data : [];
}

export function enabledModules(client: ClientRow): LoadedModule[] {
  const slugs = enabledModuleSlugs(client);
  return ALL_MODULES.filter((m) => slugs.includes(m.manifest.slug));
}

export function clientNavItems(client: ClientRow): NavItem[] {
  return enabledModules(client).flatMap((m) => m.manifest.navItems.client);
}

export function agencyNavItems(): NavItem[] {
  return ALL_MODULES.flatMap((m) => m.manifest.navItems.agency);
}
