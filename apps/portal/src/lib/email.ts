import "server-only";
import { render } from "@react-email/components";
import { Resend } from "resend";
import { WelcomePortalInvite } from "@ajh/email";
import { createSupabaseAdminClient } from "./supabase/admin";

export interface SendInviteOptions {
  to: string;
  recipientName?: string | null;
  clientName: string;
  clientId: string;
  inviteUrl: string;
  primaryColor?: string;
}

/** Sends the welcome_portal_invite email via Resend and records it in email_log. */
export async function sendWelcomePortalInvite(opts: SendInviteOptions): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("Email is not configured: set RESEND_API_KEY and EMAIL_FROM in the root .env.");
  }

  const resend = new Resend(apiKey);
  const html = await render(
    WelcomePortalInvite({
      recipientName: opts.recipientName,
      clientName: opts.clientName,
      inviteUrl: opts.inviteUrl,
      primaryColor: opts.primaryColor,
    }),
  );

  const { data, error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: `Your ${opts.clientName} client portal is ready`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);

  const admin = createSupabaseAdminClient();
  const logged = await admin.from("email_log").insert({
    client_id: opts.clientId,
    template: "welcome_portal_invite",
    to_email: opts.to,
    resend_id: data?.id ?? null,
    status: "sent",
  });
  if (logged.error) console.error(`email_log insert failed: ${logged.error.message}`);

  return data?.id ?? null;
}
