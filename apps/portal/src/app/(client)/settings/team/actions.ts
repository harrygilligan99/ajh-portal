"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { emailSchema } from "@ajh/config";
import { type ActionState } from "@/lib/action-state";
import { getSessionContext } from "@/lib/auth";
import { brandingFromClient } from "@/lib/branding";
import { sendWelcomePortalInvite } from "@/lib/email";
import { appUrl } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(120),
  email: emailSchema,
});

export async function inviteClientMember(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx || ctx.profile.role !== "client_owner" || !ctx.profile.client_id) {
    return { ok: false, message: "Only the portal owner can invite teammates." };
  }

  const parsed = schema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const { fullName, email } = parsed.data;

  const admin = createSupabaseAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("*")
    .eq("id", ctx.profile.client_id)
    .single();
  if (!client) return { ok: false, message: "Your client record could not be loaded." };

  const invite = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      data: { role: "client_member", client_id: client.id, full_name: fullName },
      redirectTo: `${appUrl()}/auth/callback`,
    },
  });
  if (invite.error) {
    // Don't reveal whether the address already has an account — that would let a
    // client_owner probe arbitrary emails across tenants. Mirror the neutral
    // success response instead.
    if (/already|registered|exists/i.test(invite.error.message)) {
      return { ok: true, message: `Invite sent to ${email}.` };
    }
    return { ok: false, message: `Could not create the invite: ${invite.error.message}` };
  }

  const tokenHash = invite.data.properties?.hashed_token;
  if (!tokenHash) return { ok: false, message: "Invite link could not be generated." };
  const inviteUrl = `${appUrl()}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=invite&next=/dashboard`;

  try {
    await sendWelcomePortalInvite({
      to: email,
      recipientName: fullName,
      clientName: client.name,
      clientId: client.id,
      inviteUrl,
      primaryColor: brandingFromClient(client).primary_color,
    });
  } catch (err) {
    // Roll back the half-created user so the invite can be retried cleanly.
    await admin.auth.admin.deleteUser(invite.data.user.id);
    return {
      ok: false,
      message: err instanceof Error ? err.message : "The invite email could not be sent.",
    };
  }

  await admin.from("activity_log").insert({
    client_id: client.id,
    actor_id: ctx.user.id,
    verb: "team.member_invited",
    subject_type: "profile",
    subject_id: invite.data.user.id,
  });

  revalidatePath("/settings/team");
  return { ok: true, message: `Invite sent to ${email}.` };
}
