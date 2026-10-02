"use client";

import { useEffect, useState, Suspense } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { NAV_LINKS } from "./nav-links";
import { NavLink } from "./nav-link";
import { SearchForm } from "./search-form";
import { ButtonLink } from "@/components/ui/button";

export function MobileNav() {
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
            <div className="mt-8 grid grid-cols-2 gap-3">
              <ButtonLink href="/account" variant="outline" onClick={() => setOpen(false)}>
                Account
              </ButtonLink>
              <ButtonLink href="/orders" variant="outline" onClick={() => setOpen(false)}>
                Orders
              </ButtonLink>
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
