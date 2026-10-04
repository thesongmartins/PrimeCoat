"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { logger } from "@/lib/utils/logger";
import { sanitizeNextPath } from "@/lib/utils/redirects";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validations/auth";

export type AuthResult =
  | { ok: true; next?: string; status?: "signed_in" | "check_email" | "sent" | "updated" }
  | { ok: false; error: string; code?: string };

/** Origin of the current request (works on localhost and behind Vercel's proxy). */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : publicEnv.siteUrl;
}

function firstIssue(err: { issues: { message: string }[] }): string {
  return err.issues[0]?.message ?? "Please check the form.";
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signInWithPassword(input: SignInInput, nextPath?: string): Promise<AuthResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { ok: false, code: "email_not_confirmed", error: "Please confirm your email first. We can send the link again." };
    }
    if (error.code === "invalid_credentials") {
      return { ok: false, code: "invalid_credentials", error: "That email and password don't match an account." };
    }
    if (error.status === 429) return { ok: false, error: "Too many attempts. Please wait a minute and try again." };
    logger.error("auth.password_sign_in_failed", { code: error.code ?? "unknown", message: error.message });
    return { ok: false, error: "We couldn't sign you in right now. Please try again." };
  }
  revalidatePath("/", "layout");
  return { ok: true, status: "signed_in", next: sanitizeNextPath(nextPath) };
}

export async function signUpWithPassword(input: SignUpInput, nextPath?: string): Promise<AuthResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const next = sanitizeNextPath(nextPath);
  const origin = await requestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { ok: false, code: "user_already_exists", error: "An account with this email already exists. Sign in instead." };
    }
    if (error.code === "weak_password") return { ok: false, error: "Choose a stronger password." };
    if (error.code === "email_address_invalid") {
      return { ok: false, code: "email_address_invalid", error: "That email address can't receive mail. Please use a real address." };
    }
    if (error.code === "email_address_not_authorized" || /sending .*email/i.test(error.message)) {
      logger.error("auth.sign_up_email_not_sent", { code: error.code ?? "unknown", message: error.message });
      return { ok: false, code: "email_not_sent", error: "We couldn't send your confirmation email. Please try again later or continue with Google." };
    }
    if (error.status === 429) return { ok: false, error: "Too many sign-up attempts. Please wait a few minutes." };
    logger.error("auth.sign_up_failed", { code: error.code ?? "unknown", message: error.message });
    return { ok: false, error: "We couldn't create your account right now. Please try again." };
  }

  // Confirmation disabled in Supabase: we already have a session.
  if (data.session) {
    revalidatePath("/", "layout");
    return { ok: true, status: "signed_in", next };
  }
  // Confirmation enabled (or the email is already registered — Supabase deliberately hides which).
  return { ok: true, status: "check_email" };
}

export async function resendConfirmation(emailAddress: string, nextPath?: string): Promise<AuthResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: emailAddress });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const origin = await requestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(sanitizeNextPath(nextPath))}` },
  });
  if (error && error.status === 429) return { ok: false, error: "Please wait a minute before requesting another email." };
  if (error) logger.warn("auth.resend_failed", { code: error.code ?? "unknown", message: error.message });
  return { ok: true, status: "sent" };
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<AuthResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const origin = await requestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });
  if (error && error.status === 429) return { ok: false, error: "Please wait a minute before requesting another email." };
  if (error) logger.warn("auth.reset_request_failed", { code: error.code ?? "unknown", message: error.message });
  // Same response whether or not the account exists, so emails can't be enumerated.
  return { ok: true, status: "sent" };
}

export async function updatePassword(input: ResetPasswordInput): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Your reset link has expired. Please request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { ok: false, error: "Choose a password you haven't used before." };
    if (error.code === "weak_password") return { ok: false, error: "Choose a stronger password." };
    logger.error("auth.update_password_failed", { code: error.code ?? "unknown", message: error.message });
    return { ok: false, error: "We couldn't update your password. Please try again." };
  }
  revalidatePath("/", "layout");
  return { ok: true, status: "updated", next: "/account" };
}
