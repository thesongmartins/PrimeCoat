import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default async function ForgotPasswordPage() {
  if (await getCurrentUser()) redirect("/account");
  return (
    <AuthShell title="Reset your password" description="Enter the email you signed up with and we&apos;ll send you a link to choose a new password.">
      <ForgotPasswordForm />
      <p className="mt-8 text-sm text-mute">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-charcoal underline-offset-4 hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
