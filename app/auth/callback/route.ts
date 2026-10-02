import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { sanitizeNextPath } from "@/lib/utils/redirects";
import { logger } from "@/lib/utils/logger";

/**
 * OAuth callback. Supabase redirects here with ?code=… after Google sign-in.
 * Exchanges the code for a session (sets cookies) and sends the user on.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next"));
  const providerError = searchParams.get("error_description") ?? searchParams.get("error");

  if (!isSupabaseConfigured()) {
    logger.error("auth.callback_unconfigured");
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  if (providerError || !code) {
    logger.warn("auth.callback_missing_code", { providerError: providerError ?? "none" });
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    logger.error("auth.exchange_failed", { message: error.message });
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // Respect the proxy/host when deployed behind Vercel.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  const base = !isLocal && forwardedHost ? `https://${forwardedHost}` : origin;
  return NextResponse.redirect(`${base}${next}`);
}
