import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isAgencyRole } from "@ajh/config";
import type { ClientRow, ProfileRow } from "@ajh/db";
import { createSupabaseServerClient } from "./supabase/server";

export interface SessionContext {
  user: User;
  profile: ProfileRow;
}

export interface ClientSessionContext extends SessionContext {
  client: ClientRow;
}

/** Current user + profile, or null when signed out / profile missing. */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return { user, profile };
}

/** Gate for /admin — agency roles only. */
export async function requireAgency(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!isAgencyRole(ctx.profile.role)) redirect("/dashboard");
  return ctx;
}

/** Gate for the client portal — client roles with a linked client record. */
export async function requireClient(): Promise<ClientSessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (isAgencyRole(ctx.profile.role)) redirect("/admin");
  if (!ctx.profile.client_id) redirect("/no-access");

  const supabase = await createSupabaseServerClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", ctx.profile.client_id)
    .single();
  if (!client) redirect("/no-access");

  return { ...ctx, client };
}
