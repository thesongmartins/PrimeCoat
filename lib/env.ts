/**
 * Environment access. Public values are inlined by Next at build time, so they must be
 * referenced as literal `process.env.NEXT_PUBLIC_*` expressions (never via dynamic keys).
 * Server-only values are read lazily so the UI still renders when an integration is
 * not yet configured (the relevant feature then fails with a clear, logged error).
 */

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}

/** Throws a readable error naming the missing server variable. Server code only. */
export function requireServerEnv(name: "SUPABASE_SERVICE_ROLE_KEY" | "MAILGUN_API_KEY" | "MAILGUN_DOMAIN" | "MAILGUN_FROM_EMAIL" | "PAYSTACK_SECRET_KEY"): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}. See .env.example.`);
  return value;
}

export function optionalServerEnv(name: "MAILGUN_API_BASE_URL" | "MAILGUN_REPLY_TO"): string | undefined {
  return process.env[name] || undefined;
}

/** True when card payments can be offered (a Paystack secret key is configured). Server only. */
export function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}
