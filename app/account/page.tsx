import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LogIn, Package } from "lucide-react";
import { AccountShell } from "@/components/account/account-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { OrderList } from "@/components/orders/order-list";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrdersForCurrentUser } from "@/lib/orders/queries";
import { formatDate } from "@/lib/utils/dates";
import { isSupabaseConfigured } from "@/lib/env";

// Session-dependent: never prerender or cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    // proxy.ts normally redirects before we get here; this covers the unconfigured case.
    if (isSupabaseConfigured()) redirect("/login?next=/account");
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

  const orders = (await getOrdersForCurrentUser()).slice(0, 3);
  const initial = (user.fullName ?? user.email).charAt(0).toUpperCase();

  return (
    <AccountShell title="My account" action={<SignOutButton size="sm" />}>
      <section aria-labelledby="profile-heading" className="rounded-lg border border-stone bg-white p-6">
        <h2 id="profile-heading" className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt="" width={64} height={64} className="size-16 rounded-full ring-1 ring-black/10" referrerPolicy="no-referrer" />
          ) : (
            <span className="grid size-16 place-items-center rounded-full bg-charcoal font-display text-2xl text-warm-white">{initial}</span>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-2xl font-medium">{user.fullName ?? "PrimeCoat customer"}</p>
            <p className="truncate text-sm text-mute">{user.email}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 border-t border-stone pt-5 text-sm sm:grid-cols-3">
          <div><dt className="text-mute">Signed in with</dt><dd className="mt-0.5 font-medium">Google</dd></div>
          <div><dt className="text-mute">Member since</dt><dd className="mt-0.5 font-medium">{formatDate(user.createdAt)}</dd></div>
          <div><dt className="text-mute">Order confirmations go to</dt><dd className="mt-0.5 truncate font-medium">{user.email}</dd></div>
        </dl>
      </section>

      <section aria-labelledby="recent-orders" className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recent-orders" className="font-display text-xl font-medium">Recent orders</h2>
          {orders.length > 0 && (
            <ButtonLink href="/orders" variant="ghost" size="sm">View all</ButtonLink>
          )}
        </div>
        {orders.length ? (
          <OrderList orders={orders} />
        ) : (
          <EmptyState
            icon={<Package className="size-8" aria-hidden="true" />}
            title="No orders yet"
            description="Your orders will appear here as soon as you place one."
            action={<ButtonLink href="/shop">Browse Paints</ButtonLink>}
            className="py-12"
          />
        )}
      </section>
    </AccountShell>
  );
}
