"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { clientPlanSchema, emailSchema, isAgencyRole, slugify } from "@ajh/config";
import { type ActionState } from "@/lib/action-state";
import { getSessionContext } from "@/lib/auth";
import { sendWelcomePortalInvite } from "@/lib/email";
import { appUrl } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().trim().min(2, "Business name is required").max(120),
  ownerName: z.string().trim().min(1, "Owner name is required").max(120),
  ownerEmail: emailSchema,
  plan: clientPlanSchema,
});

export async function createClientWithOwner(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx || !isAgencyRole(ctx.profile.role)) {
    return { ok: false, message: "Agency access required." };
  }

  const parsed = schema.safeParse({
    name: formData.get("name"),
    ownerName: formData.get("ownerName"),
    ownerEmail: formData.get("ownerEmail"),
    plan: formData.get("plan"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const { name, ownerName, ownerEmail, plan } = parsed.data;

  const admin = createSupabaseAdminClient();

  // Insert with base slug, then base-2, base-3 … retrying only on a unique
  // violation (23505). The atomic insert-and-retry closes the TOCTOU race a
  // pre-check would leave open and never inserts an unverified slug.
  const base = slugify(name);
  if (!base) return { ok: false, message: "That business name doesn't produce a usable slug." };

  let client: { id: string; name: string } | null = null;
  for (let attempt = 0; attempt < 8 && !client; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const res = await admin
      .from("clients")
      .insert({ name, slug, plan, status: "lead" })
      .select("id, name")
      .single();
    if (!res.error) {
      client = res.data;
      break;
    }
    if (res.error.code !== "23505") {
      return { ok: false, message: `Could not create the client: ${res.error.message}` };
    }
    // slug taken → try the next suffix
  }
  if (!client) {
    return {
      ok: false,
      message: "Couldn't find a free URL for that name — try a more specific business name.",
    };
  }

  const rollbackClient = async () => {
    await admin.from("clients").delete().eq("id", client.id);
  };

  const invite = await admin.auth.admin.generateLink({
    type: "invite",
    email: ownerEmail,
    options: {
      data: { role: "client_owner", client_id: client.id, full_name: ownerName },
      redirectTo: `${appUrl()}/auth/callback`,
    },
  });
  if (invite.error) {
    await rollbackClient();
    const already = /already/i.test(invite.error.message);
    return {
      ok: false,
      message: already
        ? "That email already has a portal account — use a different owner email."
        : `Could not create the owner invite: ${invite.error.message}`,
    };
  }

  const tokenHash = invite.data.properties?.hashed_token;
  if (!tokenHash) {
    await admin.auth.admin.deleteUser(invite.data.user.id);
    await rollbackClient();
    return { ok: false, message: "Invite link could not be generated." };
  }
  const inviteUrl = `${appUrl()}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=invite&next=/dashboard`;

  try {
    await sendWelcomePortalInvite({
      to: ownerEmail,
      recipientName: ownerName,
      clientName: client.name,
      clientId: client.id,
      inviteUrl,
    });
  } catch (err) {
    await admin.auth.admin.deleteUser(invite.data.user.id);
    await rollbackClient();
    return {
      ok: false,
      message:
        err instanceof Error
          ? `Client rolled back — the invite email failed: ${err.message}`
          : "Client rolled back — the invite email failed.",
    };
  }

  await admin.from("activity_log").insert({
    client_id: client.id,
    actor_id: ctx.user.id,
    verb: "client.created",
    subject_type: "client",
    subject_id: client.id,
  });

  redirect("/admin/clients?invited=1");
}
