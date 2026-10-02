import type { Metadata } from "next";
import { LogIn } from "lucide-react";
import { AccountShell } from "@/components/account/account-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

/**
 * Phase 2: unauthenticated shell.
 * Phase 3 reads the Supabase session and renders profile, recent orders and sign-out.
 */
export default async function AccountPage() {
  return (
    <AccountShell title="My account">
      <EmptyState
        icon={<LogIn className="size-10" aria-hidden="true" />}
        title="Sign in to see your account"
        description="Your profile, delivery details and order history live here once you sign in with Google."
        action={<ButtonLink href="/login?next=/account" size="lg">Sign in</ButtonLink>}
      />
    </AccountShell>
  );
}
