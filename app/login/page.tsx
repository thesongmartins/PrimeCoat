import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/layout/logo";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { IMAGES } from "@/lib/content/images";
import { sanitizeNextPath } from "@/lib/utils/redirects";
import { getCurrentUser } from "@/lib/auth/session";

// Session-dependent: never prerender or cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = sanitizeNextPath(
    typeof sp.next === "string" ? sp.next : undefined,
  );
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const user = await getCurrentUser();
  if (user) redirect(next);

  return (
    <Container className="py-10 sm:py-16">
      <div className="grid overflow-hidden rounded-lg border border-stone bg-white lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
          <Logo />
          <h1 className="mt-10 font-display text-3xl font-medium sm:text-4xl">
            Sign in to PrimeCoat
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-mute">
            Use your Google account to check out, track orders and come back to
            your order history any time. No password to remember.
          </p>
          <div className="mt-8">
            <GoogleSignInButton next={next} />
          </div>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-md border border-danger/30 bg-danger-100 px-4 py-3 text-sm text-danger"
            >
              {error === "auth"
                ? "We couldn't complete sign-in with Google. Please try again."
                : "Something went wrong signing you in. Please try again."}
            </p>
          )}
        </div>
        <div className="relative hidden min-h-[560px] lg:block">
          <Image
            src={`${IMAGES.heroSecondary.src}&w=1200&q=80`}
            alt={IMAGES.heroSecondary.alt}
            fill
            sizes="50vw"
            className="object-cover"
          />
        </div>
      </div>
    </Container>
  );
}
