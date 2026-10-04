import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, AuthDivider } from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { sanitizeNextPath } from "@/lib/utils/redirects";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default async function SignUpPage(props: PageProps<"/signup">) {
  const sp = await props.searchParams;
  const next = sanitizeNextPath(typeof sp.next === "string" ? sp.next : undefined);
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthShell title="Create your account" description="Save your cart, check out faster and see every order in one place.">
      <GoogleSignInButton next={next} />
      <AuthDivider />
      <SignUpForm next={next} />
      <p className="mt-8 text-sm text-mute">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-charcoal underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
