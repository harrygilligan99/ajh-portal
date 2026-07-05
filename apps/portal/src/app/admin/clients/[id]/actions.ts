"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  MODULE_SLUGS,
  brandingSchema,
  clientPlanSchema,
  clientStatusSchema,
  isAgencyRole,
  moduleSlugSchema,
} from "@ajh/config";
import { type ActionState } from "@/lib/action-state";
import { getSessionContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();

// Empty string → null for optional text fields.
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable();

const settingsSchema = z.object({
  status: clientStatusSchema,
  plan: clientPlanSchema,
  marketing_plan: z.boolean(),
  monthly_update_quota: z.coerce.number().int().min(0).max(999),
  enabled_modules: z.array(moduleSlugSchema),
  primary_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Primary colour must be a #rrggbb hex value"),
  logo_url: z
    .string()
    .trim()
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .refine((v) => v === null || /^https?:\/\//.test(v), "Logo must be an http(s) URL"),
  website_url: optionalText.refine(
    (v) => v === null || /^https?:\/\//.test(v),
    "Website must be an http(s) URL",
  ),
  domain_registrar: optionalText,
  domain_renewal_date: z
    .string()
    .trim()
    .transform((v) => (v.length === 0 ? null : v))
    .nullable(),
  hosting_notes: optionalText,
});

export async function updateClientSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx || !isAgencyRole(ctx.profile.role)) {
    return { ok: false, message: "Agency access required." };
  }

  const clientId = formData.get("clientId");
  if (!uuid.safeParse(clientId).success) {
    return { ok: false, message: "Invalid client reference." };
  }

  const enabled = MODULE_SLUGS.filter((slug) => formData.get(`module:${slug}`) === "on");

  const parsed = settingsSchema.safeParse({
    status: formData.get("status"),
    plan: formData.get("plan"),
    marketing_plan: formData.get("marketing_plan") === "on",
    monthly_update_quota: formData.get("monthly_update_quota"),
    enabled_modules: enabled,
    primary_color: formData.get("primary_color"),
    logo_url: formData.get("logo_url"),
    website_url: formData.get("website_url"),
    domain_registrar: formData.get("domain_registrar"),
    domain_renewal_date: formData.get("domain_renewal_date"),
    hosting_notes: formData.get("hosting_notes"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const v = parsed.data;

  const supabase = await createSupabaseServerClient();

  // Read current status so we can detect the lead → onboarding transition.
  const { data: before } = await supabase
    .from("clients")
    .select("status")
    .eq("id", clientId as string)
    .single();

  const branding = brandingSchema.parse({ logo_url: v.logo_url, primary_color: v.primary_color });

  const { error } = await supabase
    .from("clients")
    .update({
      status: v.status,
      plan: v.plan,
      marketing_plan: v.marketing_plan,
      monthly_update_quota: v.monthly_update_quota,
      enabled_modules: v.enabled_modules,
      branding,
      website_url: v.website_url,
      domain_registrar: v.domain_registrar,
      domain_renewal_date: v.domain_renewal_date,
      hosting_notes: v.hosting_notes,
    })
    .eq("id", clientId as string);
  if (error) {
    return { ok: false, message: `Could not save: ${error.message}` };
  }

  await supabase.from("activity_log").insert({
    client_id: clientId as string,
    actor_id: ctx.user.id,
    verb: "client.settings_updated",
    subject_type: "client",
    subject_id: clientId as string,
  });

  // The welcome sequence fires on status → onboarding; the sequence engine
  // itself lands in Phase 4, so for now we just record the trigger point.
  if (before && before.status !== "onboarding" && v.status === "onboarding") {
    await supabase.from("activity_log").insert({
      client_id: clientId as string,
      actor_id: ctx.user.id,
      verb: "client.onboarding_started",
      subject_type: "client",
      subject_id: clientId as string,
    });
  }

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
  return { ok: true, message: "Settings saved." };
}

const noteSchema = z.object({
  clientId: uuid,
  body: z.string().trim().min(1, "Write a note first").max(5000),
});

export async function addInternalNote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx || !isAgencyRole(ctx.profile.role)) {
    return { ok: false, message: "Agency access required." };
  }

  const parsed = noteSchema.safeParse({
    clientId: formData.get("clientId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("internal_notes").insert({
    client_id: parsed.data.clientId,
    author_id: ctx.user.id,
    body: parsed.data.body,
  });
  if (error) {
    return { ok: false, message: `Could not add note: ${error.message}` };
  }

  revalidatePath(`/admin/clients/${parsed.data.clientId}`);
  return { ok: true, message: "Note added." };
}
