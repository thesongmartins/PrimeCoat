"use client";

import { useEffect, useState, Suspense } from "react";
import { createPortal } from "react-dom";
import { Menu, Package, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { NAV_LINKS } from "./nav-links";
import { NavLink } from "./nav-link";
import { SearchForm } from "./search-form";
import { ButtonLink } from "@/components/ui/button";

export interface MobileNavUser {
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export function MobileNav({ user }: { user: MobileNavUser | null }) {
  const pathname = usePathname();
  // Store the pathname the menu was opened on; a route change closes it without an effect.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = (value: boolean) => setOpenedAt(value ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedAt(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="grid size-10 place-items-center rounded-md text-charcoal hover:bg-stone-200 lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {/* Portal: the sticky header's backdrop-filter would otherwise become the containing block for this fixed panel. */}
      {open &&
        createPortal(
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Site menu" className="fixed inset-0 z-50 flex flex-col bg-warm-white lg:hidden">
          <div className="flex h-16 items-center justify-between border-b border-stone px-4 sm:px-6">
            <Logo />
            <button type="button" className="grid size-10 place-items-center rounded-md hover:bg-stone-200" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <Suspense>
              <SearchForm onSubmitted={() => setOpen(false)} />
            </Suspense>
            <nav aria-label="Primary" className="mt-8">
              <ul className="flex flex-col divide-y divide-stone">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <NavLink href={l.href} onClick={() => setOpen(false)} className="block py-4 font-display text-2xl font-medium after:hidden">
                      {l.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-8 border-t border-stone pt-6">
              {user ? (
                <>
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt="" width={40} height={40} className="size-10 rounded-full ring-1 ring-black/10" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="grid size-10 place-items-center rounded-full bg-charcoal text-sm font-semibold text-warm-white">
                        {(user.name ?? user.email).charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{user.name ?? "PrimeCoat customer"}</p>
                      <p className="truncate text-xs text-mute">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <ButtonLink href="/account" variant="outline" onClick={() => setOpen(false)}>
                      <User className="size-4" aria-hidden="true" /> Account
                    </ButtonLink>
                    <ButtonLink href="/orders" variant="outline" onClick={() => setOpen(false)}>
                      <Package className="size-4" aria-hidden="true" /> Orders
                    </ButtonLink>
                  </div>
                  <SignOutButton
                    unstyled
                    className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-charcoal-600 hover:bg-stone-200 disabled:opacity-50"
                    onDone={() => setOpen(false)}
                  />
                </>
              ) : (
                <>
                  <ButtonLink href="/login" size="lg" className="w-full" onClick={() => setOpen(false)}>
                    <User className="size-5" aria-hidden="true" /> Sign in
                  </ButtonLink>
                  <p className="mt-3 text-center text-xs leading-relaxed text-mute">
                    Sign in with Google to check out and see your{" "}
                    <Link href="/orders" className="underline underline-offset-2" onClick={() => setOpen(false)}>
                      order history
                    </Link>
                    .
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="border-t border-stone px-4 py-4 text-center text-xs text-mute sm:px-6">
            Quality Paints. Professional Finishes.
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
