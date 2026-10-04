import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, AuthDivider, FormAlert } from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";
import { sanitizeNextPath } from "@/lib/utils/redirects";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

const ERRORS: Record<string, string> = {
  auth: "We couldn't complete sign-in with Google. Please try again.",
  link: "That link is invalid or has expired. Request a new one and try again.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = sanitizeNextPath(typeof sp.next === "string" ? sp.next : undefined);
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const user = await getCurrentUser();
  if (user) redirect(next);

  return (
    <AuthShell title="Sign in to PrimeCoat" description="Check out, track orders and come back to your order history any time.">
      {error && (
        <div className="mb-6">
          <FormAlert>{ERRORS[error] ?? "Something went wrong signing you in. Please try again."}</FormAlert>
        </div>
      )}
      <GoogleSignInButton next={next} />
      <AuthDivider />
      <EmailSignInForm next={next} />
      <p className="mt-8 text-sm text-mute">
        New to PrimeCoat?{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-medium text-charcoal underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
