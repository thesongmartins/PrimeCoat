import "server-only";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/**
 * The access token from `Authorization: Bearer <jwt>`, sent by the mobile app (which has no
 * cookies). Null for browser requests, which authenticate with the session cookie.
 */
export async function bearerToken(): Promise<string | null> {
  const value = (await headers()).get("authorization");
  return value?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? null;
}

/**
 * Server client for Server Components, Route Handlers and Server Actions.
 * Uses the anon key + the user's cookies (or Bearer token), so every query runs under RLS as that user.
 */
export async function createClient() {
  const token = await bearerToken();
  if (token) {
    return createSupabaseClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }

  const cookieStore = await cookies();
  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // proxy.ts refreshes the session and writes cookies on the response instead.
        }
      },
    },
  });
}
