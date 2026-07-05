"use server";

import { z } from "zod";
import { emailSchema } from "@ajh/config";
import { type ActionState } from "@/lib/action-state";
import { appUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ email: emailSchema });

const NEUTRAL_MESSAGE =
  "If that address has portal access, a sign-in link is on its way. It can take a minute to arrive.";

export async function sendMagicLink(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${appUrl()}/auth/callback`,
      // Portal access is invite-only; unknown emails must not create accounts.
      shouldCreateUser: false,
    },
  });

  // "Signups not allowed" means the email has no account — reply identically
  // so the form can't be used to probe which addresses exist.
  if (error && !/signup/i.test(error.message)) {
    console.error(`signInWithOtp failed: ${error.message}`);
    return { ok: false, message: "Something went wrong sending your link. Please try again." };
  }

  return { ok: true, message: NEUTRAL_MESSAGE };
}
