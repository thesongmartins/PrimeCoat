import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { publicEnv, requireServerEnv } from "@/lib/env";

/**
 * Service-role client. Bypasses RLS.
 * Allowed uses only: scripts (seed, verify-rls) and lib/orders/mark-email-status.ts.
 * Never import from anything reachable by the browser bundle.
 */
export function createAdminClient() {
  return createSupabaseClient(publicEnv.supabaseUrl, requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
