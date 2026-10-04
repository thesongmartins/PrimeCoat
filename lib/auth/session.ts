import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  /** "google" or "email" */
  provider: string;
}

/**
 * The signed-in user for the current request, or null. Deduplicated per request via React cache.
 * Reads Google profile fields from user_metadata (full_name / name, avatar_url / picture).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : null);
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: str(meta.full_name) ?? str(meta.name),
    avatarUrl: str(meta.avatar_url) ?? str(meta.picture),
    createdAt: user.created_at,
    provider: typeof user.app_metadata?.provider === "string" ? user.app_metadata.provider : "email",
  };
});
