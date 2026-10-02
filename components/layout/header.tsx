import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { CartBadge } from "@/components/cart/cart-badge";
import { Logo } from "./logo";
import { NAV_LINKS } from "./nav-links";
import { NavLink } from "./nav-link";
import { MobileNav } from "./mobile-nav";
import { SearchForm } from "./search-form";
import { AccountMenu } from "./account-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone bg-warm-white/95 backdrop-blur supports-[backdrop-filter]:bg-warm-white/85">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-charcoal focus:px-3 focus:py-2 focus:text-sm focus:text-warm-white"
      >
        Skip to content
      </a>
      <Container className="flex h-16 items-center gap-4">
        <div className="flex items-center gap-1 lg:hidden">
          <MobileNav />
        </div>
        <Logo className="lg:mr-6" />
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
          <CartBadge />
        </div>
      </Container>
    </header>
  );
}
