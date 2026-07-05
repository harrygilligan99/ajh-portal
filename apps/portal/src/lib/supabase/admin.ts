import "server-only";
import { createServiceClient, type TypedSupabaseClient } from "@ajh/db";
import { publicEnv } from "../env";

/**
 * Service-role client — bypasses RLS. Only import from server actions /
 * route handlers; "server-only" makes a client-bundle import a build error.
 */
export function createSupabaseAdminClient(): TypedSupabaseClient {
  const { url } = publicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in the root .env (server-side only).");
  }
  return createServiceClient(url, serviceKey);
}
