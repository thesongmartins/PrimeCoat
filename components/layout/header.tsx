import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { CartBadge } from "@/components/cart/cart-badge";
import { CartRealtime } from "@/components/cart/cart-realtime";
import { Logo } from "./logo";
import { NAV_LINKS } from "./nav-links";
import { NavLink } from "./nav-link";
import { MobileNav } from "./mobile-nav";
import { SearchForm } from "./search-form";
import { AccountMenu } from "./account-menu";
import { getCurrentUser } from "@/lib/auth/session";
import { getCartCount } from "@/lib/cart/queries";

export async function Header() {
  const [user, cartCount] = await Promise.all([getCurrentUser(), getCartCount()]);
  const navUser = user ? { name: user.fullName, email: user.email, avatarUrl: user.avatarUrl } : null;
  return (
    <header className="sticky top-0 z-40 border-b border-stone bg-warm-white/95 backdrop-blur supports-[backdrop-filter]:bg-warm-white/85">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-charcoal focus:px-3 focus:py-2 focus:text-sm focus:text-warm-white"
      >
        Skip to content
      </a>
      <Container className="flex h-16 items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1 lg:hidden">
          <MobileNav user={navUser} />
        </div>
        <Logo className="min-w-0 lg:mr-6" />
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <NavLink href={l.href}>{l.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <div className="hidden w-64 xl:block">
            <Suspense>
              <SearchForm />
            </Suspense>
          </div>
          <AccountMenu />
          <CartBadge count={cartCount} />
          {user && <CartRealtime userId={user.id} />}
        </div>
      </Container>
    </header>
  );
}
