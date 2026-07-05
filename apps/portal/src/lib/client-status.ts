import type { ClientStatus } from "@ajh/db";

type BadgeVariant = "default" | "secondary" | "outline" | "success" | "destructive";

export const CLIENT_STATUS_VARIANT: Record<ClientStatus, BadgeVariant> = {
  lead: "outline",
  onboarding: "secondary",
  active: "success",
  paused: "outline",
  archived: "destructive",
};

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  lead: "Lead",
  onboarding: "Onboarding",
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};
