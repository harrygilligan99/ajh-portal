import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type * from "./types";
export type { Database };

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Service-role client — bypasses RLS. Server-side only; callers are
 * responsible for never letting the key reach the browser.
 */
export function createServiceClient(url: string, serviceRoleKey: string): TypedSupabaseClient {
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
