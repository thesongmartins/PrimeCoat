import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

/** Reached from the reset email: the link signs the user in, then they set a new password here. */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=link");
  return (
    <AuthShell title="Choose a new password" description={`For ${user.email}`}>
      <ResetPasswordForm />
    </AuthShell>
  );
}
